#!/usr/bin/env python3
"""
Add spaced repetition columns to existing user_vocabulary_attempts table
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from db import engine

async def add_spaced_repetition_columns():
    """Add the new spaced repetition columns to existing table"""
    async with AsyncSession(engine) as session:
        try:
            # Check if columns already exist
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user_vocabulary_attempts' 
                AND column_name IN ('interval_days', 'next_review_date', 'failure_count')
            """)
            result = await session.execute(check_query)
            existing_columns = [row[0] for row in result.fetchall()]
            
            if len(existing_columns) == 3:
                print("Spaced repetition columns already exist!")
                return
            
            print("Adding spaced repetition columns...")
            
            # Add the new columns
            alter_queries = [
                "ALTER TABLE user_vocabulary_attempts ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 1",
                "ALTER TABLE user_vocabulary_attempts ADD COLUMN IF NOT EXISTS next_review_date DATE",
                "ALTER TABLE user_vocabulary_attempts ADD COLUMN IF NOT EXISTS failure_count INTEGER DEFAULT 0"
            ]
            
            for query in alter_queries:
                await session.execute(text(query))
            
            await session.commit()
            print("Successfully added spaced repetition columns!")
            
        except Exception as e:
            await session.rollback()
            print(f"Error adding columns: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(add_spaced_repetition_columns())
