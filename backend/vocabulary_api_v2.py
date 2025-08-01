from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, desc, or_

from db import engine, User, VocabularyCard, UserVocabularyAttempt, UserVocabularyProgress

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])

# Spaced repetition intervals (in days)
SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30]  # 1 day, 3 days, 1 week, 2 weeks, 1 month

def calculate_next_review(failure_count: int, result: str) -> tuple[int, Optional[date]]:
    """Calculate next review interval and date based on spaced repetition algorithm"""
    if result == "easy":
        # Card is completed, no next review needed
        return 0, None
    
    # Card failed ("again"), calculate next interval
    if failure_count >= len(SPACED_REPETITION_INTERVALS):
        # Cap at maximum interval
        interval_days = SPACED_REPETITION_INTERVALS[-1]
    else:
        interval_days = SPACED_REPETITION_INTERVALS[failure_count]
    
    next_review_date = date.today() + timedelta(days=interval_days)
    return interval_days, next_review_date

# Request models
class SubmitVocabularyAttemptRequest(BaseModel):
    card_id: int
    result: str  # "again" or "easy"
    time_elapsed_seconds: float

# Response models
class VocabularyCardResponse(BaseModel):
    id: int
    word: str
    definition: str
    example: Optional[str]
    difficulty: str
    category: Optional[str]
    completed: bool
    reviewed: bool
    next_review_date: Optional[str]  # ISO date string
    failure_count: int
    is_due_for_review: bool

@router.get("/due-cards")
async def get_due_cards():
    """Get cards that are due for review today (including new cards)"""
    async with AsyncSession(engine) as session:
        try:
            # For now, use hardcoded user ID
            user_sub = "102668604194363784471"
            
            # Get user
            user_result = await session.execute(select(User).where(User.sub == user_sub))
            user = user_result.scalar_one_or_none()
            
            if not user:
                return []
            
            today = date.today()
            
            # Get all cards with their latest attempts
            cards_query = """
            SELECT 
                vc.id, vc.word, vc.definition, vc.example, vc.difficulty, vc.category,
                uva.result, uva.next_review_date, uva.failure_count, uva.attempted_at
            FROM vocabulary_cards vc
            LEFT JOIN (
                SELECT DISTINCT ON (card_id) 
                    card_id, result, next_review_date, failure_count, attempted_at
                FROM user_vocabulary_attempts 
                WHERE user_id = :user_id
                ORDER BY card_id, attempted_at DESC
            ) uva ON vc.id = uva.card_id
            WHERE uva.card_id IS NULL  -- Never attempted
                OR uva.result = 'again' AND (uva.next_review_date IS NULL OR uva.next_review_date <= :today)
            ORDER BY vc.word
            """
            
            result = await session.execute(
                select(VocabularyCard, UserVocabularyAttempt)
                .outerjoin(
                    UserVocabularyAttempt,
                    and_(
                        VocabularyCard.id == UserVocabularyAttempt.card_id,
                        UserVocabularyAttempt.user_id == user.id
                    )
                )
                .order_by(VocabularyCard.word)
            )
            
            # Filter and build response for due cards only
            due_cards = []
            for card, attempt in result:
                if not attempt:
                    # Never attempted - due for review
                    due_cards.append(VocabularyCardResponse(
                        id=card.id,
                        word=card.word,
                        definition=card.definition,
                        example=card.example,
                        difficulty=card.difficulty,
                        category=card.category,
                        completed=False,
                        reviewed=False,
                        next_review_date=None,
                        failure_count=0,
                        is_due_for_review=True
                    ))
                elif attempt.result == "again":
                    # Check if due for review
                    if not attempt.next_review_date or attempt.next_review_date <= today:
                        due_cards.append(VocabularyCardResponse(
                            id=card.id,
                            word=card.word,
                            definition=card.definition,
                            example=card.example,
                            difficulty=card.difficulty,
                            category=card.category,
                            completed=False,
                            reviewed=True,
                            next_review_date=attempt.next_review_date.isoformat() if attempt.next_review_date else None,
                            failure_count=attempt.failure_count or 0,
                            is_due_for_review=True
                        ))
                # Skip completed cards (result == "easy")
            
            return due_cards
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get due cards: {str(e)}")

