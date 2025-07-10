import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import json
import re
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def extract_text_from_pdf(pdf_path):
    """Extracts text from a PDF file using OCR."""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        num_pages_to_process = min(10, len(doc))
        for page_num in range(num_pages_to_process):
            logging.info(f"Processing page {page_num + 1}/{num_pages_to_process} of {os.path.basename(pdf_path)}")
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=300)  # Increase DPI for better OCR quality
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            text += pytesseract.image_to_string(img)
        doc.close()
        return text
    except Exception as e:
        logging.error(f"Error extracting text from {pdf_path}: {e}")
        return ""

def parse_questions(text):
    """Parses the extracted text to find questions and their components."""
    questions = []
    
    # Split text by "Question ID " to get individual question blocks.
    # A question block is assumed to start with "Question ID" and end before the next one.
    question_blocks = re.split(r'(?=Question ID \S+)', text)
    
    domains = ["Craft and Structure", "Expression of Ideas", "Information and Ideas", "Standard English Conventions"]
    skills = ["Cross-Text Connections", "Text Structure and Purpose", "Words in Context", "Rhetorical Synthesis", "Transitions", "Central Ideas and Details", "Command of Evidence", "Inferences", "Boundaries", "Form, Structure, and Sense"]

    for block in question_blocks:
        if not block.strip() or not block.startswith("Question ID"):
            continue

        q_id = "N/A"
        try:
            # --- Extract ID ---
            id_match = re.search(r"Question ID (\S+)", block)
            if not id_match:
                continue
            q_id = id_match.group(1).strip()

            # --- Extract Domain and Skill ---
            # Find the text block between "Difficulty" and the first "ID:"
            header_match = re.search(r"Difficulty\s*([\s\S]+?)\s*ID:", block)
            found_domain = "N/A"
            found_skill = "N/A"
            if header_match:
                header_text = header_match.group(1)
                # Clean the text and create a set of words for robust matching
                cleaned_text = re.sub(r'rT\.|BBO|Be|goo|SAT Reading and Writing', '', header_text)
                available_words = set(cleaned_text.split())
                
                # Find the best domain match
                for d in domains:
                    if all(word in available_words for word in d.split()):
                        found_domain = d
                        break
                
                # Find the best skill match
                for s in skills:
                    if all(word in available_words for word in s.split()):
                        found_skill = s
                        break

            # --- Extract Correct Answer and Explanation ---
            correct_answer_match = re.search(r"Correct Answer: ([A-D])", block)
            correct_answer = correct_answer_match.group(1).strip() if correct_answer_match else "N/A"
            
            explanation_match = re.search(r"Rationale([\s\S]+?)(?=Question Difficulty:|$)", block)
            explanation_text = explanation_match.group(1).strip() if explanation_match else ""

            explanations = []
            if explanation_text:
                # Split the rationale by "Choice X..." to separate explanations for each answer.
                # The regex looks for "Choice" followed by a letter A-D, which marks the start of each explanation.
                parts = re.split(r'(?=Choice [A-D])', explanation_text)
                
                # Create a dictionary to hold explanations keyed by the choice letter to sort them correctly.
                explanation_map = {}
                for part in parts:
                    if part.strip():
                        choice_match = re.match(r'Choice ([A-D])', part.strip())
                        if choice_match:
                            letter = choice_match.group(1)
                            explanation_map[letter] = part.strip()
                
                # Add explanations to the list in A, B, C, D order.
                for letter in ['A', 'B', 'C', 'D']:
                    explanations.append(explanation_map.get(letter, f"Explanation for {letter} not found."))


            # --- Extract Passage, Question, and Answers ---
            main_content_match = re.search(r"ID: " + re.escape(q_id) + r"([\s\S]+?)Correct Answer:", block, re.DOTALL)
            if not main_content_match:
                logging.warning(f"Could not find main content block for Q_ID: {q_id}")
                continue
            
            main_content = main_content_match.group(1)

            # The end of the answers is marked by "ID: ... Answer"
            answer_section_end = re.search(r"ID: " + re.escape(q_id) + r" Answer", main_content)
            if not answer_section_end:
                logging.warning(f"Could not find end of answer marker for Q_ID: {q_id}")
                passage_question_answers = main_content.strip()
            else:
                passage_question_answers = main_content[:answer_section_end.start()].strip()

            # New robust logic: Find the start of the answers first.
            # The block of answers reliably starts with "A." on a new line.
            answers_start_match = re.search(r'(?m)^\s*A\.', passage_question_answers)
            if not answers_start_match:
                logging.warning(f"Could not find the start of answers for Q_ID: {q_id}")
                continue

            answers_start_index = answers_start_match.start()
            passage_and_question_block = passage_question_answers[:answers_start_index].strip()
            answers_block = passage_question_answers[answers_start_index:].strip()

            # Now, separate the passage from the question within their dedicated block.
            # The question is the last paragraph, often ending with a question mark.
            question_end_index = passage_and_question_block.rfind('?')
            if question_end_index != -1:
                # Find the start of the question text. It's usually after a double newline.
                question_start_index = passage_and_question_block.rfind('\n\n', 0, question_end_index)
                if question_start_index == -1:
                    # If no double newline, it might be the start of the block.
                    question_start_index = 0
                
                passage = passage_and_question_block[:question_start_index].strip().replace('\n', ' ')
                question = passage_and_question_block[question_start_index:].strip().replace('\n', ' ')
            else:
                # If no question mark, assume the last part is the question and the rest is passage.
                # This handles "complete the text" style questions.
                parts = passage_and_question_block.split('\n\n')
                if len(parts) > 1:
                    passage = " ".join(p.strip().replace('\n', ' ') for p in parts[:-1])
                    question = parts[-1].strip().replace('\n', ' ')
                else:
                    passage = ""
                    question = passage_and_question_block.strip().replace('\n', ' ')
            
            # The answers_block might contain a preamble before the actual choices.
            # The first real answer choice starts with 'A.'
            first_answer_match = re.search(r'(?m)^\s*A\.', answers_block)
            if first_answer_match:
                # Anything before the 'A.' is part of the question prompt.
                prompt_preamble = answers_block[:first_answer_match.start()].strip()
                if prompt_preamble:
                    question += " " + prompt_preamble.replace('\n', ' ')
                # The rest is the actual answers block
                answers_block = answers_block[first_answer_match.start():]
            
            # Final, more robust answer parsing logic.
            # This logic correctly handles cases where answer text appears on lines before the A./B./C./D. marker.
            # --- NEW LOGIC: preserve the line before the marker as part of the answer ---
            final_answers = []
            answer_lines = answers_block.split('\n')
            current_answer = []
            collecting = False
            for line in answer_lines:
                marker_match = re.match(r'^\s*[A-D]\.', line)
                if marker_match:
                    if current_answer:
                        final_answers.append('\n'.join(current_answer).strip())
                        current_answer = []
                    current_answer.append(line.rstrip())
                    collecting = True
                else:
                    if collecting:
                        current_answer.append(line.rstrip())
            if current_answer:
                final_answers.append('\n'.join(current_answer).strip())


            question_data = {
                "ID": q_id,
                "Domain": found_domain,
                "Skill": found_skill,
                "Reading Passage": passage,
                "Question": question,
                "Answers": final_answers,
                "Correct answer": correct_answer,
                "Explanations": explanations
            }
            questions.append(question_data)

        except Exception as e:
            logging.error(f"Failed to parse block for Q_ID {q_id if 'q_id' in locals() else 'N/A'}: {e}")
            continue
            
    return questions

