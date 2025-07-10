import os
import asyncio
from sqlalchemy import text
from dotenv import load_dotenv
from db import engine

load_dotenv()

async def migrate():
    print("Running database migration to add domain and skill columns...")
    
    # Check if columns exist first
    async with engine.begin() as conn:
        # Check if domain column exists
        domain_exists = await conn.execute(
            text("SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='domain'")
        )
        domain_exists = domain_exists.scalar() is not None
        
        # Check if skill column exists
        skill_exists = await conn.execute(
            text("SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='skill'")
        )
        skill_exists = skill_exists.scalar() is not None
        
        # Add columns if they don't exist
        if not domain_exists:
            print("Adding 'domain' column to questions table...")
            await conn.execute(text("ALTER TABLE questions ADD COLUMN domain VARCHAR NULL"))
            print("Domain column added successfully.")
        else:
            print("Domain column already exists.")
            
        if not skill_exists:
            print("Adding 'skill' column to questions table...")
            await conn.execute(text("ALTER TABLE questions ADD COLUMN skill VARCHAR NULL"))
            print("Skill column added successfully.")
        else:
            print("Skill column already exists.")
    
    print("Migration completed successfully.")

if __name__ == "__main__":
    asyncio.run(migrate())
