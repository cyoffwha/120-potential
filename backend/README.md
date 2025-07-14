
# Backend API (FastAPI)

This is the backend for the SAT Practice Platform. It provides a FastAPI server with endpoints for SAT questions, answers, and AI explanations.

## Setup & Usage
See the [root README](../README.md) for full setup instructions.

**Quick Start:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Configure .env with your API keys and database URL
uvicorn main:app --reload --port 8079
```

## API Endpoints
- `/dialog` (POST): Get AI explanation for a question
  - Request: `{ "question": "Your SAT question here" }`
  - Response: `{ "answer": "..." }`

## Environment Variables
- `DATABASE_URL` (PostgreSQL connection string)
- `OPENAI_API_KEY` (required for AI explanations)
- `GEMINI_API_KEY` (optional, for Gemini AI)

---
For more details, see the main [README](../README.md).
