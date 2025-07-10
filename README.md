## Add New SAT Questions (Admin/Content Creator)

To add new SAT questions to the database, use the web UI:

- [Add Question Page (localhost)](http://localhost:8080/add-question)

This page is available after running the frontend. Fill out the form and submit to add questions directly to your backend database.

It is a SAT and IELTS preparation app. It is almost a guarantee for the acceptance into NU. Though it's not the case with the other universities, scores alone greatly increase your chances. No need to pay 400K for courses and waste money. That is, if you can keep up. You must do this daily, to achieve results. If you can't do this, go and cry. Donkey.

Core functionaliy for now should only include SAT, specifically:
- Glorious Spaced Repetition System(SRS) (as good as in Anki) will pick the questions according to the difficulty and SRS timing.
- Also applied SRS to the flashcards.
- Have a user friendly interface(as convenient as Duolingo). I mean, the user has 2 buttoons after answering to feed the SRS.
- You can ask AI about the text, answers, and their explanation. If there aren't any, AI will try to solve the question.
- Select the text and there will be a popup to ask AI about it

For now, plan is to generate a database by feeding about 100 questions from a question bank from College Board.

---

## Project Setup & Deployment

### 1. Backend (FastAPI)

#### Prerequisites
- Python 3.8+
- PostgreSQL running locally (default: user `postgres`, password `postgres`, db `potential`)
- [Optional] Google Gemini API key (for AI explanations)

#### Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create .env file with your secrets:
echo 'DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/potential"' > .env
echo 'GEMINI_API_KEY="your_gemini_api_key_here"' >> .env
# Initialize database (creates DB and tables):
python setup_db.py
```

#### Running the Backend
```bash
cd backend
uvicorn main:app --reload --port 8079
```
The backend will be available at http://localhost:8079

### 2. Frontend (React + TypeScript + Vite)

#### Setup
```bash
cd frontend
npm install
```

#### Running the Frontend
```bash
npm run dev
```
The frontend will be available at http://localhost:8080

### 3. Deployment

- **Backend:** Use a production ASGI server (e.g. gunicorn with uvicorn workers) and set environment variables for production DB/API keys.
- **Frontend:** Build with `npm run build` and serve the `dist/` folder with a static file server (e.g. nginx, Vercel, Netlify).

### 4. Adding Questions

- Go to http://localhost:8080/add-question to add SAT questions to the database via the web UI.

---