def main():
    """Main function to process PDFs and save extracted questions."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_dir = os.path.join(base_dir, "database")
    output_dir = os.path.join(base_dir, "output")
    os.makedirs(output_dir, exist_ok=True)
    debug_output_path = os.path.join(base_dir, "debug_text.txt")

    for pdf_file in os.listdir(pdf_dir):
        if pdf_file.endswith(".pdf"):
            pdf_path = os.path.join(pdf_dir, pdf_file)
            logging.info(f"Processing {pdf_path}...")
            
            extracted_text = extract_text_from_pdf(pdf_path)
            
            # Always write debug output
            try:
                with open(debug_output_path, "w", encoding="utf-8") as f:
                    f.write(extracted_text)
                logging.info(f"Wrote OCR output to {debug_output_path}")
            except Exception as e:
                logging.error(f"Could not write debug file: {e}")

            if not extracted_text:
                logging.warning(f"No text extracted from {pdf_path}. Skipping.")
                continue

            questions = parse_questions(extracted_text)
            
            output_filename = os.path.splitext(pdf_file)[0] + ".json"
            output_path = os.path.join(output_dir, output_filename)
            
            try:
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(questions, f, indent=4, ensure_ascii=False)
                logging.info(f"Successfully extracted {len(questions)} questions to {output_path}")
            except Exception as e:
                logging.error(f"Error writing JSON output to {output_path}: {e}")

if __name__ == "__main__":
    main()
