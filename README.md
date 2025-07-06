It is a SAT and IELTS preparation app. It is almost a guarantee for the acceptance into NU. Though it's not the case with the other universities, scores alone greatly increase your chances. No need to pay 400K for courses and waste money. That is, if you can keep up. You must do this daily, to achieve results. If you can't do this, go and cry. Donkey.

Core functionaliy for now should only include SAT, specifically:
- Glorious Spaced Repetition System(SRS) (as good as in Anki) will pick the questions according to the difficulty and SRS timing.
- Also applied SRS to the flashcards.
- Have a user friendly interface(as convenient as Duolingo). I mean, the user has 2 buttoons after answering to feed the SRS.
- You can ask AI about the text, answers, and their explanation. If there aren't any, AI will try to solve the question.
- Select the text and there will be a popup to ask AI about it

For now, plan is to generate a database by feeding about 100 questions from a question bank from College Board.

---

## How to Run the App

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend will be available at http://localhost:8000

### 2. Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

---