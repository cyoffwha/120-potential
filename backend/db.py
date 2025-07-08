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

# To create tables, run:
# from backend.db import engine, Base; import asyncio; asyncio.run(Base.metadata.create_all(engine))
