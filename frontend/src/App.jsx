import { useState, useRef, useEffect, useCallback } from "react";

const BACKEND_URL = "http://localhost:8000";

const SUGGESTIONS = [
  { en: "Tell me about the 50 billion CFA franc fund", fr: "Parlez-moi du fonds de 50 milliards CFA" },
  { en: "How can I find employment through NEF?", fr: "Comment trouver un emploi via le FNE?" },
  { en: "I want to start a business in agriculture", fr: "Je veux créer une entreprise agricole" },
  { en: "Career advice for recent graduates", fr: "Conseils de carrière pour jeunes diplômés" },
];

const FLAG = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="6.67" height="14" fill="#007A5E"/>
    <rect x="6.67" width="6.67" height="14" fill="#CE1126"/>
    <rect x="13.33" width="6.67" height="14" fill="#FCD116"/>
    <polygon points="10,3.5 10.9,6.2 13.7,6.2 11.5,7.8 12.3,10.5 10,8.8 7.7,10.5 8.5,7.8 6.3,6.2 9.1,6.2" fill="#FCD116"/>
  </svg>
);

const JoAvatar = ({ size = 36, pulse = false }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: "linear-gradient(135deg, #007A5E 0%, #00B482 50%, #FCD116 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, position: "relative",
    boxShadow: pulse ? "0 0 0 3px rgba(0,180,130,0.25), 0 0 0 6px rgba(0,180,130,0.1)" : "none",
    transition: "box-shadow 0.3s ease"
  }}>
    <span style={{ color: "#fff", fontSize: size * 0.44, fontWeight: 700, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.5px" }}>J</span>
  </div>
);

const TypingDots = () => (
  <div style={{ display: "flex", gap: 4, padding: "4px 0", alignItems: "center" }}>
    {[0,1,2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "rgba(0,122,94,0.5)",
        animation: "typingBounce 1.2s ease-in-out infinite",
        animationDelay: `${i * 0.2}s`
      }}/>
    ))}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    online: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
    offline: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
    checking: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  };
  const c = colors[status] || colors.checking;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: c.bg }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, animation: status === "online" ? "pulse 2s infinite" : "none" }}/>
      <span style={{ fontSize: 11, fontWeight: 600, color: c.text, fontFamily: "'Sora', sans-serif", letterSpacing: 0.3 }}>
        {status === "online" ? "ONLINE" : status === "offline" ? "OFFLINE" : "..."}
      </span>
    </div>
  );
};

