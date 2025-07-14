<h1 align="center">SAT Practice Platform</h1>

## Overview
This project is a full-stack SAT practice and learning platform featuring:
- **Spaced Repetition System (SRS)** for optimal retention
- **AI-powered explanations** (OpenAI/Gemini)
- **Modern, accessible UI** inspired by professional testing platforms
- **Admin interface** for adding new questions

---

## Features
- **Spaced Repetition (SRS):** Advanced algorithm selects questions for maximum learning efficiency
- **AI Assistance:** Get instant explanations for questions and text selections
- **User-Friendly Interface:** Clean, responsive, and accessible design
- **Admin Tools:** Add new SAT questions via web UI
- **Authentication:** Google login for personalized experience

---

## Quick Start

### 1. Backend (FastAPI)
**Requirements:** Python 3.8+, PostgreSQL, OpenAI/Gemini API key

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Configure environment variables:
echo 'DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/potential"' > .env
echo 'OPENAI_API_KEY="your_openai_api_key_here"' >> .env
# (Optional) Gemini:
echo 'GEMINI_API_KEY="your_gemini_api_key_here"' >> .env
# Initialize database:
python setup_db.py
# Run server:
uvicorn main:app --reload --port 8079
```
API available at: http://localhost:8079

### 2. Frontend (React + Vite)
**Requirements:** Node.js, npm

```bash
cd frontend
npm install
npm run dev
```
App available at: http://localhost:8080

---

## Usage
- **Landing Page:** http://localhost:8080/
- **Practice:** http://localhost:8080/practice (Google login required)
- **Dashboard:** http://localhost:8080/dashboard (Google login required)
- **Add Questions:** http://localhost:8080/add-question (Admin only)

### Add New SAT Questions
Use the web UI at `/add-question` to submit new questions directly to the backend database.

---

## Deployment
- **Backend:** Use a production ASGI server (e.g. gunicorn+uvicorn) and set environment variables securely
- **Frontend:** Build with `npm run build` and serve `dist/` with a static file server (nginx, Vercel, Netlify, etc.)

---

## Authentication
Google Authentication is required for all practice and dashboard features. User data is securely stored for personalized learning.

---

## Developer Notes

- **Backend API:** See `backend/README.md` for API details and endpoints
- **Frontend UI:** See `frontend/README.md` for component and customization info
- **Design System:** Educational color scheme and accessibility features are built-in

---

## License
See [LICENSE](LICENSE)