@router.get("/cards")
async def get_all_cards():
    """Get all cards with their status"""
    async with AsyncSession(engine) as session:
        try:
            # For now, use hardcoded user ID
            user_sub = "102668604194363784471"
            
            # Get user
            user_result = await session.execute(select(User).where(User.sub == user_sub))
            user = user_result.scalar_one_or_none()
            
            if not user:
                return []
            
            today = date.today()
            
            # Get all cards with their latest attempts
            result = await session.execute(
                select(VocabularyCard, UserVocabularyAttempt)
                .outerjoin(
                    UserVocabularyAttempt,
                    and_(
                        VocabularyCard.id == UserVocabularyAttempt.card_id,
                        UserVocabularyAttempt.user_id == user.id
                    )
                )
                .order_by(VocabularyCard.word)
            )
            
            # Group by card and get latest attempt
            cards_data = {}
            for card, attempt in result:
                card_id = card.id
                if card_id not in cards_data:
                    cards_data[card_id] = {
                        'card': card,
                        'latest_attempt': None
                    }
                
                # Keep the latest attempt
                if attempt and (not cards_data[card_id]['latest_attempt'] or 
                               attempt.attempted_at > cards_data[card_id]['latest_attempt'].attempted_at):
                    cards_data[card_id]['latest_attempt'] = attempt
            
            # Build response
            all_cards = []
            for card_id, data in cards_data.items():
                card = data['card']
                attempt = data['latest_attempt']
                
                if not attempt:
                    # Never attempted
                    all_cards.append(VocabularyCardResponse(
                        id=card.id,
                        word=card.word,
                        definition=card.definition,
                        example=card.example,
                        difficulty=card.difficulty,
                        category=card.category,
                        completed=False,
                        reviewed=False,
                        next_review_date=None,
                        failure_count=0,
                        is_due_for_review=True
                    ))
                elif attempt.result == "easy":
                    # Completed
                    all_cards.append(VocabularyCardResponse(
                        id=card.id,
                        word=card.word,
                        definition=card.definition,
                        example=card.example,
                        difficulty=card.difficulty,
                        category=card.category,
                        completed=True,
                        reviewed=True,
                        next_review_date=None,
                        failure_count=attempt.failure_count or 0,
                        is_due_for_review=False
                    ))
                else:
                    # Failed, check if due
                    is_due = not attempt.next_review_date or attempt.next_review_date <= today
                    all_cards.append(VocabularyCardResponse(
                        id=card.id,
                        word=card.word,
                        definition=card.definition,
                        example=card.example,
                        difficulty=card.difficulty,
                        category=card.category,
                        completed=False,
                        reviewed=True,
                        next_review_date=attempt.next_review_date.isoformat() if attempt.next_review_date else None,
                        failure_count=attempt.failure_count or 0,
                        is_due_for_review=is_due
                    ))
            
            return all_cards
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get cards: {str(e)}")

