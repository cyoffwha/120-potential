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
import re
import json
from pdf2image import convert_from_path
import pytesseract


def extract_first_100_lines(pdf_path, output_path, max_lines=50000):
def extract_text_lines(pdf_path, first_page=1, last_page=30):
    """Convert PDF pages to images and extract text lines using OCR."""
    images = convert_from_path(pdf_path, first_page=first_page, last_page=last_page)
    lines = []
    for img in images:
        text = pytesseract.image_to_string(img, lang='eng')
        lines.extend(text.splitlines())
    return lines

def split_questions(text_lines):
    """Split extracted text lines into individual questions based on 'Question ID'."""
    questions = []
    current_id = None
    buffer = []
    pattern = re.compile(r'^Question ID (\w+)', re.IGNORECASE)
    for line in text_lines:
        match = pattern.match(line.strip())
        if match:
            if current_id:
                questions.append((current_id, '\n'.join(buffer).strip()))
            current_id = match.group(1)
            buffer = [line.strip()]
        elif current_id:
            buffer.append(line.strip())
    if current_id:
        questions.append((current_id, '\n'.join(buffer).strip()))
    return questions

def extract_metadata(text, qid):
    """Extract difficulty, answer choice, and domain/skill from question text."""
    difficulty = text.strip().split()[-1] if text else ''
    answer_match = re.search(r'Correct Answer:\s*([A-D])', text)
    answer = answer_match.group(1) if answer_match else ''
    domain_region = ''
    start = text.find('SAT Reading and Writing ')
    if start >= 0:
        tail = text[start + len('SAT Reading and Writing '):]
        cut = re.search(r'ID:', tail, re.IGNORECASE)
        domain_region = tail[:cut.start()].strip() if cut else tail.strip()
    matched_domain = ''
    matched_skill = ''
    for domain_name, skills in READING_WRITING_DOMAINS_SKILLS.items():
        if domain_name.lower() in domain_region.lower():
            matched_domain = domain_name
            for skill in skills:
                key = skill.lower().replace('(', '').replace(')', '').replace('-', ' ')
                if key in domain_region.lower():
                    matched_skill = skill
                    break
            break
    return difficulty, answer, matched_domain, matched_skill

def clean_passage_region(region):
    """Remove header/footer artifacts from a passage region."""
    lines = region.splitlines()
    cleaned = []
    for line in lines:
        stripped = line.strip()
        if re.match(r'^(Question ID|Assessment Test|SAT Reading|ID:)', stripped):
            continue
        cleaned.append(line)
    return '\n'.join(cleaned).strip()

def extract_passage(text):
    """Extract the passage segment from the question text."""
    parts = text.split('\n\n')
    if len(parts) >= 3:
        region = parts[1].strip()
        cleaned = clean_passage_region(region)
        if len(cleaned) > 20 and not cleaned.startswith('ID:'):
            return cleaned
    id_marker = re.search(r'ID:.*?\n', text)
    if id_marker:
        tail = text[id_marker.end():]
        match = re.search(r'(.*?)(\n\n|\nA\.|\nA )', tail, re.DOTALL)
        if match:
            return clean_passage_region(match.group(1).strip())
    return clean_passage_region(text)

def extract_question(text, skill):
    """Extract the question prompt from question text."""
    if skill == 'Command of Evidence (Quantitative)':
        m = re.search(r'\nA\.', text)
        segment = text[:m.start()] if m else text
        return segment.split('\n')[-1].strip()
    parts = text.split('\n\n')
    if len(parts) > 4:
        blob = parts[4]
        return re.split(r'\nA\.', blob)[0].strip()
    return ''

def process_questions(input_pdf, output_json):
    """Pipeline: OCR PDF, parse questions, extract fields, write JSON."""
    lines = extract_text_lines(input_pdf)
    raw_qs = split_questions(lines)
    output = []
    for qid, txt in raw_qs:
        diff, ans, dom, skl = extract_metadata(txt, qid)
        passg = extract_passage(txt)
        ques = extract_question(txt, skl)
        output.append({
            'ID': qid,
            'text': txt,
            'Domain': dom,
            'Skill': skl,
            'Passage': passg,
            'Question': ques,
            'Difficulty': diff,
            'Answer': ans,
            'Image_path': ''
        })
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f'Extracted {len(output)} questions to {output_json}')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python pdf_extractor.py <pdf_file>')
        sys.exit(1)
    pdf_file = sys.argv[1]
    output_file = os.path.join(os.path.dirname(__file__), 'questions.json')
    process_questions(pdf_file, output_file)


if __name__ == "__main__":
    # Example usage: python pdf_extractor.py math780.pdf
    if len(sys.argv) < 2:
        print("Usage: python pdf_extractor.py <pdf_file>")
        sys.exit(1)
    pdf_file = sys.argv[1]
    output_file = os.path.join(os.path.dirname(__file__), '../debug_text.txt')
    extract_first_100_lines(pdf_file, output_file)
