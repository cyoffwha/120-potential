from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_
from pydantic import BaseModel
from datetime import datetime, date
from typing import List

from db import SessionLocal, User, Question, UserQuestionAttempt, UserStudySession, UserProgress

# Dependency to get database session
async def get_db():
    async with SessionLocal() as session:
        yield session

router = APIRouter(prefix="/progress", tags=["progress"])

# Request/Response models
class SubmitAnswerRequest(BaseModel):
    question_id: str
    selected_choice: str
    is_correct: bool
    time_elapsed_seconds: int

class DifficultyStats(BaseModel):
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
    avgTimePerQuestion: float
    completionRate: float
    accuracy: float
    streakDays: int
    difficultyBreakdown: DifficultyStats
    domainBreakdown: List[DomainStats]

@router.post("/submit-answer")
async def submit_answer(
    request: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db)
):
    """Submit an answer and track user progress"""
    try:
        # Mock user for now
        user_sub = "102668604194363784471"
        
        # Get user
        user_result = await db.execute(
            select(User).where(User.sub == user_sub)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get question
        question_result = await db.execute(
            select(Question).where(Question.question_id == request.question_id)
        )
        question = question_result.scalar_one_or_none()
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        # Create attempt record
        attempt = UserQuestionAttempt(
            user_id=user.id,
            question_id=question.id,
            selected_choice=request.selected_choice,
            is_correct=request.is_correct,
            time_elapsed_seconds=request.time_elapsed_seconds,
            attempted_at=datetime.utcnow()
        )
        db.add(attempt)

        # Get or create progress
        progress_result = await db.execute(
            select(UserProgress).where(UserProgress.user_id == user.id)
        )
        progress = progress_result.scalar_one_or_none()
        
        if not progress:
            # Create new progress
            progress = UserProgress(
                user_id=user.id,
                total_questions_attempted=1,
                total_correct_answers=1 if request.is_correct else 0,
                easy_attempted=1 if question.difficulty == "Easy" else 0,
                easy_correct=1 if question.difficulty == "Easy" and request.is_correct else 0,
                medium_attempted=1 if question.difficulty == "Medium" else 0,
                medium_correct=1 if question.difficulty == "Medium" and request.is_correct else 0,
                hard_attempted=1 if question.difficulty in ["Hard", "Very Hard"] else 0,
                hard_correct=1 if question.difficulty in ["Hard", "Very Hard"] and request.is_correct else 0,
                domain_craft_structure_attempted=1 if question.domain == "Craft and Structure" else 0,
                domain_craft_structure_correct=1 if question.domain == "Craft and Structure" and request.is_correct else 0,
                domain_info_ideas_attempted=1 if question.domain == "Information and Ideas" else 0,
                domain_info_ideas_correct=1 if question.domain == "Information and Ideas" and request.is_correct else 0,
                domain_expression_ideas_attempted=1 if question.domain == "Expression of Ideas" else 0,
                domain_expression_ideas_correct=1 if question.domain == "Expression of Ideas" and request.is_correct else 0,
                domain_standard_english_attempted=1 if question.domain == "Standard English Conventions" else 0,
                domain_standard_english_correct=1 if question.domain == "Standard English Conventions" and request.is_correct else 0,
                current_streak_days=0,
                longest_streak_days=0,
                last_study_date=date.today(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(progress)
        else:
            # Update existing progress
            update_data = {
                "total_questions_attempted": progress.total_questions_attempted + 1,
                "updated_at": datetime.utcnow(),
                "last_study_date": date.today()
            }
            
            if request.is_correct:
                update_data["total_correct_answers"] = progress.total_correct_answers + 1
            
            # Update difficulty stats
            if question.difficulty == "Easy":
                update_data["easy_attempted"] = progress.easy_attempted + 1
                if request.is_correct:
                    update_data["easy_correct"] = progress.easy_correct + 1
            elif question.difficulty == "Medium":
                update_data["medium_attempted"] = progress.medium_attempted + 1
                if request.is_correct:
                    update_data["medium_correct"] = progress.medium_correct + 1
            elif question.difficulty in ["Hard", "Very Hard"]:
                update_data["hard_attempted"] = progress.hard_attempted + 1
                if request.is_correct:
                    update_data["hard_correct"] = progress.hard_correct + 1
            
            # Update domain stats
            if question.domain == "Craft and Structure":
                update_data["domain_craft_structure_attempted"] = progress.domain_craft_structure_attempted + 1
                if request.is_correct:
                    update_data["domain_craft_structure_correct"] = progress.domain_craft_structure_correct + 1
            elif question.domain == "Information and Ideas":
                update_data["domain_info_ideas_attempted"] = progress.domain_info_ideas_attempted + 1
                if request.is_correct:
                    update_data["domain_info_ideas_correct"] = progress.domain_info_ideas_correct + 1
            elif question.domain == "Expression of Ideas":
                update_data["domain_expression_ideas_attempted"] = progress.domain_expression_ideas_attempted + 1
                if request.is_correct:
                    update_data["domain_expression_ideas_correct"] = progress.domain_expression_ideas_correct + 1
            elif question.domain == "Standard English Conventions":
                update_data["domain_standard_english_attempted"] = progress.domain_standard_english_attempted + 1
                if request.is_correct:
                    update_data["domain_standard_english_correct"] = progress.domain_standard_english_correct + 1
            
            # Update progress
            await db.execute(
                update(UserProgress)
                .where(UserProgress.user_id == user.id)
                .values(**update_data)
            )

        # Handle study session
        today = date.today()
        session_result = await db.execute(
            select(UserStudySession).where(
                and_(
                    UserStudySession.user_id == user.id,
                    UserStudySession.session_date == today
                )
            )
        )
        study_session = session_result.scalar_one_or_none()
        
        if not study_session:
            study_session = UserStudySession(
                user_id=user.id,
                session_date=today,
                questions_attempted=1,
                time_spent_seconds=request.time_elapsed_seconds,
                created_at=datetime.utcnow()
            )
            db.add(study_session)
        else:
            await db.execute(
                update(UserStudySession)
                .where(
                    and_(
                        UserStudySession.user_id == user.id,
                        UserStudySession.session_date == today
                    )
                )
                .values(
                    questions_attempted=study_session.questions_attempted + 1,
                    time_spent_seconds=study_session.time_spent_seconds + request.time_elapsed_seconds
                )
            )

        await db.commit()
        return {"success": True, "message": "Answer submitted successfully"}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(db: AsyncSession = Depends(get_db)):
    """Get user progress statistics"""
    try:
        # Mock user for now
        user_sub = "102668604194363784471"
        
        # Get user
        user_result = await db.execute(
            select(User).where(User.sub == user_sub)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            return UserStatsResponse(
                questionsAnswered=0,
                avgTimePerQuestion=0.0,
                completionRate=0.0,
                accuracy=0.0,
                streakDays=0,
                difficultyBreakdown=DifficultyStats(easy=0, medium=0, hard=0),
                domainBreakdown=[]
            )

        # Get progress
        progress_result = await db.execute(
            select(UserProgress).where(UserProgress.user_id == user.id)
        )
        progress = progress_result.scalar_one_or_none()
        
        if not progress:
            return UserStatsResponse(
                questionsAnswered=0,
                avgTimePerQuestion=0.0,
                completionRate=0.0,
                accuracy=0.0,
                streakDays=0,
                difficultyBreakdown=DifficultyStats(easy=0, medium=0, hard=0),
                domainBreakdown=[]
            )

        # Calculate stats
        total_attempted = progress.total_questions_attempted
        total_correct = progress.total_correct_answers
        accuracy = (total_correct / total_attempted * 100) if total_attempted > 0 else 0.0

        # Get average time
        avg_time_result = await db.execute(
            select(func.avg(UserQuestionAttempt.time_elapsed_seconds))
            .where(UserQuestionAttempt.user_id == user.id)
        )
        avg_time = avg_time_result.scalar() or 0.0

        # Get total questions for completion rate
        total_questions_result = await db.execute(select(func.count(Question.id)))
        total_questions = total_questions_result.scalar()
        completion_rate = (total_attempted / total_questions * 100) if total_questions > 0 else 0.0

        # Build domain breakdown
        domain_breakdown = []
        
        if progress.domain_craft_structure_attempted > 0:
            domain_accuracy = (progress.domain_craft_structure_correct / progress.domain_craft_structure_attempted * 100)
            domain_breakdown.append(DomainStats(
                domain="Craft and Structure",
                attempted=progress.domain_craft_structure_attempted,
                correct=progress.domain_craft_structure_correct,
                accuracy=round(domain_accuracy, 1)
            ))
        
        if progress.domain_info_ideas_attempted > 0:
            domain_accuracy = (progress.domain_info_ideas_correct / progress.domain_info_ideas_attempted * 100)
            domain_breakdown.append(DomainStats(
                domain="Information and Ideas",
                attempted=progress.domain_info_ideas_attempted,
                correct=progress.domain_info_ideas_correct,
                accuracy=round(domain_accuracy, 1)
            ))
        
        if progress.domain_expression_ideas_attempted > 0:
            domain_accuracy = (progress.domain_expression_ideas_correct / progress.domain_expression_ideas_attempted * 100)
            domain_breakdown.append(DomainStats(
                domain="Expression of Ideas",
                attempted=progress.domain_expression_ideas_attempted,
                correct=progress.domain_expression_ideas_correct,
                accuracy=round(domain_accuracy, 1)
            ))
        
        if progress.domain_standard_english_attempted > 0:
            domain_accuracy = (progress.domain_standard_english_correct / progress.domain_standard_english_attempted * 100)
            domain_breakdown.append(DomainStats(
                domain="Standard English Conventions",
                attempted=progress.domain_standard_english_attempted,
                correct=progress.domain_standard_english_correct,
                accuracy=round(domain_accuracy, 1)
            ))

        return UserStatsResponse(
            questionsAnswered=total_attempted,
            avgTimePerQuestion=float(avg_time),
            completionRate=round(completion_rate, 2),
            accuracy=round(accuracy, 1),
            streakDays=progress.current_streak_days,
            difficultyBreakdown=DifficultyStats(
                easy=progress.easy_attempted,
                medium=progress.medium_attempted,
                hard=progress.hard_attempted
            ),
            domainBreakdown=domain_breakdown
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
