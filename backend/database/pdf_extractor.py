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

    # Convert PDF pages to images (limit to first 30 pages for dev)
    images = convert_from_path(pdf_path, first_page=1, last_page=30)
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

    # All field extraction is strictly from the 'text' field of each question.
    filtered_questions = []
    for q in questions:
        text_field = q['text']  # Only use this for all extractions
        # Extract Difficulty (last word)
        difficulty = text_field.strip().split()[-1] if text_field.strip() else ""
        # Extract Answer
        answer_match = re.search(r'Correct Answer:\s*([A-D])', text_field)
        answer = answer_match.group(1) if answer_match else ""
        # Extract ID
        id_match = re.search(r'^Question ID\s+(\w+)', text_field)
        qid = id_match.group(1) if id_match else ""
        # Extract Domain/Skill
        domain_region = ""
        domain_start = text_field.find('SAT Reading and Writing ')
        if domain_start != -1:
            domain_sub = text_field[domain_start + len('SAT Reading and Writing '):]
            id_marker = re.search(r'ID:', domain_sub, re.IGNORECASE)
            if id_marker:
                domain_region = domain_sub[:id_marker.start()].strip()
            else:
                domain_region = domain_sub.strip()
        matched_domain = ""
        matched_skill = ""
        for domain_name, skills in READING_WRITING_DOMAINS_SKILLS.items():
            domain_words = domain_name.lower().split()
            if all(word in domain_region.lower() for word in domain_words):
                matched_domain = domain_name
                for skill in skills:
                    skill_words = skill.lower().replace('(', '').replace(')', '').replace('-', ' ').split()
                    if all(word in domain_region.lower() for word in skill_words):
                        if skill == "Command of Evidence":
                            id_marker = re.search(r'ID:\s*' + re.escape(qid), text_field)
                            if id_marker:
                                after_id = text_field[id_marker.end():id_marker.end()+250]
                                newline_count = after_id.count('\n')
                                if newline_count > 15:
                                    matched_skill = "Command of Evidence (Quantitative)"
                                else:
                                    matched_skill = "Command of Evidence (Textual)"
                            else:
                                matched_skill = skill
                        else:
                            matched_skill = skill
                        break
                break
        # Extract Passage (from text_field only)
        passage = ""
        double_newlines = [m.start() for m in re.finditer(r'\n\n', text_field)]
        passage_region = ""
        if len(double_newlines) >= 3:
            passage_region = text_field[double_newlines[1]+2:double_newlines[2]].strip()
        if passage_region:
            passage_lines = passage_region.splitlines()
            cleaned_lines = []
            for line in passage_lines:
                if re.match(r'^(Question ID|Assessment Test|SAT Reading|ID:)', line.strip()):
                    continue
                if re.match(r'^[A-Za-z ]{5,}$', line.strip()) and line.strip().lower().startswith('ideas'):
                    continue
                cleaned_lines.append(line)
            passage_region = '\n'.join(cleaned_lines).strip()
        if passage_region and len(passage_region) > 20 and not passage_region.startswith('ID:'):
            passage = passage_region
        else:
            id_match = re.search(r'ID:.*?\n', text_field)
            if id_match:
                after_id = text_field[id_match.end():]
                passage_match = re.search(r'(.*?)(\n\n|\nA\.|\nA )', after_id, re.DOTALL)
                if passage_match:
                    passage_region = passage_match.group(1).strip()
                    passage_lines = passage_region.splitlines()
                    cleaned_lines = []
                    for line in passage_lines:
                        if re.match(r'^(Question ID|Assessment Test|SAT Reading|ID:)', line.strip()):
                            continue
                        if re.match(r'^[A-Za-z ]{5,}$', line.strip()) and line.strip().lower().startswith('ideas'):
                            continue
                        cleaned_lines.append(line)
                    passage_region = '\n'.join(cleaned_lines).strip()
                    if passage_region and len(passage_region) > 20:
                        passage = passage_region
            if not passage:
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
                passage_lines = passage_region.splitlines()
                cleaned_lines = []
                for line in passage_lines:
                    if re.match(r'^(Question ID|Assessment Test|SAT Reading|ID:)', line.strip()):
                        continue
                    if re.match(r'^[A-Za-z ]{5,}$', line.strip()) and line.strip().lower().startswith('ideas'):
                        continue
                    cleaned_lines.append(line)
                passage_region = '\n'.join(cleaned_lines).strip()
                passage = passage_region

        # Extract Question (from text_field only)
        # For most questions, Question is between the 4th and 5th double newlines (\n\n)
        # For Command of Evidence (Quantitative), leave as-is for now
        question = ""
        if matched_skill != "Command of Evidence (Quantitative)":
            # Extract question as the segment between the 4th double newline and first 'A.'
            parts = text_field.split('\n\n')
            if len(parts) > 4:
                question_blob = parts[4].strip()
                # Trim off choices starting at 'A.'
                question = re.split(r'\nA\.', question_blob)[0].strip()
            else:
                # Fallback to previous logic if not enough segments
                answer_a_match = re.search(r'\nA\. ', text_field)
                if answer_a_match:
                    pre_a_text = text_field[:answer_a_match.start()]
                    double_newlines = [m.start() for m in re.finditer(r'\n\n', pre_a_text)]
                    if len(double_newlines) >= 2:
                        start_idx = double_newlines[-2] + 2
                        end_idx = double_newlines[-1]
                        question = pre_a_text[start_idx:end_idx].strip()
                    elif len(double_newlines) == 1:
                        start_idx = double_newlines[0] + 2
                        question = pre_a_text[start_idx:].strip()
                    else:
                        question = pre_a_text.strip()
                else:
                    question = ""
        else:
            # For Command of Evidence (Quantitative), keep previous extraction logic (use fallback)
            answer_a_match = re.search(r'\nA\. ', text_field)
            if answer_a_match:
                pre_a_text = text_field[:answer_a_match.start()]
                double_newlines = [m.start() for m in re.finditer(r'\n\n', pre_a_text)]
                if len(double_newlines) >= 2:
                    start_idx = double_newlines[-2] + 2
                    end_idx = double_newlines[-1]
                    question_region = pre_a_text[start_idx:end_idx].strip()
                    lines = [line.strip() for line in question_region.split('\n') if line.strip()]
                    if lines:
                        question = lines[0]
                    else:
                        question = question_region
                elif len(double_newlines) == 1:
                    start_idx = double_newlines[0] + 2
                    question_region = pre_a_text[start_idx:].strip()
                    lines = [line.strip() for line in question_region.split('\n') if line.strip()]
                    if lines:
                        question = lines[0]
                    else:
                        question = question_region
                else:
                    lines = [line.strip() for line in pre_a_text.split('\n') if line.strip()]
                    if lines:
                        question = lines[-1]
                    else:
                        question = pre_a_text.strip()
            else:
                question = ""
        filtered_questions.append({
            "ID": qid,
            "text": text_field,
            "Domain": matched_domain,
            "Skill": matched_skill,
            "Passage": passage,
            "Question": question,
            "Difficulty": difficulty,
            "Answer": answer,
            "Image_path": ""
        })
    # Write filtered questions (with Difficulty) to questions.json
    questions_json_output = os.path.join(os.path.dirname(__file__), 'questions.json')
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