const MessageBubble = ({ msg, isLatest }) => {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", gap: 10,
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-end",
      animation: isLatest ? "slideUp 0.3s ease" : "none",
      marginBottom: 4,
    }}>
      {!isUser && <JoAvatar size={32} />}
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>U</span>
        </div>
      )}
      <div style={{
        maxWidth: "72%",
        background: isUser
          ? "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)"
          : "white",
        color: isUser ? "#fff" : "#1a2e1d",
        borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
        padding: "11px 15px",
        fontSize: 14.5,
        lineHeight: 1.65,
        fontFamily: "'Inter', sans-serif",
        boxShadow: isUser ? "0 2px 12px rgba(37,99,235,0.25)" : "0 2px 12px rgba(0,0,0,0.07)",
        border: isUser ? "none" : "1px solid rgba(0,122,94,0.1)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {msg.content}
        <div style={{
          fontSize: 10, marginTop: 5, opacity: 0.55, textAlign: "right",
          fontFamily: "'Sora', sans-serif", letterSpacing: 0.2
        }}>
          {msg.time || ""}
          {msg.lang && !isUser && (
            <span style={{ marginLeft: 6, background: "rgba(0,122,94,0.1)", padding: "1px 5px", borderRadius: 8, fontSize: 10 }}>
              {msg.lang === "french" ? "FR" : msg.lang === "english" ? "EN" : "AUTO"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AskJo() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [language, setLanguage] = useState("auto");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) setBackendStatus("online");
      else setBackendStatus("offline");
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text) => {
    const content = text || input.trim();
    if (!content || isLoading) return;
    setErrorMsg("");
    setInput("");
    setShowSuggestions(false);

    const userMsg = { role: "user", content, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          language,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        lang: data.language_detected,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setBackendStatus("online");
    } catch (err) {
      if (err.name === "TimeoutError") {
        setErrorMsg("Request timed out. The server may be starting up.");
      } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setBackendStatus("offline");
        setErrorMsg("Cannot reach the backend. Make sure the server is running at " + BACKEND_URL);
      } else {
        setErrorMsg(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, messages, language, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setErrorMsg("");
    setSidebarOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; background: #f0f4f0; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,122,94,0.3); border-radius: 4px; }
        textarea:focus { outline: none; }
        .suggestion-pill:hover { background: #007A5E !important; color: #fff !important; transform: translateY(-1px); }
        .suggestion-pill { transition: all 0.18s ease; }
        .send-btn:hover:not(:disabled) { background: #005e47 !important; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .send-btn { transition: all 0.15s ease; }
        .sidebar-overlay { animation: fadeIn 0.2s ease; }
        .sidebar-panel { animation: slideInRight 0.25s ease; }
        .lang-btn:hover { background: rgba(0,122,94,0.12) !important; }
        .lang-btn.active { background: #007A5E !important; color: white !important; }
        .clear-btn:hover { background: #fee2e2 !important; color: #991b1b !important; }
      `}</style>

      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        fontFamily: "'Inter', sans-serif", background: "#eef4ee",
        position: "relative", overflow: "hidden",
      }}>

        {/* Decorative background */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 20% 20%, rgba(0,180,130,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(252,209,22,0.06) 0%, transparent 60%)",
        }}/>

        {/* Header */}
        <header style={{
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,122,94,0.12)",
          padding: "0 20px", height: 64, display: "flex", alignItems: "center",
          justifyContent: "space-between", position: "relative", zIndex: 10,
          boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <JoAvatar size={40} pulse={backendStatus === "online"} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Sora', sans-serif", color: "#0a1f0a", letterSpacing: "-0.3px" }}>Ask Jo</span>
                <FLAG />
              </div>
              <div style={{ fontSize: 11.5, color: "#4a7c5a", fontFamily: "'Sora', sans-serif" }}>
                AI Youth Assistant · Cameroon
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge status={backendStatus} />
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(0,122,94,0.2)",
                background: "transparent", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#007A5E", fontSize: 18
              }}
              title="Settings & Info"
            >
              ☰
            </button>
          </div>
        </header>

        {/* Language bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 20px",
          background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(0,122,94,0.07)", zIndex: 9,
        }}>
          <span style={{ fontSize: 11, color: "#4a7c5a", fontFamily: "'Sora', sans-serif", fontWeight: 600, letterSpacing: 0.4 }}>LANGUAGE</span>
          {["auto", "english", "french"].map(lang => (
            <button
              key={lang}
              className={`lang-btn ${language === lang ? "active" : ""}`}
              onClick={() => setLanguage(lang)}
              style={{
                padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(0,122,94,0.25)",
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Sora', sans-serif",
                background: language === lang ? "#007A5E" : "transparent",
                color: language === lang ? "white" : "#007A5E",
                letterSpacing: 0.3,
              }}
            >
              {lang === "auto" ? "AUTO" : lang === "english" ? "EN" : "FR"}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div
          ref={chatRef}
          style={{
            flex: 1, overflowY: "auto", padding: "20px 16px",
            display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1,
            maxWidth: 720, margin: "0 auto", width: "100%",
          }}
        >
          {/* Welcome */}
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0 10px", animation: "fadeIn 0.5s ease" }}>
              <JoAvatar size={64} pulse />
              <h2 style={{
                fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700,
                color: "#0a1f0a", marginTop: 16, marginBottom: 6, letterSpacing: "-0.5px"
              }}>
                Hello! I'm Ask Jo 👋
              </h2>
              <p style={{ color: "#4a7c5a", fontSize: 14.5, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
                Your AI mentor for Cameroonian youth. Ask me about jobs, government programs, entrepreneurship, or anything you need guidance on.
              </p>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && messages.length === 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", padding: "8px 0 16px" }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-pill"
                  onClick={() => sendMessage(language === "french" ? s.fr : s.en)}
                  style={{
                    padding: "8px 14px", borderRadius: 20,
                    border: "1px solid rgba(0,122,94,0.3)",
                    background: "rgba(255,255,255,0.85)",
                    color: "#007A5E", cursor: "pointer",
                    fontSize: 13, fontFamily: "'Inter', sans-serif",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {language === "french" ? s.fr : s.en}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} isLatest={i === messages.length - 1} />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", animation: "slideUp 0.3s ease" }}>
              <JoAvatar size={32} />
              <div style={{
                background: "white", borderRadius: "4px 18px 18px 18px",
                padding: "10px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                border: "1px solid rgba(0,122,94,0.1)",
              }}>
                <TypingDots />
              </div>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 12, padding: "12px 16px",
              display: "flex", gap: 10, alignItems: "flex-start",
              animation: "slideUp 0.3s ease",
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b", marginBottom: 2 }}>Connection Error</div>
                <div style={{ fontSize: 12.5, color: "#7f1d1d", lineHeight: 1.5 }}>{errorMsg}</div>
                {backendStatus === "offline" && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#9a3412" }}>
                    Run: <code style={{ background: "#fee2e2", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>uvicorn main:app --reload</code> in <code style={{ background: "#fee2e2", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>backend/</code>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(0,122,94,0.1)",
          padding: "14px 16px 18px", position: "relative", zIndex: 10,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            maxWidth: 720, margin: "0 auto",
            display: "flex", gap: 10, alignItems: "flex-end",
          }}>
            <div style={{
              flex: 1, background: "#f5f9f5",
              border: "1.5px solid rgba(0,122,94,0.25)",
              borderRadius: 16, padding: "10px 14px",
              display: "flex", flexDirection: "column",
              transition: "border-color 0.2s ease",
              boxShadow: "0 1px 8px rgba(0,122,94,0.05)",
            }}
              onFocus={() => {}} onBlur={() => {}}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === "french" ? "Posez votre question à Jo..." : "Ask Jo anything about jobs, programs, entrepreneurship..."}
                rows={1}
                style={{
                  background: "transparent", border: "none",
                  resize: "none", fontSize: 14.5, color: "#0a1f0a",
                  fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
                  maxHeight: 120, minHeight: 22,
                  overflowY: "auto",
                }}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                disabled={isLoading}
              />
            </div>
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || backendStatus === "offline"}
              style={{
                width: 46, height: 46, borderRadius: 14, border: "none",
                background: "#007A5E", color: "white",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
                boxShadow: "0 3px 12px rgba(0,122,94,0.35)",
              }}
              title="Send message (Enter)"
            >
              ↑
            </button>
          </div>
          <div style={{
            maxWidth: 720, margin: "8px auto 0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 11, color: "#7dab8a", fontFamily: "'Sora', sans-serif" }}>
              Press <kbd style={{ background: "#e8f5e9", padding: "1px 5px", borderRadius: 4, fontSize: 10, fontFamily: "monospace" }}>Enter</kbd> to send · <kbd style={{ background: "#e8f5e9", padding: "1px 5px", borderRadius: 4, fontSize: 10, fontFamily: "monospace" }}>Shift+Enter</kbd> for new line
            </span>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, color: "#9ab39e", fontFamily: "'Sora', sans-serif",
                }}
              >
                Clear chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 100, display: "flex", justifyContent: "flex-end",
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="sidebar-panel"
            style={{
              width: 300, height: "100%",
              background: "white", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
              overflowY: "auto", padding: "0 0 24px",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: "18px 20px 16px",
              borderBottom: "1px solid rgba(0,122,94,0.1)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: "#0a1f0a" }}>About Ask Jo</span>
              <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888", lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <JoAvatar size={56} pulse={backendStatus === "online"} />
                <div style={{ marginTop: 10, fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: "#0a1f0a" }}>Ask Jo</div>
                <div style={{ fontSize: 12, color: "#4a7c5a", marginTop: 3 }}>AI-powered Youth Counsellor</div>
                <div style={{ marginTop: 8 }}><StatusBadge status={backendStatus} /></div>
              </div>

              <div style={{ background: "#f5f9f5", borderRadius: 12, padding: 14 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: "#007A5E", marginBottom: 10, letterSpacing: 0.5 }}>WHAT I CAN HELP WITH</div>
                {[
                  "🏛️ Government youth programs",
                  "💼 50 billion CFA fund guidance",
                  "📋 National Employment Fund (NEF)",
                  "🌾 Agriculture & business opportunities",
                  "🎓 Career advice for graduates",
                  "💚 Youth in distress support",
                  "🇨🇲 Digital citizenship & awareness",
                ].map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#2d5a3d", padding: "4px 0", borderBottom: i < 6 ? "1px solid rgba(0,122,94,0.07)" : "none" }}>
                    {item}
                  </div>
                ))}
              </div>

              <div style={{ background: "#f5f9f5", borderRadius: 12, padding: 14 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: "#007A5E", marginBottom: 10, letterSpacing: 0.5 }}>API ENDPOINTS</div>
                {[
                  { method: "GET", path: "/", desc: "Root check" },
                  { method: "GET", path: "/health", desc: "Health check" },
                  { method: "POST", path: "/chat", desc: "Send message" },
                ].map((ep, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: i < 2 ? "1px solid rgba(0,122,94,0.07)" : "none" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                      background: ep.method === "GET" ? "#d1fae5" : "#dbeafe",
                      color: ep.method === "GET" ? "#065f46" : "#1e40af",
                      fontFamily: "monospace",
                    }}>{ep.method}</span>
                    <code style={{ fontSize: 12, color: "#374151", fontFamily: "monospace", flex: 1 }}>{ep.path}</code>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{ep.desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "#f5f9f5", borderRadius: 12, padding: 14 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: "#007A5E", marginBottom: 8, letterSpacing: 0.5 }}>BACKEND CONFIG</div>
                <div style={{ fontSize: 12, color: "#4a7c5a" }}>
                  <div>Model: <code style={{ background: "#e8f5e9", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>llama-3.3-70b-versatile</code></div>
                  <div style={{ marginTop: 5 }}>Provider: <code style={{ background: "#e8f5e9", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>Groq</code></div>
                  <div style={{ marginTop: 5 }}>Server: <code style={{ background: "#e8f5e9", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>{BACKEND_URL}</code></div>
                </div>
              </div>

              <button
                className="clear-btn"
                onClick={clearChat}
                style={{
                  padding: "10px", borderRadius: 10, border: "1px solid #fecaca",
                  background: "transparent", color: "#ef4444",
                  cursor: "pointer", fontSize: 13, fontFamily: "'Sora', sans-serif",
                  fontWeight: 600, transition: "all 0.15s ease",
                }}
              >
                🗑️ Clear Conversation
              </button>

              <div style={{ textAlign: "center", fontSize: 11, color: "#9ab39e", fontFamily: "'Sora', sans-serif" }}>
                Inspired by the 60th National Youth Day 🇨🇲
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}