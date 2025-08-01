#!/usr/bin/env python3
"""
Script to fix encoding issues and clean up the SAT vocabulary JSON file.
Fixes Unicode escape sequences and removes newline characters from word fields.
"""

import json
import re

def fix_unicode_sequences(text):
    """Fix common Unicode escape sequences to their proper characters."""
    if not isinstance(text, str):
        return text
    
    # Fix the specific Unicode issues we've seen
    result = text
    result = result.replace('\\u00c3\\u009e', 'fi')
    result = result.replace('\\u00c3\\u009ght', 'fight') 
    result = result.replace('\\u00c3\\u009et', 'fit')
    result = result.replace('\\u00c3\\u009edent', 'fident')
    result = result.replace('\\u00c3\\u009eckle', 'fickle')
    result = result.replace('\\u00c3\\u009ecation', 'fication')
    result = result.replace('\\u00c3\\u009enite', 'finite')
    
    # Also handle the actual unicode characters that might be in the file
    result = result.replace('\u00c3\u009e', 'fi')
    
    return result

def clean_word_field(word):
    """Clean the word field by removing newlines and fixing case."""
    if not isinstance(word, str):
        return word
    
    # Remove newlines and extra spaces
    cleaned = word.replace('\n', '')  # Remove actual newlines
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Handle patterns like "A\narcane", "B\nB\nbalk", "C\ncacophony", etc.
    # Remove leading single letters that are artifacts
    while len(cleaned) > 1:
        # Check for pattern like "A" or "B" at start
        if len(cleaned) >= 1 and cleaned[0].isupper() and (
            len(cleaned) == 1 or 
            (len(cleaned) > 1 and not cleaned[1].islower())
        ):
            cleaned = cleaned[1:].strip()
        else:
            break
    
    # Handle patterns where the word got split and has artifacts
    # Like "cover t" should be "covert"
    if ' t' in cleaned and cleaned.endswith(' t'):
        cleaned = cleaned.replace(' t', 't')
    
    # Handle other spacing issues
    cleaned = cleaned.replace(' ', '')  # Remove any remaining spaces within words
    
    # Convert to lowercase
    cleaned = cleaned.lower()
    
    return cleaned

def fix_vocab_json(input_file, output_file):
    """Fix the vocabulary JSON file."""
    print(f"Reading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Processing {len(data)} vocabulary entries...")
    
    fixed_count = 0
    for entry in data:
        if 'word' in entry:
            original_word = entry['word']
            cleaned_word = clean_word_field(original_word)
            if cleaned_word != original_word:
                entry['word'] = cleaned_word
                fixed_count += 1
                print(f"Fixed word: '{original_word}' -> '{cleaned_word}'")
        
        if 'definition' in entry:
            original_def = entry['definition']
            cleaned_def = fix_unicode_sequences(original_def)
            if cleaned_def != original_def:
                entry['definition'] = cleaned_def
                print(f"Fixed definition Unicode in word '{entry.get('word', '?')}'")
    
    print(f"Fixed {fixed_count} word entries")
    print(f"Writing cleaned data to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("Done!")

if __name__ == "__main__":
    input_file = "/home/lintahlo/Desktop/120-potential/backend/database/sat_vocab_935.json"
    output_file = "/home/lintahlo/Desktop/120-potential/backend/database/sat_vocab_935_cleaned.json"
    
    fix_vocab_json(input_file, output_file)
