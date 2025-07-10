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
        # Convert to dicts for JSON serialization and filter out SQLAlchemy internal attributes
        questions_list = [{k: v for k, v in q.__dict__.items() if not k.startswith('_')} for q in questions]
        return {"questions": questions_list}
