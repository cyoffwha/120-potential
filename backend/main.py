from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import insert, select
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import jwt
import datetime
import openai

from db import User, SessionLocal, engine, Base, Question
from questions_api import router as questions_router


load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "https://120potential.app", "https://120-potential.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Include questions API router ---
app.include_router(questions_router)

class DialogRequest(BaseModel):
    passage: str
    question: str
    answer_explanation: str
    user_message: str


# Model for creating a new SAT question
class QuestionCreate(BaseModel):
    image: str | None = None
    passage: str | None = None
    question: str
    choice_a: str
    choice_b: str
    choice_c: str
    choice_d: str
    correct_choice: str # Must be 'A', 'B', 'C', or 'D'
    rationale_a: str | None = None
    rationale_b: str | None = None
    rationale_c: str | None = None
    rationale_d: str | None = None
    difficulty: str  # Must be one of: Easy, Medium, Hard, Very Hard
    domain: str      # e.g. Craft and Structure
    skill: str       # e.g. Cross-Text Connections

# Endpoint to add a new SAT question
@app.post("/questions")
async def create_question(q: QuestionCreate):
    try:
        async with AsyncSession(engine) as session:
            stmt = insert(Question).values(**q.dict())
            await session.execute(stmt)
            await session.commit()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/dialog")
async def dialog(req: DialogRequest):
    import openai
    prompt = (
        "You are an expert SAT tutor. Use the reading passage, the question, and the official answer explanation to answer the user's follow-up question. "
        "Be concise, factual, and only answer within the context of the SAT material provided, and SAT in general like Erica Grammar/Reading, Hard SAT questions, Panda, etc. If the user asks something off-topic, irrelevant, or not related to SAT, respond with something helping, determining, motivating to study the SAT. Do not provide generic, evasive, or off-topic responses.\n"
        f"Reading Passage: {req.passage}\n"
        f"Question: {req.question}\n"
        f"Official Answer Explanation: {req.answer_explanation}\n"
        f"User: {req.user_message}\nAnswer:"
    )
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Stick to the context. You are an expert SAT tutor. Use the reading passage, the question, and the official answer explanation to answer the user's follow-up question. Be concise, factual, and only answer within the context of the SAT material provided, and SAT in general like Erica Grammar/Reading, Hard SAT questions, Panda, etc. If the user asks something off-topic, irrelevant, or not related to SAT, respond with something helping, determining, motivating to study the SAT. Do not provide generic, evasive, or off-topic responses.\n"},
                {"role": "user", "content": prompt}
            ],
            max_tokens=512,
            temperature=0.2,
        )
        answer = response.choices[0].message.content.strip()
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GoogleAuthRequest(BaseModel):
    credential: str

@app.post("/auth/google")
async def auth_google(req: GoogleAuthRequest):
    try:
        # Decode JWT without verification (for demo; in prod, verify with Google certs)
        payload = jwt.decode(req.credential, options={"verify_signature": False})
        # Extract all available fields
        user_data = {
            "sub": payload.get("sub"),
            "name": payload.get("name"),
            "email": payload.get("email"),
            "picture": payload.get("picture"),
            "given_name": payload.get("given_name"),
            "family_name": payload.get("family_name"),
            "locale": payload.get("locale"),
            "email_verified": str(payload.get("email_verified")),
            "hd": payload.get("hd"),
        }
        async with AsyncSession(engine) as session:
            result = await session.execute(select(User).where(User.sub == user_data["sub"]))
            user = result.scalar_one_or_none()
            if user:
                # Update existing user
                for k, v in user_data.items():
                    setattr(user, k, v)
            else:
                user = User(**user_data)
                session.add(user)
            await session.commit()
        return {"status": "ok", "user": user_data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
