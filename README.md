## Add New SAT Questions (Admin/Content Creator)

To add new SAT questions to the database, use the web UI:

- [Add Question Page (localhost)](http://localhost:8080/add-question)

This page is available after running the frontend. Fill out the form and submit to add questions directly to your backend database.

---

## Key Features

- **Spaced Repetition System (SRS)**: Our advanced SRS algorithm (as effective as Anki) selects questions based on difficulty and optimal timing for maximum retention.
- **User-Friendly Interface**: An intuitive, Duolingo-inspired interface with a convenient two-button system for SRS feedback.
- **AI Assistance**: Ask AI about text passages, answers, and explanations. AI will attempt to solve questions when explanations aren't available.
- **Text Selection Tool**: Select any text to get instant AI analysis and explanation via a convenient popup.

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

### 4. Using the Application

- **Landing Page:** Visit the homepage at http://localhost:8080/ to learn about the platform
- **Practice:** Go to http://localhost:8080/practice to practice SAT questions with our SRS system (requires Google login)
- **Dashboard:** Go to http://localhost:8080/dashboard to view your study progress and statistics (requires Google login)
- **Add Questions:** Go to http://localhost:8080/add-question to add new SAT questions to the database (requires Google login)

### 5. Authentication

The application uses Google Authentication:
- All practice features require authentication
- When users click on "Start Practicing" or "Practice" links, they'll be prompted to sign in with Google
- User information is securely stored and used for personalized learning experiences

---