from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Date, Integer
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/potential")

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
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
    id = Column(Integer, primary_key=True, index=True)
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
    difficulty = Column(String, nullable=False)  # One of: Easy, Medium, Hard, Very Hard
    domain = Column(String, nullable=True)      # e.g. Craft and Structure
    skill = Column(String, nullable=True)       # e.g. Cross-Text Connections

# To create tables (including the questions table), run:
#
# Option 1: Use the provided setup_db.py script (recommended):
#   python setup_db.py
#
# Option 2: Run manually in Python shell:
#   from backend.db import engine, Base
#   import asyncio
#   asyncio.run(Base.metadata.create_all(engine))
