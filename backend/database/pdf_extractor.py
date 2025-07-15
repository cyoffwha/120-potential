


import os
import sys
from pdf2image import convert_from_path
import pytesseract
import re
import json


def extract_first_100_lines(pdf_path, output_path, max_lines=10000):

    # Convert PDF pages to images (limit to first 10 pages for dev)
    images = convert_from_path(pdf_path, first_page=1, last_page=10)
    all_text = []
    for img in images:
        text = pytesseract.image_to_string(img, lang='eng')
        all_text.extend(text.splitlines())

    # Extract questions into JSON
    questions = []
    current_question = None
    question_lines = []
    question_id_pattern = re.compile(r'^Question ID (\w+)', re.IGNORECASE)
    for line in all_text:
        match = question_id_pattern.match(line.strip())
        if match:
            # Save previous question
            if current_question:
                questions.append({"id": current_question, "text": "\n".join(question_lines).strip()})
            current_question = match.group(1)
            question_lines = [line.strip()]
        elif current_question:
            question_lines.append(line.strip())
    # Save last question
    if current_question:
        questions.append({"id": current_question, "text": "\n".join(question_lines).strip()})

    # Filter out questions containing 'Command of Evidence'
    filtered_questions = []
    for q in questions:
        if 'Command of Evidence' in q['text']:
            continue
        # Remove the boilerplate header from the beginning of the text
        # The header is like: 'Question ID <id>\n\nAssessment Test Domain Skill Difficulty\nSAT Reading and Writing'
        header_pattern = re.compile(r'^Question ID \w+\n+Assessment Test Domain Skill Difficulty\nSAT Reading and Writing', re.IGNORECASE)
        cleaned_text = header_pattern.sub('', q['text']).lstrip('\n')
        filtered_questions.append({"text": cleaned_text})
    # Write filtered questions (without id) to JSON file
    json_output = os.path.splitext(output_path)[0] + "_questions.json"
    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump(filtered_questions, f, indent=2, ensure_ascii=False)
    print(f"Extracted {len(filtered_questions)} questions to {json_output}")


if __name__ == "__main__":
    # Example usage: python pdf_extractor.py math780.pdf
    if len(sys.argv) < 2:
        print("Usage: python pdf_extractor.py <pdf_file>")
        sys.exit(1)
    pdf_file = sys.argv[1]
    output_file = os.path.join(os.path.dirname(__file__), '../debug_text.txt')
    extract_first_100_lines(pdf_file, output_file)
