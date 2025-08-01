from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from typing import Optional
from db import Question, engine

router = APIRouter()

@router.get("/questions")
async def get_questions(
    domain: Optional[str] = Query(None, description="Filter by domain (or 'Any' for all)"),
    skill: Optional[str] = Query(None, description="Filter by skill (or 'Any' for all)"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (or 'Any' for all)"),
    limit: Optional[int] = Query(None, description="Limit number of results")
):
    async with AsyncSession(engine) as session:
        # Build query with optional filters
        query = select(Question)
        filters = []
        
        # Apply filters only if they're not "Any" or None
        if domain and domain != "Any":
            filters.append(Question.domain == domain)
        if skill and skill != "Any":
            filters.append(Question.skill == skill)
        if difficulty and difficulty != "Any":
            filters.append(Question.difficulty == difficulty)
        
        # Apply filters if any exist
        if filters:
            query = query.where(and_(*filters))
        
        # Apply limit if specified
        if limit:
            query = query.limit(limit)
            
        result = await session.execute(query)
        questions = result.scalars().all()
        
        # Convert to dicts for JSON serialization and filter out SQLAlchemy internal attributes
        questions_list = [{k: v for k, v in q.__dict__.items() if not k.startswith('_')} for q in questions]
        return {
            "questions": questions_list,
            "total": len(questions_list),
            "filters_applied": {
                "domain": domain if domain != "Any" else None,
                "skill": skill if skill != "Any" else None, 
                "difficulty": difficulty if difficulty != "Any" else None
            }
        }

@router.get("/questions/random")
async def get_random_question(
    domain: Optional[str] = Query(None, description="Filter by domain (or 'Any' for all)"),
    skill: Optional[str] = Query(None, description="Filter by skill (or 'Any' for all)"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (or 'Any' for all)")
):
    """Get a single random question, optionally filtered by domain, skill, and/or difficulty"""
    async with AsyncSession(engine) as session:
        # Build query with optional filters
        query = select(Question)
        filters = []
        
        # Apply filters only if they're not "Any" or None
        if domain and domain != "Any":
            filters.append(Question.domain == domain)
        if skill and skill != "Any":
            filters.append(Question.skill == skill)
        if difficulty and difficulty != "Any":
            filters.append(Question.difficulty == difficulty)
        
        # Apply filters if any exist
        if filters:
            query = query.where(and_(*filters))
        
        # Order by random and get one result
        query = query.order_by(Question.id).limit(1)  # For now, just get first one; can add random ordering later
            
        result = await session.execute(query)
        question = result.scalar_one_or_none()
        
        if not question:
            raise HTTPException(status_code=404, detail="No questions found matching the specified criteria")
        
        # Convert to dict for JSON serialization
        question_dict = {k: v for k, v in question.__dict__.items() if not k.startswith('_')}
        return {
            "question": question_dict,
            "filters_applied": {
                "domain": domain if domain != "Any" else None,
                "skill": skill if skill != "Any" else None,
                "difficulty": difficulty if difficulty != "Any" else None
            }
        }

@router.get("/questions/filter-options")
async def get_filter_options():
    """Get available filter options for domains, skills, and difficulties"""
    async with AsyncSession(engine) as session:
        # Get unique domains
        domain_result = await session.execute(select(Question.domain).distinct())
        domains = [row[0] for row in domain_result.fetchall() if row[0]]
        
        # Get unique skills
        skill_result = await session.execute(select(Question.skill).distinct())
        skills = [row[0] for row in skill_result.fetchall() if row[0]]
        
        # Get unique difficulties
        difficulty_result = await session.execute(select(Question.difficulty).distinct())
        difficulties = [row[0] for row in difficulty_result.fetchall() if row[0]]
        
        return {
            "domains": sorted(domains),
            "skills": sorted(skills),
            "difficulties": sorted(difficulties),
            "domain_skill_mapping": {
                # This could be dynamically generated based on actual data in database
                "Information and Ideas": [
                    "Central Ideas and Details",
                    "Command of Evidence", 
                    "Inferences"
                ],
                "Craft and Structure": [
                    "Words in Context",
                    "Text Structure and Purpose",
                    "Cross-Text Connections"
                ],
                "Expression of Ideas": [
                    "Rhetorical Synthesis",
                    "Transitions"
                ],
                "Standard English Conventions": [
                    "Boundaries",
                    "Form, Structure, and Sense"
                ]
            }
        }
