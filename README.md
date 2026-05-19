# askjo-chatbot# Ask Jo 🇨🇲
AI-powered youth counselling and mentorship chatbot for Cameroonian youth.
Inspired by the 60th National Youth Day address.

## Project Structure
askjo-chatbot/
├── backend/      ← Python FastAPI (Edetson)
└── frontend/     ← (Teammate's work)

## Backend Setup

### 1. Clone the repo
git clone https://github.com/edetsonrawlings-cpu/askjo-chatbot.git
cd askjo-chatbot/backend

### 2. Create conda environment
conda create -n askjo python=3.11
conda activate askjo

### 3. Install dependencies
pip install -r requirements.txt

### 4. Add your API key
Create a .env file inside the backend folder:
GROQ_API_KEY=your-groq-api-key-here

Get a free key at: console.groq.com/keys

### 5. Run the server
uvicorn main:app --reload

Server runs at: http://localhost:8000

## API Endpoints

### POST /chat
Send a message to Ask Jo.

Request:
{
  "messages": [
    {"role": "user", "content": "your message here"}
  ],
  "language": "auto"
}

Response:
{
  "reply": "Ask Jo's response",
  "language_detected": "english"
}

### GET /health
Check if server is running.

## Features
- Answers questions about government youth programs
- 50 billion CFA franc entrepreneurship fund guidance
- Career counselling and entrepreneurship advice
- Bilingual responses (English & French)
- Support for youth in distress
- Anonymous and available 24/7