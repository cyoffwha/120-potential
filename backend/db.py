from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, String, Date, Integer, Boolean, DateTime, Float, ForeignKey, Text
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/potential")

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    sub = Column(String, unique=True, index=True)  # Google unique user ID
    name = Column(String)
    email = Column(String, unique=True, index=True)
    picture = Column(String)
    given_name = Column(String)
    family_name = Column(String)
    birthdate = Column(String, nullable=True)  # Google returns as string (YYYY-MM-DD or partial)
    locale = Column(String, nullable=True)
    email_verified = Column(String, nullable=True)
    hd = Column(String, nullable=True)  # Hosted domain (for Google Workspace)
    # Add any other fields you want to capture


# New Question table for SAT questions
class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)  # Auto-increment: 1, 2, 3, 4...
    question_id = Column(String, unique=True, index=True, nullable=False)  # SAT question ID: "5aae2475"
    image = Column(String, nullable=True)  # URL or path to image, may be empty
    passage = Column(String, nullable=True)
    question = Column(String, nullable=False)
    choice_a = Column(String, nullable=False)
    choice_b = Column(String, nullable=False)
    choice_c = Column(String, nullable=False)
    choice_d = Column(String, nullable=False)
    correct_choice = Column(String, nullable=False)  # Should be 'A', 'B', 'C', or 'D'
    rationale_a = Column(String, nullable=True)
    rationale_b = Column(String, nullable=True)
    rationale_c = Column(String, nullable=True)
    rationale_d = Column(String, nullable=True)
    difficulty = Column(String, nullable=False)  # One of: Easy, Medium, Hard
    domain = Column(String, nullable=True)      # e.g. Craft and Structure
    skill = Column(String, nullable=True)       # e.g. Cross-Text Connections


# User Progress Tracking Tables
class UserQuestionAttempt(Base):
    """Track each question attempt by a user"""
    __tablename__ = "user_question_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(String, ForeignKey("questions.question_id"), nullable=False)
    selected_choice = Column(String, nullable=False)  # A, B, C, or D
    is_correct = Column(Boolean, nullable=False)
    time_elapsed_seconds = Column(Float, nullable=False)  # Time spent on question
    attempted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="question_attempts")
    question = relationship("Question", back_populates="attempts")


class UserStudySession(Base):
    """Track study sessions for streak calculation"""
    __tablename__ = "user_study_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_date = Column(Date, nullable=False)  # Date of study session
    questions_attempted = Column(Integer, default=0)
    total_time_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="study_sessions")


class UserProgress(Base):
    """Track overall user progress and statistics"""
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Overall stats
    total_questions_attempted = Column(Integer, default=0)
    total_correct_answers = Column(Integer, default=0)
    current_streak_days = Column(Integer, default=0)
    longest_streak_days = Column(Integer, default=0)
    
    # Difficulty breakdown
    easy_attempted = Column(Integer, default=0)
    easy_correct = Column(Integer, default=0)
    medium_attempted = Column(Integer, default=0)
    medium_correct = Column(Integer, default=0)
    hard_attempted = Column(Integer, default=0)
    hard_correct = Column(Integer, default=0)
    
    # Domain performance (JSON or separate table - using separate columns for simplicity)
    domain_craft_structure_attempted = Column(Integer, default=0)
    domain_craft_structure_correct = Column(Integer, default=0)
    domain_info_ideas_attempted = Column(Integer, default=0)
    domain_info_ideas_correct = Column(Integer, default=0)
    domain_expression_ideas_attempted = Column(Integer, default=0)
    domain_expression_ideas_correct = Column(Integer, default=0)
    domain_standard_english_attempted = Column(Integer, default=0)
    domain_standard_english_correct = Column(Integer, default=0)
    
    # Timestamps
    last_study_date = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="progress")


# Update existing models to add relationships
User.question_attempts = relationship("UserQuestionAttempt", back_populates="user")
User.study_sessions = relationship("UserStudySession", back_populates="user")
User.progress = relationship("UserProgress", back_populates="user", uselist=False)

Question.attempts = relationship("UserQuestionAttempt", back_populates="question")

# To create tables (including the questions table), run:
#
# Option 1: Use the provided setup_db.py script (recommended):
#   python setup_db.py
#
# Option 2: Run manually in Python shell:
#   from backend.db import engine, Base
#   import asyncio
#   asyncio.run(Base.metadata.create_all(engine))
