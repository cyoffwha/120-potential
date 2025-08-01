from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case, update, delete

from db import engine, User, Question, UserQuestionAttempt, UserStudySession, UserProgress

# Database dependency
async def get_db():
    async with AsyncSession(engine) as session:
        yield session

router = APIRouter(prefix="/progress", tags=["progress"])

# Request models
class SubmitAnswerRequest(BaseModel):
    question_id: str
    selected_choice: str
    is_correct: bool
    time_elapsed_seconds: float

# Response models
class SubmitAnswerResponse(BaseModel):
    success: bool
    message: str

class DifficultyBreakdown(BaseModel):
    easy: int
    medium: int
    hard: int

class DomainStats(BaseModel):
    domain: str
    attempted: int
    correct: int
    accuracy: float

class UserStatsResponse(BaseModel):
    questionsAnswered: int
    totalQuestions: int
    completionRate: float
    accuracy: float
    streakDays: int
    difficultyBreakdown: DifficultyBreakdown
    domainPerformance: List[DomainStats]

@router.post("/submit-answer", response_model=SubmitAnswerResponse)
async def submit_answer(
    request: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db)
):
    """Submit a user's answer to a question"""
    try:
        # For now, use hardcoded user ID (in real app, get from auth)
        user_sub = "102668604194363784471"
        
        user_result = await db.execute(select(User).where(User.sub == user_sub))
        user = user_result.scalar_one_or_none()
        
        if not user:
            # In a real app, you might create the user here or rely on auth flow
            raise HTTPException(status_code=404, detail="User not found")
        
        question_result = await db.execute(select(Question).where(Question.question_id == request.question_id))
        if not question_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Question not found")

        # Delete any existing attempt for this user+question
        await db.execute(
            delete(UserQuestionAttempt).where(
                UserQuestionAttempt.user_id == user.id,
                UserQuestionAttempt.question_id == request.question_id
            )
        )

        # Create new attempt record
        attempt = UserQuestionAttempt(
            user_id=user.id,
            question_id=request.question_id,
            selected_choice=request.selected_choice,
            is_correct=request.is_correct,
            time_elapsed_seconds=request.time_elapsed_seconds,
            attempted_at=datetime.utcnow()
        )
        db.add(attempt)
        
        await db.commit()
        
        return SubmitAnswerResponse(
            success=True,
            message=f"Answer submitted successfully for question {request.question_id}"
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(db: AsyncSession = Depends(get_db)):
    """Get comprehensive user statistics"""
    try:
        # For now, use hardcoded user ID
        user_sub = "102668604194363784471"
        
        user_result = await db.execute(select(User).where(User.sub == user_sub))
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        total_questions_result = await db.execute(select(func.count(Question.id)))
        total_questions = total_questions_result.scalar() or 0
        
        attempts_result = await db.execute(
            select(UserQuestionAttempt).where(UserQuestionAttempt.user_id == user.id)
        )
        attempts = attempts_result.scalars().all()
        
        questions_answered = len(attempts)
        completion_rate = (questions_answered / total_questions * 100) if total_questions > 0 else 0
        
        correct_answers = sum(1 for a in attempts if a.is_correct)
        accuracy = (correct_answers / questions_answered * 100) if questions_answered > 0 else 0
        
        # This is a simplified streak calculation. A full implementation is more complex.
        streak_days = 0 # Placeholder

        difficulty_result = await db.execute(
            select(
                Question.difficulty,
                func.count(UserQuestionAttempt.id).label('attempted'),
                func.sum(case((UserQuestionAttempt.is_correct == True, 1), else_=0)).label('correct')
            )
            .join(Question, UserQuestionAttempt.question_id == Question.question_id)
            .where(UserQuestionAttempt.user_id == user.id)
            .group_by(Question.difficulty)
        )
        
        difficulty_data = {row.difficulty: row.correct or 0 for row in difficulty_result.all()}
        difficulty_breakdown = DifficultyBreakdown(
            easy=difficulty_data.get('Easy', 0),
            medium=difficulty_data.get('Medium', 0),
            hard=difficulty_data.get('Hard', 0)
        )
        
        domain_result = await db.execute(
            select(
                Question.domain,
                func.count(UserQuestionAttempt.id).label('attempted'),
                func.sum(case((UserQuestionAttempt.is_correct == True, 1), else_=0)).label('correct')
            )
            .join(Question, UserQuestionAttempt.question_id == Question.question_id)
            .where(UserQuestionAttempt.user_id == user.id)
            .group_by(Question.domain)
        )
        
        domain_performance = []
        for row in domain_result.all():
            if row.domain and row.attempted:
                accuracy_pct = (row.correct / row.attempted * 100) if row.attempted > 0 else 0
                domain_performance.append(DomainStats(
                    domain=row.domain,
                    attempted=row.attempted,
                    correct=row.correct or 0,
                    accuracy=accuracy_pct
                ))
        
        return UserStatsResponse(
            questionsAnswered=questions_answered,
            totalQuestions=total_questions,
            completionRate=completion_rate,
            accuracy=accuracy,
            streakDays=streak_days,
            difficultyBreakdown=difficulty_breakdown,
            domainPerformance=domain_performance
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")
