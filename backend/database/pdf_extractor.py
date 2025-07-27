READING_WRITING_DOMAINS_SKILLS = {
    "Information and Ideas": [
        "Central Ideas and Details",
        "Command of Evidence",
        #"Command of Evidence (Textual)",
        #"Command of Evidence (Quantitative)",
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
import os
import sys
from pdf2image import convert_from_path
import pytesseract
import re
import json


def extract_first_100_lines(pdf_path, output_path, max_lines=50000):

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

    # Do not filter or remove any text; include all question data
    filtered_questions = []
    for q in questions:
        full_text = q['text']
        # Extract the last word as Difficulty
        difficulty = full_text.strip().split()[-1] if full_text.strip() else ""
        # Extract the answer letter after 'Correct Answer: '
        answer_match = re.search(r'Correct Answer:\s*([A-D])', full_text)
        answer = answer_match.group(1) if answer_match else ""
        # Extract the ID after 'Question ID '
        id_match = re.search(r'^Question ID\s+(\w+)', full_text)
        qid = id_match.group(1) if id_match else ""
        # Extract the region after 'SAT Reading and Writing ' and before 'ID:'
        domain_region = ""
        domain_start = full_text.find('SAT Reading and Writing ')
        if domain_start != -1:
            domain_sub = full_text[domain_start + len('SAT Reading and Writing '):]
            # Find where 'ID:' or 'ID:' (case-insensitive) appears next
            id_marker = re.search(r'ID:', domain_sub, re.IGNORECASE)
            if id_marker:
                domain_region = domain_sub[:id_marker.start()].strip()
            else:
                domain_region = domain_sub.strip()
        # Try to match the domain_region to one of the known domain names
        matched_domain = ""
        matched_skill = ""
        for domain_name, skills in READING_WRITING_DOMAINS_SKILLS.items():
            domain_words = domain_name.lower().split()
            if all(word in domain_region.lower() for word in domain_words):
                matched_domain = domain_name
                # Try to match a skill from this domain
                for skill in skills:
                    skill_words = skill.lower().replace('(', '').replace(')', '').replace('-', ' ').split()
                    if all(word in domain_region.lower() for word in skill_words):
                        matched_skill = skill
                        break
                break
        # Extract Passage: between 2nd and 3rd double newline (\n\n) in the 'text' field
        passage = ""
        text_field = q['text']
        double_newlines = [m.start() for m in re.finditer(r'\n\n', text_field)]
        if len(double_newlines) >= 3:
            passage_region = text_field[double_newlines[1]+2:double_newlines[2]].strip()
        else:
            # Fallback: previous logic
            prompt_match = re.search(r'(Which choice|Based on the text|According to the text|What does the text|How does the author|What is the main idea|What can be inferred|Question Difficulty:)', text_field, re.IGNORECASE)
            passage_end = None
            if prompt_match:
                passage_end = prompt_match.start()
            answer_marker = re.search(r'ID:\s*' + re.escape(qid) + r' Answer', text_field)
            if passage_end is not None:
                passage_region = text_field[:passage_end].strip()
            elif answer_marker:
                passage_region = text_field[:answer_marker.start()].strip()
            else:
                passage_region = text_field.strip()
        passage = passage_region
        filtered_questions.append({
            "ID": qid,
            "text": full_text,
            "Domain": matched_domain,
            "Skill": matched_skill,
            "Passage": passage,
            "Difficulty": difficulty,
            "Answer": answer
        })
    # Write filtered questions (with Difficulty) to questions.json
    questions_json_output = os.path.join(os.path.dirname(output_path), 'questions.json')
    with open(questions_json_output, 'w', encoding='utf-8') as f:
        json.dump(filtered_questions, f, indent=2, ensure_ascii=False)
    print(f"Extracted {len(filtered_questions)} questions to {questions_json_output}")


if __name__ == "__main__":
    # Example usage: python pdf_extractor.py math780.pdf
    if len(sys.argv) < 2:
        print("Usage: python pdf_extractor.py <pdf_file>")
        sys.exit(1)
    pdf_file = sys.argv[1]
    output_file = os.path.join(os.path.dirname(__file__), '../debug_text.txt')
    extract_first_100_lines(pdf_file, output_file)
