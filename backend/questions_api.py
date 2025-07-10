from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from db import Question, engine

router = APIRouter()

@router.get("/questions")
async def get_questions():
    async with AsyncSession(engine) as session:
        result = await session.execute(select(Question))
        questions = result.scalars().all()
        # Convert to dicts for JSON serialization
        return {"questions": [q.__dict__ for q in questions]}
