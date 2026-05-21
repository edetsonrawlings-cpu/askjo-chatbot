import streamlit as st
import requests

# --- Page Config ---
st.set_page_config(
    page_title="Ask Jo",
    page_icon="🇨🇲",
    layout="centered"
)

# --- Custom CSS ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500&display=swap');

    * { font-family: 'Inter', sans-serif; }

    .stApp {
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
        min-height: 100vh;
    }

    .header {
        text-align: center;
        padding: 2rem 0 1rem 0;
    }

    .header h1 {
        font-family: 'Sora', sans-serif;
        font-size: 2.8rem;
        font-weight: 700;
        background: linear-gradient(90deg, #00d4aa, #0099ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
    }

    .header p {
        color: #a0a0b0;
        font-size: 1rem;
        margin-top: 0.3rem;
    }

    .flag {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    /* Chat messages */
    .user-msg {
        background: linear-gradient(135deg, #0099ff, #0066cc);
        color: white;
        padding: 0.9rem 1.2rem;
        border-radius: 18px 18px 4px 18px;
        margin: 0.5rem 0;
        margin-left: 15%;
        font-size: 0.95rem;
        line-height: 1.5;
        box-shadow: 0 4px 15px rgba(0, 153, 255, 0.3);
    }

    .bot-msg {
        background: linear-gradient(135deg, #1e1e3a, #252545);
        color: #e0e0f0;
        padding: 0.9rem 1.2rem;
        border-radius: 18px 18px 18px 4px;
        margin: 0.5rem 0;
        margin-right: 15%;
        font-size: 0.95rem;
        line-height: 1.5;
        border: 1px solid rgba(0, 212, 170, 0.2);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .bot-name {
        color: #00d4aa;
        font-weight: 600;
        font-size: 0.8rem;
        margin-bottom: 0.3rem;
        font-family: 'Sora', sans-serif;
    }

    .divider {
        border: none;
        border-top: 1px solid rgba(255,255,255,0.05);
        margin: 1rem 0;
    }

    /* Input area */
    .stTextInput > div > div > input {
        background: rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(0, 212, 170, 0.3) !important;
        border-radius: 12px !important;
        color: black !important;
        padding: 0.8rem 1rem !important;
        font-size: 0.95rem !important;
    }
       .stTextInput > div > div > input::placeholder {
           color: rgba(255,255,255,0.4) !important;
       }

       input {
           color: black !important;
           caret-color: black !important;
      }     

    .stTextInput > div > div > input:focus {
        border-color: #00d4aa !important;
        box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.2) !important;
    }

    .stButton > button {
        background: linear-gradient(135deg, #00d4aa, #0099ff) !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 0.6rem 2rem !important;
        font-weight: 600 !important;
        font-family: 'Sora', sans-serif !important;
        transition: all 0.2s ease !important;
        width: 100% !important;
    }

    .stButton > button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(0, 212, 170, 0.4) !important;
    }

    .suggested {
        background: rgba(0, 212, 170, 0.08);
        border: 1px solid rgba(0, 212, 170, 0.25);
        border-radius: 10px;
        padding: 0.5rem 0.8rem;
        color: #00d4aa;
        font-size: 0.82rem;
        cursor: pointer;
        text-align: center;
        margin: 0.2rem;
        transition: all 0.2s;
    }

    .welcome-msg {
        background: linear-gradient(135deg, #1e1e3a, #252545);
        border: 1px solid rgba(0, 212, 170, 0.2);
        border-radius: 18px 18px 18px 4px;
        padding: 1.2rem;
        margin-right: 15%;
        color: #e0e0f0;
        font-size: 0.95rem;
        line-height: 1.6;
    }

    /* Hide streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

# --- Header ---
st.markdown("""
<div class="header">
    <div class="flag">🇨🇲</div>
    <h1>Ask Jo</h1>
    <p>Your AI guide for Cameroonian youth — available 24/7</p>
</div>
<hr class="divider">
""", unsafe_allow_html=True)

# --- Session State ---
if "messages" not in st.session_state:
    st.session_state.messages = []

if "input_key" not in st.session_state:
    st.session_state.input_key = 0

# --- Welcome message ---
if not st.session_state.messages:
    st.markdown("""
    <div class="welcome-msg">
        <div class="bot-name">✨ Ask Jo</div>
        Bonjour / Hello! I'm Jo, your personal guide for opportunities in Cameroon. 🇨🇲<br><br>
        I can help you with:<br>
        • Government youth programs & the 50B CFA fund<br>
        • Career guidance & entrepreneurship<br>
        • Support if you're feeling lost or hopeless<br><br>
        Ask me anything — in English or French!
    </div>
    <br>
    """, unsafe_allow_html=True)

# --- Display chat history ---
for msg in st.session_state.messages:
    if msg["role"] == "user":
        st.markdown(f'<div class="user-msg">{msg["content"]}</div>', unsafe_allow_html=True)
    else:
        st.markdown(f'<div class="bot-msg"><div class="bot-name">✨ Ask Jo</div>{msg["content"]}</div>', unsafe_allow_html=True)

# --- Suggested questions (only at start) ---
if not st.session_state.messages:
    st.markdown("**Quick questions:**")
    col1, col2 = st.columns(2)
    suggestions = [
        "How do I apply for the 50B CFA fund?",
        "Comment trouver un emploi?",
        "I want to start a business",
        "I feel hopeless about my future"
    ]
    for i, suggestion in enumerate(suggestions):
        col = col1 if i % 2 == 0 else col2
        with col:
            if st.button(suggestion, key=f"suggest_{i}"):
                st.session_state.pending_input = suggestion
                st.rerun()

# --- Handle suggested input ---
if "pending_input" in st.session_state:
    user_input = st.session_state.pending_input
    del st.session_state.pending_input

    st.session_state.messages.append({"role": "user", "content": user_input})

    with st.spinner("Jo is thinking..."):
        try:
            response = requests.post(
                "http://127.0.0.1:8000/chat",
                json={"messages": st.session_state.messages, "language": "auto"},
                timeout=30
            )
            data = response.json()
            st.session_state.messages.append({"role": "assistant", "content": data["reply"]})
        except Exception as e:
            st.session_state.messages.append({
                "role": "assistant",
                "content": "Sorry, I'm having trouble connecting. Please make sure the backend server is running."
            })
    st.rerun()

# --- Input box ---
st.markdown("<br>", unsafe_allow_html=True)
col_input, col_btn = st.columns([5, 1])

with col_input:
    user_input = st.text_input(
        "Message",
        placeholder="Ask Jo anything... / Posez une question à Jo...",
        label_visibility="collapsed",
        key=f"input_{st.session_state.input_key}",
        autocomplete="off"
    )

with col_btn:
    send = st.button("Send →")

# --- Handle send ---
if (send or user_input) and user_input.strip():
    st.session_state.messages.append({"role": "user", "content": user_input.strip()})
    st.session_state.input_key += 1

    with st.spinner("Jo is thinking..."):
        try:
            response = requests.post(
                "http://127.0.0.1:8000/chat",
                json={"messages": st.session_state.messages, "language": "auto"},
                timeout=30
            )
            data = response.json()
            st.session_state.messages.append({"role": "assistant", "content": data["reply"]})
        except Exception as e:
            st.session_state.messages.append({
                "role": "assistant",
                "content": "Sorry, I'm having trouble connecting. Please make sure the backend server is running."
            })
    st.rerun()

# --- Clear chat button ---
if st.session_state.messages:
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("🗑️ Clear chat"):
        st.session_state.messages = []
        st.rerun()
