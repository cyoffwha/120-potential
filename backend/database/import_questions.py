#!/usr/bin/env python3
"""
Import SAT questions from JSON files into the database.
Handles validation, error recovery, and safe batch processing.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
import html

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from db import engine, Question

class QuestionImporter:
    def __init__(self, json_dir: str = "questions"):
        self.json_dir = Path(json_dir)
        self.imported_count = 0
        self.skipped_count = 0
        self.error_count = 0
        self.errors = []

    def validate_json_data(self, data: Dict, filename: str) -> Optional[str]:
        """Validate JSON data structure and return error message if invalid."""
        required_fields = ["question_id", "question_text", "answer_options", "correct_answer"]
        
        # Check required fields
        for field in required_fields:
            if field not in data:
                return f"Missing required field: {field}"
        
        # Validate answer_options array
        if not isinstance(data["answer_options"], list):
            return "answer_options must be an array"
        
        if len(data["answer_options"]) != 4:
            return f"answer_options must have exactly 4 elements, got {len(data['answer_options'])}"
        
        # Validate correct_answer
        if data["correct_answer"] not in ["A", "B", "C", "D"]:
            return f"correct_answer must be A, B, C, or D, got: {data['correct_answer']}"
        
        # Check for empty critical fields
        if not data["question_text"].strip():
            return "question_text cannot be empty"
        
        for i, option in enumerate(data["answer_options"]):
            if not str(option).strip():
                return f"answer_options[{i}] cannot be empty"
        
        return None  # Valid

    def clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        if not text:
            return ""
        
        # Decode HTML entities
        text = html.unescape(text)
        
        # Normalize whitespace
        text = " ".join(text.split())
        
        # Truncate if too long (PostgreSQL TEXT type can handle very large strings,
        # but let's be safe with 10000 chars)
        if len(text) > 10000:
            text = text[:9997] + "..."
            
        return text.strip()

    def map_json_to_question(self, data: Dict) -> Dict:
        """Map JSON data to Question model fields."""
        # Get rationales, default to empty string if missing
        rationales = data.get("answer_rationales", {})
        
        return {
            "question_id": data["question_id"],
            "image": None,  # All our questions have has_image: false
            "passage": self.clean_text(data.get("passage", "")),
            "question": self.clean_text(data["question_text"]),
            "choice_a": self.clean_text(data["answer_options"][0]),
            "choice_b": self.clean_text(data["answer_options"][1]),
            "choice_c": self.clean_text(data["answer_options"][2]),
            "choice_d": self.clean_text(data["answer_options"][3]),
            "correct_choice": data["correct_answer"],
            "rationale_a": self.clean_text(rationales.get("A", "")),
            "rationale_b": self.clean_text(rationales.get("B", "")),
            "rationale_c": self.clean_text(rationales.get("C", "")),
            "rationale_d": self.clean_text(rationales.get("D", "")),
            "difficulty": data.get("difficulty", "Medium"),  # Default to Medium if missing
            "domain": self.clean_text(data.get("domain", "")),
            "skill": self.clean_text(data.get("skill", "")),
        }

    async def question_exists(self, session: AsyncSession, question_id: str) -> bool:
        """Check if question already exists in database."""
        result = await session.execute(
            select(Question).where(Question.question_id == question_id)
        )
        return result.scalar_one_or_none() is not None

    async def import_question(self, session: AsyncSession, json_file: Path) -> bool:
        """Import a single question from JSON file. Returns True if successful."""
        try:
            # Read and parse JSON
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Validate data structure
            error = self.validate_json_data(data, json_file.name)
            if error:
                self.errors.append(f"{json_file.name}: {error}")
                return False
            
            # Check if question already exists
            if await self.question_exists(session, data["question_id"]):
                print(f"  SKIP: Question {data['question_id']} already exists")
                self.skipped_count += 1
                return True  # Not an error, just skipped
            
            # Map to database fields
            question_data = self.map_json_to_question(data)
            
            # Create and add question
            question = Question(**question_data)
            session.add(question)
            
            print(f"  ADD: {data['question_id']} - {data.get('domain', 'Unknown')} - {data.get('difficulty', 'Medium')}")
            self.imported_count += 1
            return True
            
        except json.JSONDecodeError as e:
            self.errors.append(f"{json_file.name}: Invalid JSON - {str(e)}")
            return False
        except FileNotFoundError:
            self.errors.append(f"{json_file.name}: File not found")
            return False
        except Exception as e:
            self.errors.append(f"{json_file.name}: Unexpected error - {str(e)}")
            return False

    async def import_questions(self, limit: int = 50) -> None:
        """Import questions from JSON files with specified limit."""
        print(f"🚀 Starting import of up to {limit} questions from {self.json_dir}")
        
        # Find JSON files
        json_files = list(self.json_dir.glob("*.json"))
        if not json_files:
            print(f"❌ No JSON files found in {self.json_dir}")
            return
        
        # Limit files to process
        json_files = json_files[:limit]
        print(f"📁 Found {len(json_files)} JSON files to process")
        print("=" * 60)
        
        async with AsyncSession(engine) as session:
            try:
                # Process files in batches of 10 for better error recovery
                batch_size = 10
                for i in range(0, len(json_files), batch_size):
                    batch = json_files[i:i + batch_size]
                    print(f"\n📦 Processing batch {i//batch_size + 1} ({len(batch)} files)")
                    
                    batch_success = True
                    for json_file in batch:
                        success = await self.import_question(session, json_file)
                        if not success:
                            batch_success = False
                            self.error_count += 1
                    
                    # Commit batch if all successful
                    if batch_success:
                        await session.commit()
                        print(f"  ✅ Batch committed successfully")
                    else:
                        await session.rollback()
                        print(f"  ⚠️ Batch rolled back due to errors")
                        # Try individual commits for successful ones
                        await session.rollback()  # Start fresh
                        for json_file in batch:
                            try:
                                success = await self.import_question(session, json_file)
                                if success:
                                    await session.commit()
                            except Exception as e:
                                await session.rollback()
                                self.errors.append(f"{json_file.name}: Commit failed - {str(e)}")
                
            except Exception as e:
                await session.rollback()
                print(f"❌ Critical error: {str(e)}")
                self.errors.append(f"Critical error: {str(e)}")

    def print_summary(self):
        """Print import summary and errors."""
        print("\n" + "=" * 60)
        print("📊 IMPORT SUMMARY")
        print(f"✅ Successfully imported: {self.imported_count}")
        print(f"⏭️  Skipped (already exists): {self.skipped_count}")
        print(f"❌ Errors: {self.error_count}")
        
        if self.errors:
            print(f"\n🚨 ERRORS ({len(self.errors)}):")
            for error in self.errors[:10]:  # Show first 10 errors
                print(f"  • {error}")
            if len(self.errors) > 10:
                print(f"  ... and {len(self.errors) - 10} more errors")
        
        if self.imported_count > 0:
            print(f"\n🎉 Successfully added {self.imported_count} questions to the database!")

async def main():
    """Main import function."""
    # Parse command line arguments
    limit = 50
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            print("Usage: python import_questions.py [limit]")
            print("Example: python import_questions.py 100")
            return
    
    # Create importer and run
    importer = QuestionImporter()
    await importer.import_questions(limit)
    importer.print_summary()

if __name__ == "__main__":
    asyncio.run(main())
