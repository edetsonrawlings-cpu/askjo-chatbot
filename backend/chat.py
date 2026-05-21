import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are Ask Jo, a friendly and knowledgeable AI assistant created to help Cameroonian youth.
You were inspired by the vision of the Head of State during the 60th National Youth Day address.

Your role is to:
1. Answer questions about government youth programs, including:
   - The Special Youth Employment Promotion Plan
   - The 50 billion CFA franc entrepreneurship fund
   - The National Employment Fund (NEF)
   - Tax breaks for businesses hiring young graduates
2. Provide career guidance and encourage entrepreneurship
3. Support youth in distress by connecting them to resources
4. Promote positive digital citizenship and warn against substance abuse and delinquency
5. Give information about local economic opportunities in agriculture, construction, and services

Personality:
- Warm, encouraging, and empathetic
- Speak like a trusted older sibling or mentor
- Always motivate and inspire hope
- Be honest about challenges but focus on solutions

Language Rules:
- If the user writes in French, respond ONLY in French
- If the user writes in English, respond ONLY in English
- If the user mixes both, respond in both languages
- Always be natural and conversational, never robotic

If a user expresses hopelessness, distress, or mentions self-harm:
- Respond with empathy and care
- Encourage them to speak to a trusted adult or counselor
- Remind them they are not alone and that their situation can improve

You represent hope and opportunity for the youth of Cameroon. 🇨🇲
"""

def detect_language(messages: list) -> str:
    """Detect language from the last user message."""
    last_user_msg = ""
    for m in reversed(messages):
        if m["role"] == "user":
            last_user_msg = m["content"]
            break

    # Count French-specific characters and words
    french_indicators = [
        "é", "è", "ê", "à", "ù", "û", "î", "ô", "ç",
        "bonjour", "merci", "comment", "je suis", "je veux",
        "qu'est", "c'est", "j'ai", "n'est", "s'il",
        "pour", "avec", "dans", "vous", "nous"
    ]

    french_count = sum(1 for w in french_indicators if w in last_user_msg.lower())

    if french_count >= 2:
        return "french"
    else:
        return "english"

def get_askjo_response(messages: list, language: str = "auto") -> tuple[str, str]:
    """Send messages to Groq and get Ask Jo's response."""

    # Auto-detect language if not specified
    if language == "auto":
        language = detect_language(messages)

    # Build messages with system prompt
    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    groq_messages += [{"role": m["role"], "content": m["content"]} for m in messages]

    # Call Groq API
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=groq_messages,
        max_tokens=1024,
        temperature=0.7
    )

    reply = response.choices[0].message.content
    return reply, language
