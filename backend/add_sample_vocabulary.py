#!/usr/bin/env python3
"""
Sample vocabulary words for the flashcard system
Run this to populate the vocabulary_cards table with initial data
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from db import engine, VocabularyCard

# Sample vocabulary words for SAT/academic vocabulary
sample_vocabulary = [
    {
        "word": "Ephemeral",
        "definition": "Lasting for a very short time; temporary",
        "example": "The beauty of cherry blossoms is ephemeral, lasting only a few weeks.",
        "difficulty": "Hard",
        "category": "SAT Vocab"
    },
    {
        "word": "Ubiquitous",
        "definition": "Present, appearing, or found everywhere",
        "example": "Smartphones have become ubiquitous in modern society.",
        "difficulty": "Medium",
        "category": "SAT Vocab"
    },
    {
        "word": "Sanguine",
        "definition": "Optimistic or positive, especially in a difficult situation",
        "example": "Despite the setbacks, she remained sanguine about the project's success.",
        "difficulty": "Hard",
        "category": "SAT Vocab"
    },
    {
        "word": "Venerate",
        "definition": "To regard with great respect; revere",
        "example": "Many cultures venerate their elders for their wisdom and experience.",
        "difficulty": "Medium",
        "category": "SAT Vocab"
    },
    {
        "word": "Pragmatic",
        "definition": "Dealing with things sensibly and realistically",
        "example": "Her pragmatic approach to problem-solving made her an effective leader.",
        "difficulty": "Easy",
        "category": "SAT Vocab"
    },
    {
        "word": "Aesthetic",
        "definition": "Concerned with beauty or the appreciation of beauty",
        "example": "The architect focused on the aesthetic aspects of the building design.",
        "difficulty": "Easy",
        "category": "SAT Vocab"
    },
    {
        "word": "Erudite",
        "definition": "Having or showing great knowledge or learning",
        "example": "The professor's erudite lecture impressed even the most knowledgeable students.",
        "difficulty": "Hard",
        "category": "SAT Vocab"
    },
    {
        "word": "Candid",
        "definition": "Truthful and straightforward; frank",
        "example": "She appreciated his candid feedback about her presentation.",
        "difficulty": "Easy",
        "category": "SAT Vocab"
    },
    {
        "word": "Ambivalent",
        "definition": "Having mixed feelings or contradictory ideas about something",
        "example": "He felt ambivalent about moving to a new city for work.",
        "difficulty": "Medium",
        "category": "SAT Vocab"
    },
    {
        "word": "Benevolent",
        "definition": "Well meaning and kindly",
        "example": "The benevolent donor contributed millions to the charity.",
        "difficulty": "Medium",
        "category": "SAT Vocab"
    },
    {
        "word": "Capricious",
        "definition": "Given to sudden and unaccountable changes of mood or behavior",
        "example": "The capricious weather made it difficult to plan outdoor activities.",
        "difficulty": "Hard",
        "category": "SAT Vocab"
    },
    {
        "word": "Diligent",
        "definition": "Having or showing care and conscientiousness in one's work or duties",
        "example": "Her diligent study habits helped her excel in all her classes.",
        "difficulty": "Easy",
        "category": "SAT Vocab"
    },
    {
        "word": "Eloquent",
        "definition": "Fluent or persuasive in speaking or writing",
        "example": "The senator's eloquent speech moved the audience to tears.",
        "difficulty": "Medium",
        "category": "SAT Vocab"
    },
    {
        "word": "Frivolous",
        "definition": "Not having any serious purpose or value",
        "example": "The judge dismissed the case as frivolous and without merit.",
        "difficulty": "Easy",
        "category": "SAT Vocab"
    },
    {
        "word": "Gregarious",
        "definition": "Fond of the company of others; sociable",
        "example": "Her gregarious personality made her popular at parties.",
        "difficulty": "Medium",
        "category": "SAT Vocab"
    }
]

async def add_sample_vocabulary():
    """Add sample vocabulary words to the database"""
    async with AsyncSession(engine) as session:
        try:
            # Check if vocabulary already exists
            count_result = await session.execute(select(func.count(VocabularyCard.id)))
            existing_count = count_result.scalar() or 0
            
            if existing_count > 0:
                print(f"Vocabulary table already has {existing_count} words. Skipping sample data insertion.")
                return
            
            print("Adding sample vocabulary words...")
            
            for vocab_data in sample_vocabulary:
                vocab_card = VocabularyCard(**vocab_data)
                session.add(vocab_card)
            
            await session.commit()
            print(f"Successfully added {len(sample_vocabulary)} vocabulary words!")
            
            # Print summary
            easy_count = len([v for v in sample_vocabulary if v["difficulty"] == "Easy"])
            medium_count = len([v for v in sample_vocabulary if v["difficulty"] == "Medium"])
            hard_count = len([v for v in sample_vocabulary if v["difficulty"] == "Hard"])
            
            print(f"\nBreakdown:")
            print(f"  Easy: {easy_count} words")
            print(f"  Medium: {medium_count} words") 
            print(f"  Hard: {hard_count} words")
            print(f"  Total: {len(sample_vocabulary)} words")
            
        except Exception as e:
            await session.rollback()
            print(f"Error adding vocabulary: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(add_sample_vocabulary())