@router.post("/submit-attempt")
async def submit_vocabulary_attempt(request: SubmitVocabularyAttemptRequest):
    """Submit a user's attempt on a vocabulary card with spaced repetition"""
    async with AsyncSession(engine) as session:
        try:
            # For now, use hardcoded user ID
            user_sub = "102668604194363784471"
            
            # Get user
            user_result = await session.execute(select(User).where(User.sub == user_sub))
            user = user_result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Verify card exists
            card_result = await session.execute(select(VocabularyCard).where(VocabularyCard.id == request.card_id))
            card = card_result.scalar_one_or_none()
            
            if not card:
                raise HTTPException(status_code=404, detail="Vocabulary card not found")
            
            # Get previous attempt for this card to determine failure count
            previous_attempt_result = await session.execute(
                select(UserVocabularyAttempt)
                .where(and_(
                    UserVocabularyAttempt.user_id == user.id,
                    UserVocabularyAttempt.card_id == request.card_id
                ))
                .order_by(desc(UserVocabularyAttempt.attempted_at))
                .limit(1)
            )
            previous_attempt = previous_attempt_result.scalar_one_or_none()
            
            # Calculate failure count and next review
            if request.result == "easy":
                failure_count = 0  # Reset on success
                interval_days, next_review_date = 0, None
            else:  # "again"
                previous_failure_count = previous_attempt.failure_count if previous_attempt else 0
                failure_count = previous_failure_count + 1
                interval_days, next_review_date = calculate_next_review(failure_count, request.result)
            
            # Create attempt record with spaced repetition data
            attempt = UserVocabularyAttempt(
                user_id=user.id,
                card_id=request.card_id,
                result=request.result,
                time_elapsed_seconds=request.time_elapsed_seconds,
                attempted_at=datetime.utcnow(),
                interval_days=interval_days,
                next_review_date=next_review_date,
                failure_count=failure_count
            )
            session.add(attempt)
            
            await session.commit()
            
            return {
                "status": "success", 
                "message": "Vocabulary attempt submitted successfully",
                "next_review_date": next_review_date.isoformat() if next_review_date else None,
                "failure_count": failure_count,
                "interval_days": interval_days
            }
            
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to submit vocabulary attempt: {str(e)}")

@router.get("/stats")
async def get_vocabulary_stats():
    """Get vocabulary learning statistics"""
    async with AsyncSession(engine) as session:
        try:
            # For now, use hardcoded user ID
            user_sub = "102668604194363784471"
            
            # Get user
            user_result = await session.execute(select(User).where(User.sub == user_sub))
            user = user_result.scalar_one_or_none()
            
            if not user:
                return {
                    "total_cards": 0,
                    "completed_cards": 0,
                    "due_today": 0,
                    "completion_percentage": 0.0
                }
            
            # Get total cards count
            total_cards_result = await session.execute(select(func.count(VocabularyCard.id)))
            total_cards = total_cards_result.scalar() or 0
            
            # Get completed cards (latest result is "easy")
            completed_query = """
            SELECT COUNT(DISTINCT card_id)
            FROM user_vocabulary_attempts uva1
            WHERE user_id = :user_id
            AND result = 'easy'
            AND attempted_at = (
                SELECT MAX(attempted_at)
                FROM user_vocabulary_attempts uva2
                WHERE uva2.user_id = uva1.user_id
                AND uva2.card_id = uva1.card_id
            )
            """
            
            # Get due cards count
            today = date.today()
            due_query = """
            SELECT COUNT(*)
            FROM vocabulary_cards vc
            LEFT JOIN (
                SELECT DISTINCT ON (card_id) 
                    card_id, result, next_review_date
                FROM user_vocabulary_attempts 
                WHERE user_id = :user_id
                ORDER BY card_id, attempted_at DESC
            ) uva ON vc.id = uva.card_id
            WHERE uva.card_id IS NULL  -- Never attempted
                OR (uva.result = 'again' AND (uva.next_review_date IS NULL OR uva.next_review_date <= :today))
            """
            
            # Use simpler counting approach
            all_cards = await get_all_cards()
            completed_count = len([c for c in all_cards if c.completed])
            due_count = len([c for c in all_cards if c.is_due_for_review])
            
            completion_percentage = (completed_count / total_cards * 100) if total_cards > 0 else 0.0
            
            return {
                "total_cards": total_cards,
                "completed_cards": completed_count,
                "due_today": due_count,
                "completion_percentage": completion_percentage
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get vocabulary stats: {str(e)}")
