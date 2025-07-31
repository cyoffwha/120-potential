import json
import re
import os
import requests
import sys
from typing import Dict, Optional, List

def extract_passage_text(stimulus_content: str) -> str:
    """Extract passage text from stimulus content."""
    if not stimulus_content:
        return ""
    
    # Clean HTML tags and decode entities
    clean_text = re.sub(r'<[^>]+>', ' ', stimulus_content)
    clean_text = clean_text.replace('&rsquo;', "'").replace('&ldquo;', '"').replace('&rdquo;', '"').replace('&mdash;', '—').replace('&nbsp;', ' ').replace('&ndash;', '–')
    # Clean up whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text

def extract_passage_from_html(html_content: str) -> str:
    """Extract passage content (including figures/graphs and text) from the div after <div class="my-6"></div>."""
    # Look for the more specific pattern within the question content area
    # Target the div containing figure and paragraph elements
    pattern = r'<div class="my-6"></div>\s*(<div[^>]*>\s*<figure[^>]*>.*?</figure>.*?<p>.*?</p>\s*</div>)'
    match = re.search(pattern, html_content, re.DOTALL)
    
    if match:
        passage_html = match.group(1).strip()
        # Convert literal \n to proper HTML line breaks
        passage_html = passage_html.replace('\\n', '<br>')
        # Clean up excessive whitespace but preserve HTML structure
        passage_html = re.sub(r'\n\s*', ' ', passage_html)
        passage_html = re.sub(r'\s+', ' ', passage_html)
        return passage_html
    
    # Fallback: try the original simpler pattern for text-only passages
    pattern_fallback = r'<div class="my-6"></div>\s*<div[^>]*><p>(.*?)</p></div>'
    match_fallback = re.search(pattern_fallback, html_content, re.DOTALL)
    
    if match_fallback:
        passage = match_fallback.group(1).strip()
        # Convert literal \n to proper HTML line breaks
        passage = passage.replace('\\n', '<br>')
        # Replace actual newlines with spaces to avoid formatting issues
        passage = re.sub(r'\n\s*', ' ', passage)
        return passage
    
    return ""

def extract_css_styles(html_content: str) -> str:
    """Extract the CSS styles needed for proper table/content formatting."""
    # Look for the specific .question table styles
    pattern = r'\.question table[^}]*}[^}]*\.question table tr th[^}]*}[^}]*\.question table tr td[^}]*}[^}]*\.question ul[^}]*}[^}]*\.question ol[^}]*}'
    match = re.search(pattern, html_content, re.DOTALL)
    
    if match:
        return match.group(0).strip()
    
    # Fallback: return the essential table styles
    return """.question table {
        border: 1px solid #000;
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
    }
    .question table tr th {
        border: 1px solid #000;
        padding: 10px;
        background-color: #f5f5f5;
    }
    .question table tr td {
        border: 1px solid #000;
        padding: 10px;
    }"""

def extract_correct_answer_from_html(html_content: str) -> str:
    """Extract correct answer letter from HTML structure."""
    # Look for the specific pattern: <span class="font-bold">Correct Answer: </span><span>X</span>
    pattern = r'<span class="font-bold">Correct Answer:\s*</span>\s*<span>([A-D])</span>'
    match = re.search(pattern, html_content)
    
    if match:
        return match.group(1)
    
    return ""

def extract_answer_rationales(rationale_content: str) -> Dict[str, str]:
    """Extract individual rationales for each answer choice exactly as they appear."""
    if not rationale_content:
        return {}
    
    rationales = {}
    
    # Clean HTML and decode HTML entities
    clean_content = re.sub(r'<[^>]+>', ' ', rationale_content)
    clean_content = clean_content.replace('&rsquo;', "'").replace('&ldquo;', '"').replace('&rdquo;', '"').replace('&mdash;', '—').replace('&nbsp;', ' ')
    clean_content = re.sub(r'\s+', ' ', clean_content).strip()
    
    # Split by "Choice X" to get each complete rationale
    choice_sections = re.split(r'(Choice [A-D] is (?:the best answer|correct|incorrect))', clean_content)
    
    # Process each section
    for i in range(1, len(choice_sections), 2):
        if i + 1 < len(choice_sections):
            choice_header = choice_sections[i]
            choice_text = choice_sections[i + 1]
            
            # Extract the choice letter
            choice_match = re.search(r'Choice ([A-D])', choice_header)
            if choice_match:
                choice = choice_match.group(1).upper()
                # Combine header and text, clean up extra spaces
                full_text = (choice_header + choice_text).strip()
                full_text = re.sub(r'\s+', ' ', full_text)
                rationales[choice] = full_text
    
    return rationales

