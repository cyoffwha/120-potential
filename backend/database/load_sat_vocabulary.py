#!/usr/bin/env python3
"""
Script to load SAT vocabulary words from JSON into the vocabulary database.
"""

import json
import psycopg2
from psycopg2.extras import RealDictCursor
import sys
import os

def get_db_connection():
    """Get database connection using the same settings as the main app."""
    try:
        #postgresql+asyncpg://postgres:postgres@localhost:5432/potential
        conn = psycopg2.connect(
            host="localhost",
            database="potential",
            user="postgres", 
            password="postgres",
            port="5432"
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def load_vocabulary_from_json(json_file):
    """Load vocabulary words from JSON file into the database."""
    
    # Read the JSON file
    print(f"Reading vocabulary from {json_file}...")
    with open(json_file, 'r', encoding='utf-8') as f:
        words = json.load(f)
    
    print(f"Found {len(words)} words to load")
    
    # Connect to database
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if vocabulary_cards table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'vocabulary_cards'
            );
        """)
        
        table_exists = cursor.fetchone()[0]
        if not table_exists:
            print("vocabulary_cards table does not exist. Please run the database setup first.")
            return False
        
        # Clear existing vocabulary (optional - remove this if you want to keep existing data)
        cursor.execute("SELECT COUNT(*) FROM vocabulary_cards")
        existing_count = cursor.fetchone()[0]
        print(f"Found {existing_count} existing vocabulary cards in database")
        
        # Insert new vocabulary words
        inserted_count = 0
        skipped_count = 0
        
        for word_data in words:
            word = word_data.get('word', '').strip().lower()
            part_of_speech = word_data.get('part_of_speech', '').strip()
            definition = word_data.get('definition', '').strip()
            
            if not word or not definition:
                print(f"Skipping invalid entry: {word_data}")
                skipped_count += 1
                continue
            
            # Check if word already exists
            cursor.execute("SELECT id FROM vocabulary_cards WHERE word = %s", (word,))
            if cursor.fetchone():
                print(f"Word '{word}' already exists, skipping...")
                skipped_count += 1
                continue
            
            # Insert the word
            try:
                cursor.execute("""
                    INSERT INTO vocabulary_cards (word, part_of_speech, definition, use_case)
                    VALUES (%s, %s, %s, %s)
                """, (word, part_of_speech, definition, ""))  # Empty use_case as requested
                
                inserted_count += 1
                if inserted_count % 100 == 0:
                    print(f"Inserted {inserted_count} words...")
                    
            except psycopg2.IntegrityError as e:
                print(f"Error inserting word '{word}': {e}")
                skipped_count += 1
                conn.rollback()
                continue
        
        # Commit all changes
        conn.commit()
        print(f"\nSuccessfully inserted {inserted_count} vocabulary words")
        print(f"Skipped {skipped_count} words (duplicates or invalid)")
        
        # Show final count
        cursor.execute("SELECT COUNT(*) FROM vocabulary_cards")
        total_count = cursor.fetchone()[0]
        print(f"Total vocabulary cards in database: {total_count}")
        
        return True
        
    except Exception as e:
        print(f"Error loading vocabulary: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    json_file = "/home/lintahlo/Desktop/120-potential/backend/database/sat_words.json"
    
    if not os.path.exists(json_file):
        print(f"JSON file not found: {json_file}")
        sys.exit(1)
    
    success = load_vocabulary_from_json(json_file)
    if success:
        print("Vocabulary loading completed successfully!")
    else:
        print("Vocabulary loading failed!")
        sys.exit(1)
