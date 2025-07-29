"""
PDF Question Extractor for SAT Reading and Writing Questions

This module extracts questions from SAT Reading and Writing PDF files,
processes them according to domain/skill categories, and outputs structured
JSON data for use in educational applications.
"""

import os
import sys
import re
import json
from typing import List, Dict, Tuple, Optional, Any
from pdf2image import convert_from_path
import pytesseract


# Domain and skill mappings for SAT Reading and Writing
READING_WRITING_DOMAINS_SKILLS = {
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


class PDFQuestionExtractor:
    """Extracts and processes SAT Reading and Writing questions from PDF files."""
    
    def __init__(self):
        self.question_id_pattern = re.compile(r'^Question ID (\w+)', re.IGNORECASE)
    
    def extract_text_from_pdf(self, pdf_path: str, max_pages: int = 30) -> List[str]:
        """Extract text from PDF pages using OCR."""
        try:
            images = convert_from_path(pdf_path, first_page=1, last_page=max_pages)
            all_text = []
            for img in images:
                text = pytesseract.image_to_string(img, lang='eng')
                all_text.extend(text.splitlines())
            return all_text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return []
    
    def parse_questions_from_text(self, all_text: List[str]) -> List[Dict[str, str]]:
        """Parse individual questions from extracted text lines."""
        questions = []
        current_question = None
        question_lines = []
        
        for line in all_text:
            match = self.question_id_pattern.match(line.strip())
            if match:
                # Save previous question
                if current_question:
                    questions.append({
                        "id": current_question, 
                        "text": "\n".join(question_lines).strip()
                    })
                current_question = match.group(1)
                question_lines = [line.strip()]
            elif current_question:
                question_lines.append(line.strip())
        
        # Save last question
        if current_question:
            questions.append({
                "id": current_question, 
                "text": "\n".join(question_lines).strip()
            })
        
        return questions
    
    def extract_difficulty(self, text_field: str) -> str:
        """Extract difficulty level from question text."""
        return text_field.strip().split()[-1] if text_field.strip() else ""
    
    def extract_answer(self, text_field: str) -> str:
        """Extract correct answer from question text."""
        answer_match = re.search(r'Correct Answer:\s*([A-D])', text_field)
        return answer_match.group(1) if answer_match else ""
    
    def extract_question_id(self, text_field: str) -> str:
        """Extract question ID from question text."""
        id_match = re.search(r'^Question ID\s+(\w+)', text_field)
        return id_match.group(1) if id_match else ""
    
    def extract_domain_and_skill(self, text_field: str, qid: str) -> Tuple[str, str]:
        """Extract domain and skill classification from question text."""
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
                            # Determine if it's Textual or Quantitative
                            matched_skill = self._classify_command_of_evidence(text_field, qid)
                        else:
                            matched_skill = skill
                        break
                break
        
        return matched_domain, matched_skill
    
    def _classify_command_of_evidence(self, text_field: str, qid: str) -> str:
        """Classify Command of Evidence as Textual or Quantitative."""
        id_marker = re.search(r'ID:\s*' + re.escape(qid), text_field)
        if id_marker:
            after_id = text_field[id_marker.end():id_marker.end()+250]
            newline_count = after_id.count('\n')
            if newline_count > 15:
                return "Command of Evidence (Quantitative)"
            else:
                return "Command of Evidence (Textual)"
        else:
            return "Command of Evidence"
    
    def extract_answer_choices(self, text_field: str) -> List[Dict[str, str]]:
        """Extract answer choices (A, B, C, D) from question text."""
        choices = []
        
        # Look for answer choices in the format "A. text", "B. text", etc.
        choice_pattern = r'\n([A-D])\.\s*(.*?)(?=\n[A-D]\.|$|\nID:|Correct Answer:|Rationale)'
        matches = re.findall(choice_pattern, text_field, re.DOTALL)
        
        for letter, text in matches:
            # Clean up the choice text
            choice_text = text.strip()
            # Remove any trailing newlines or extra whitespace
            choice_text = re.sub(r'\s+', ' ', choice_text)
            choices.append({
                "letter": letter,
                "text": choice_text
            })
        
        # If we didn't find choices with the above pattern, try alternative formats
        if not choices:
            # Try pattern without period after letter
            alt_pattern = r'\n([A-D])\s+(.*?)(?=\n[A-D]\s|$|\nID:|Correct Answer:|Rationale)'
            alt_matches = re.findall(alt_pattern, text_field, re.DOTALL)
            
            for letter, text in alt_matches:
                choice_text = text.strip()
                choice_text = re.sub(r'\s+', ' ', choice_text)
                choices.append({
                    "letter": letter,
                    "text": choice_text
                })
        
        return choices
    
    def extract_answer_explanations(self, text_field: str) -> Dict[str, str]:
        """Extract explanations for each answer choice from the Rationale section."""
        explanations = {}
        
        # Find the Rationale section
        rationale_match = re.search(r'Rationale\s*(.*?)(?=Question Difficulty:|$)', text_field, re.DOTALL)
        if not rationale_match:
            return explanations
        
        rationale_text = rationale_match.group(1).strip()
        
        # Extract explanations for each choice
        # Pattern to match "Choice X is [correct/incorrect]" followed by explanation
        choice_explanations = re.findall(
            r'Choice ([A-D]) is (?:the best answer|correct|incorrect)[^\n]*\.?\s*(.*?)(?=Choice [A-D] is|$)', 
            rationale_text, 
            re.DOTALL
        )
        
        for letter, explanation in choice_explanations:
            # Clean up the explanation text
            explanation = explanation.strip()
            # Remove excessive whitespace but preserve paragraph breaks
            explanation = re.sub(r' +', ' ', explanation)
            explanation = re.sub(r'\n\n+', '\n\n', explanation)
            explanations[letter] = explanation
        
        # If we didn't find standard explanations, try to extract the correct answer explanation
        if not explanations:
            # Look for the pattern that explains why the correct answer is right
            correct_answer_pattern = r'Choice ([A-D]) is the best answer[^\.]*\.(.*?)(?=Choice [A-D]|$)'
            correct_match = re.search(correct_answer_pattern, rationale_text, re.DOTALL)
            if correct_match:
                letter, explanation = correct_match.groups()
                explanation = explanation.strip()
                explanation = re.sub(r' +', ' ', explanation)
                explanations[letter] = explanation
        
        return explanations
    
    def extract_passage(self, text_field: str, qid: str) -> str:
        """Extract passage text from question text."""
        passage = ""
        double_newlines = [m.start() for m in re.finditer(r'\n\n', text_field)]
        passage_region = ""
        
        # Try extracting from double newline regions first
        if len(double_newlines) >= 3:
            passage_region = text_field[double_newlines[1]+2:double_newlines[2]].strip()
        
        if passage_region:
            passage_region = self._clean_passage_lines(passage_region)
        
        if passage_region and len(passage_region) > 20 and not passage_region.startswith('ID:'):
            passage = passage_region
        else:
            # Fallback extraction method
            passage = self._extract_passage_fallback(text_field, qid)
        
        return passage
    
    def _clean_passage_lines(self, passage_region: str) -> str:
        """Clean unwanted lines from passage text."""
        passage_lines = passage_region.splitlines()
        cleaned_lines = []
        
        for line in passage_lines:
            if re.match(r'^(Question ID|Assessment Test|SAT Reading|ID:)', line.strip()):
                continue
            if re.match(r'^[A-Za-z ]{5,}$', line.strip()) and line.strip().lower().startswith('ideas'):
                continue
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines).strip()
    
    def _extract_passage_fallback(self, text_field: str, qid: str) -> str:
        """Fallback method for passage extraction."""
        passage = ""
        
        # Try extracting after ID marker
        id_match = re.search(r'ID:.*?\n', text_field)
        if id_match:
            after_id = text_field[id_match.end():]
            passage_match = re.search(r'(.*?)(\n\n|\nA\.|\nA )', after_id, re.DOTALL)
            if passage_match:
                passage_region = passage_match.group(1).strip()
                passage_region = self._clean_passage_lines(passage_region)
                if passage_region and len(passage_region) > 20:
                    passage = passage_region
        
        # If still no passage, try extracting before question prompts
        if not passage:
            prompt_match = re.search(
                r'(Which choice|Based on the text|According to the text|What does the text|'
                r'How does the author|What is the main idea|What can be inferred|Question Difficulty:)', 
                text_field, re.IGNORECASE
            )
            
            passage_end = prompt_match.start() if prompt_match else None
            answer_marker = re.search(r'ID:\s*' + re.escape(qid) + r' Answer', text_field)
            
            if passage_end is not None:
                passage_region = text_field[:passage_end].strip()
            elif answer_marker:
                passage_region = text_field[:answer_marker.start()].strip()
            else:
                passage_region = text_field.strip()
            
            passage = self._clean_passage_lines(passage_region)
        
        return passage
    
    def extract_question(self, text_field: str, matched_skill: str) -> str:
        """Extract question text from question text field."""
        question = ""
        
        if matched_skill != "Command of Evidence (Quantitative)":
            # Standard extraction: segment between 4th double newline and first 'A.'
            parts = text_field.split('\n\n')
            if len(parts) > 4:
                question_blob = parts[4].strip()
                # Trim off choices starting at 'A.'
                question = re.split(r'\nA\.', question_blob)[0].strip()
            else:
                # Fallback to previous logic if not enough segments
                question = self._extract_question_fallback(text_field)
        else:
            # For Command of Evidence (Quantitative), use fallback extraction
            question = self._extract_question_fallback(text_field)
        
        return question
    
    def _extract_question_fallback(self, text_field: str) -> str:
        """Fallback method for question extraction."""
        answer_a_match = re.search(r'\nA\. ', text_field)
        if not answer_a_match:
            return ""
        
        pre_a_text = text_field[:answer_a_match.start()]
        double_newlines = [m.start() for m in re.finditer(r'\n\n', pre_a_text)]
        
        if len(double_newlines) >= 2:
            start_idx = double_newlines[-2] + 2
            end_idx = double_newlines[-1]
            question_region = pre_a_text[start_idx:end_idx].strip()
            lines = [line.strip() for line in question_region.split('\n') if line.strip()]
            return lines[0] if lines else question_region
        elif len(double_newlines) == 1:
            start_idx = double_newlines[0] + 2
            question_region = pre_a_text[start_idx:].strip()
            lines = [line.strip() for line in question_region.split('\n') if line.strip()]
            return lines[0] if lines else question_region
        else:
            lines = [line.strip() for line in pre_a_text.split('\n') if line.strip()]
            return lines[-1] if lines else pre_a_text.strip()
    
    def process_question(self, question_data: Dict[str, str]) -> Dict[str, Any]:
        """Process a single question and extract all relevant fields."""
        text_field = question_data['text']
        
        # Extract all fields
        qid = self.extract_question_id(text_field)
        difficulty = self.extract_difficulty(text_field)
        answer = self.extract_answer(text_field)
        domain, skill = self.extract_domain_and_skill(text_field, qid)
        passage = self.extract_passage(text_field, qid)
        question = self.extract_question(text_field, skill)
        answer_choices = self.extract_answer_choices(text_field)
        answer_explanations = self.extract_answer_explanations(text_field)
        
        return {
            "ID": qid,
            "text": text_field,
            "Domain": domain,
            "Skill": skill,
            "Passage": passage,
            "Question": question,
            "Difficulty": difficulty,
            "Answer": answer,
            "Answer_Choices": answer_choices,
            "Answer_Explanations": answer_explanations,
            "Image_path": ""
        }
    
    def extract_questions_from_pdf(self, pdf_path: str, output_path: Optional[str] = None) -> List[Dict[str, Any]]:
        """Main method to extract and process all questions from a PDF file."""
        print(f"Extracting text from PDF: {pdf_path}")
        all_text = self.extract_text_from_pdf(pdf_path)
        
        print("Parsing questions from extracted text...")
        raw_questions = self.parse_questions_from_text(all_text)
        
        print(f"Processing {len(raw_questions)} questions...")
        processed_questions = []
        for question_data in raw_questions:
            processed_question = self.process_question(question_data)
            processed_questions.append(processed_question)
        
        # Write to JSON file
        if output_path is None:
            output_path = os.path.join(os.path.dirname(__file__), 'questions.json')
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(processed_questions, f, indent=2, ensure_ascii=False)
        
        print(f"Extracted {len(processed_questions)} questions to {output_path}")
        return processed_questions


def extract_first_100_lines(pdf_path: str, output_path: str, max_lines: int = 50000) -> None:
    """Legacy function for backward compatibility."""
    extractor = PDFQuestionExtractor()
    extractor.extract_questions_from_pdf(pdf_path)


def main():
    """Main entry point for the script."""
    if len(sys.argv) < 2:
        print("Usage: python pdf_extractor.py <pdf_file>")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    extractor = PDFQuestionExtractor()
    extractor.extract_questions_from_pdf(pdf_file)


if __name__ == "__main__":
    main()