def download_question_html(question_id: str, base_dir: str = None) -> str:
    """Download HTML content for a question ID if it doesn't exist."""
    if base_dir is None:
        # Default to the /questions/ directory relative to this script
        base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.', 'questions')
    os.makedirs(base_dir, exist_ok=True)
    html_file_path = os.path.join(base_dir, f"{question_id}.html")

    # Check if HTML file already exists
    if os.path.exists(html_file_path):
        print(f"HTML file already exists for {question_id}, using cached version")
        return html_file_path

    print(f"Downloading HTML for question ID: {question_id}")
    url = f"https://sat-questions.onrender.com/question/module:english-group/{question_id}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        # Save HTML content
        with open(html_file_path, 'w', encoding='utf-8') as f:
            f.write(response.text)

        print(f"HTML saved to: {html_file_path}")
        return html_file_path

    except requests.RequestException as e:
        print(f"Error downloading HTML: {e}")
        return ""

def extract_sat_question_data(html_file_path: str) -> Dict[str, str]:
    """
    Extract SAT question data from HTML file.
    
    Args:
        html_file_path: Path to the HTML file
        
    Returns:
        Dictionary containing extracted data
    """
    
    with open(html_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # If the HTML contains 'Question not found', exit silently
    if 'Question not found' in content:
        sys.exit(0)
    # Find the JavaScript question object
    js_match = re.search(r'let question = ({.*?});', content, re.DOTALL)
    if not js_match:
        return {"error": "Could not find question data in HTML"}
    js_data = js_match.group(1)
    
    try:
        # Parse the JavaScript object as JSON
        question_data = json.loads(js_data)
        
        # Extract the specific fields you need
        content_data = question_data.get('content', {})
        
        extracted_data = {
            'question_id': question_data.get('questionId', ''),
            'domain': question_data.get('primary_class_cd_desc', ''),
            'skill': question_data.get('skill_desc', ''),
            'difficulty': question_data.get('difficulty', ''),
            'has_image': 'figure' in content_data.get('stem', '') or 'figure' in content_data.get('stimulus', ''),
            'passage': extract_passage_from_html(content),
            'question_text': re.sub(r'<[^>]+>', ' ', content_data.get('stem', '')).strip(),
            'answer_options': [re.sub(r'<[^>]+>', ' ', opt.get('content', '')).strip() for opt in content_data.get('answerOptions', [])],
            'correct_answer': extract_correct_answer_from_html(content),
            'answer_rationales': extract_answer_rationales(content_data.get('rationale', '')),
            'css_styles': extract_css_styles(content)
        }
        
        # Clean up difficulty mapping
        difficulty_map = {'E': 'Easy', 'M': 'Medium', 'H': 'Hard'}
        if extracted_data['difficulty'] in difficulty_map:
            extracted_data['difficulty'] = difficulty_map[extracted_data['difficulty']]
        
        return extracted_data
        
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse JSON: {e}"}

def main():
    # Get question ID from command line argument or use default
    if len(sys.argv) > 1:
        question_id = sys.argv[1]
    else:
        question_id = "00e0170f"  # Default question ID
    
    # Download HTML if it doesn't exist
    html_file = download_question_html(question_id)
    
    if not html_file:
        print(f"Failed to download HTML for question ID: {question_id}")
        return
    
    print(f"Extracting data from: {html_file}")
    print("=" * 60)
    
    extracted_data = extract_sat_question_data(html_file)
    
    if "error" in extracted_data:
        print(f"Error: {extracted_data['error']}")
        return
    
    # Display extracted data
    for key, value in extracted_data.items():
        if key in ['question_text', 'rationale', 'passage']:
            # Truncate long text for display
            if isinstance(value, str) and len(value) > 150:
                display_value = value[:150] + "..."
            else:
                display_value = value
        elif key == 'answer_options':
            display_value = f"[{len(value)} options]" if value else "[]"
        elif key == 'answer_rationales':
            display_value = f"[Rationales for {len(value)} choices]" if value else "{}"
        else:
            display_value = value
            
        print(f"{key.upper()}: {display_value}")
    
    # Save to JSON file in /questions/ directory
    questions_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.', 'questions')
    os.makedirs(questions_dir, exist_ok=True)
    json_file = os.path.join(questions_dir, f'{question_id}.json')

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(extracted_data, f, indent=2, ensure_ascii=False)

    print(f"\nData saved to: {json_file}")
    
    # Display answer rationales separately for clarity
    if extracted_data.get('answer_rationales') and isinstance(extracted_data['answer_rationales'], dict):
        print(f"\nAnswer Rationales:")
        print("-" * 40)
        for choice, rationale in extracted_data['answer_rationales'].items():
            print(f"Choice {choice}: {rationale[:100]}...")

def process_question(question_id: str) -> Dict[str, str]:
    """Process a single question ID - download if needed and extract data."""
    
    # Download HTML if it doesn't exist
    html_file = download_question_html(question_id)
    
    if not html_file:
        return {"error": f"Failed to download HTML for question ID: {question_id}"}
    
    # Extract data
    extracted_data = extract_sat_question_data(html_file)
    
    if "error" in extracted_data:
        return extracted_data
    
    # Save to JSON file in /questions/ directory
    questions_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'questions')
    os.makedirs(questions_dir, exist_ok=True)
    json_file = os.path.join(questions_dir, f'{question_id}_extracted.json')

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(extracted_data, f, indent=2, ensure_ascii=False)

    extracted_data['json_file'] = json_file
    return extracted_data

if __name__ == "__main__":
    main()
