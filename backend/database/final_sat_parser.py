import json
import re
import os
import requests
import sys
import time
import random
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
    """Extract clean passage text without HTML/CSS formatting."""
    # Look for the pattern within the question content area
    # Target the div containing paragraph elements after the my-6 div
    pattern = r'<div class="my-6"></div>\s*<div[^>]*><p>(.*?)</p></div>'
    match = re.search(pattern, html_content, re.DOTALL)
    
    if match:
        passage = match.group(1).strip()
        # Clean HTML tags and decode entities
        passage = re.sub(r'<[^>]+>', ' ', passage)
        passage = passage.replace('&rsquo;', "'").replace('&ldquo;', '"').replace('&rdquo;', '"').replace('&mdash;', '—').replace('&nbsp;', ' ').replace('&ndash;', '–')
        # Clean up whitespace
        passage = re.sub(r'\s+', ' ', passage).strip()
        return passage
    
    # Alternative pattern for passages that might be structured differently
    pattern_alt = r'<div class="my-6"></div>\s*<div[^>]*>(.*?)</div>'
    match_alt = re.search(pattern_alt, html_content, re.DOTALL)
    
    if match_alt:
        content = match_alt.group(1).strip()
        # Only extract text content, skip if it contains figures/images
        if '<figure' in content or '<svg' in content:
            return ""
        # Clean HTML tags and decode entities
        content = re.sub(r'<[^>]+>', ' ', content)
        content = content.replace('&rsquo;', "'").replace('&ldquo;', '"').replace('&rdquo;', '"').replace('&mdash;', '—').replace('&nbsp;', ' ').replace('&ndash;', '–')
        # Clean up whitespace
        content = re.sub(r'\s+', ' ', content).strip()
        return content
    
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

def extract_container_div(html_content: str) -> str:
    """Extract only the question content, excluding header, announcements, and navigation."""
    
    # Find the main body content after DOCTYPE and head
    # Look for everything between body tags
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL)
    if not body_match:
        return ""
    
    body_content = body_match.group(1)
    
    # Remove the header section (orange background with title)
    body_content = re.sub(
        r'<div class="bg-orange-600[^>]*>.*?</div>',
        '',
        body_content,
        flags=re.DOTALL
    )
    
    # Remove announcement banner (indigo background) 
    body_content = re.sub(
        r'<div class="container mx-auto px-2 pb-4">\s*<div class="bg-indigo-100[^>]*>.*?</div>\s*</div>',
        '',
        body_content,
        flags=re.DOTALL
    )
    
    # Remove navigation pagination section (the numbered links) - be more aggressive
    body_content = re.sub(
        r'<div class="mt-4 mb-14">.*?</div>\s*</div>',
        '',
        body_content,
        flags=re.DOTALL
    )
    
    # Remove any navigation links with href="/question/module"
    body_content = re.sub(
        r'<a[^>]*href="/question/module[^"]*"[^>]*>.*?</a>',
        '',
        body_content,
        flags=re.DOTALL
    )
    
    # Remove sr-only elements (screen reader only content)
    body_content = re.sub(
        r'<div[^>]*class="[^"]*sr-only[^"]*"[^>]*>.*?</div>',
        '',
        body_content,
        flags=re.DOTALL
    )
    
    # Remove any remaining navigation div blocks
    body_content = re.sub(
        r'<div[^>]*class="[^"]*flex[^"]*"[^>]*>.*?</div>',
        '',
        body_content,
        flags=re.DOTALL
    )
    
    # Clean up extra whitespace and empty lines
    body_content = re.sub(r'\n\s*\n\s*\n', '\n\n', body_content)
    body_content = body_content.strip()
    
    # Extract just the question content - look for the container with the actual question
    # Find the div that contains the question content (usually has x-data attribute)
    question_pattern = r'(<div class="container mx-auto"[^>]*>.*?<script.*?</script>.*?</div>)'
    question_match = re.search(question_pattern, body_content, re.DOTALL)
    
    if question_match:
        question_content = question_match.group(1)
        # Remove any remaining navigation elements inside
        question_content = re.sub(
            r'<div class="mt-4 mb-14">.*?</div>\s*</div>',
            '',
            question_content,
            flags=re.DOTALL
        )
        # Remove navigation links
        question_content = re.sub(
            r'<a[^>]*href="/question/module[^"]*"[^>]*>.*?</a>',
            '',
            question_content,
            flags=re.DOTALL
        )
        return question_content
    
    # Fallback: return cleaned body content wrapped in a container
    return f'<div class="container mx-auto">\n{body_content}\n</div>'

def extract_all_css_styles(html_content: str) -> str:
    """Extract all CSS styles from the HTML to preserve exact appearance."""
    css_content = ""
    
    # Extract inline styles from <style> tags
    style_pattern = r'<style[^>]*>(.*?)</style>'
    style_matches = re.findall(style_pattern, html_content, re.DOTALL)
    
    for style in style_matches:
        css_content += style.strip() + "\n\n"
    
    # Extract linked CSS content if available (though unlikely in downloaded HTML)
    # This would require additional requests to fetch external CSS files
    # For now, we'll focus on inline styles which should contain most styling
    
    return css_content.strip()

def create_minimal_html(container_div: str, css_styles: str, question_id: str) -> str:
    """Create a minimal HTML file with just the container div and necessary CSS."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAT Question {question_id}</title>
    <style>
{css_styles}

/* Hide screen reader only content */
.sr-only {{
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
    display: none !important;
}}
    </style>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body>
    {container_div}
</body>
</html>"""

def download_question_html(question_id: str, base_dir: Optional[str] = None) -> str:
    """Download HTML content for a question ID, extract container div and CSS, save minimal version."""
    if base_dir is None:
        # Default to the /questions/ directory relative to this script
        base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.', 'questions')
    os.makedirs(base_dir, exist_ok=True)
    
    # Paths for different file types
    html_file_path = os.path.join(base_dir, f"{question_id}.html")
    # css_file_path = os.path.join(base_dir, f"{question_id}.css")  # Commented out - may need later

    # Check if HTML file already exists
    if os.path.exists(html_file_path):
        print(f"HTML file already exists for {question_id}, using cached version")
        return html_file_path

    print(f"Downloading HTML for question ID: {question_id}")
    url = f"https://sat-questions.onrender.com/question/module:english-group/{question_id}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        # Extract container div and CSS
        container_div = extract_container_div(response.text)
        css_styles = extract_all_css_styles(response.text)
        
        if not container_div:
            print(f"Warning: Could not find container div for {question_id}")
            # Save original as fallback
            with open(html_file_path, 'w', encoding='utf-8') as f:
                f.write(response.text)
            return html_file_path
        
        # Save CSS file separately - COMMENTED OUT (may need later)
        # with open(css_file_path, 'w', encoding='utf-8') as f:
        #     f.write(css_styles)
        
        # Create and save minimal HTML (replace original)
        minimal_html = create_minimal_html(container_div, css_styles, question_id)
        with open(html_file_path, 'w', encoding='utf-8') as f:
            f.write(minimal_html)

        print(f"Minimal HTML saved to: {html_file_path}")
        # print(f"CSS saved to: {css_file_path}")  # Commented out
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
        
        # Check if it has images - skip if it does (we only want has_images: false)
        has_image = 'figure' in content_data.get('stem', '') or 'figure' in content_data.get('stimulus', '')
        if has_image:
            return {"error": "Skipping question: Contains images (has_image: true)"}
        
        extracted_data = {
            'question_id': question_data.get('questionId', ''),
            'domain': question_data.get('primary_class_cd_desc', ''),
            'skill': question_data.get('skill_desc', ''),
            'difficulty': question_data.get('difficulty', ''),
            'has_image': has_image,
            'passage': extract_passage_from_html(content),
            'question_text': re.sub(r'<[^>]+>', ' ', content_data.get('stem', '')).strip(),
            'answer_options': [re.sub(r'<[^>]+>', ' ', opt.get('content', '')).strip() for opt in content_data.get('answerOptions', [])],
            'correct_answer': extract_correct_answer_from_html(content),
            'answer_rationales': extract_answer_rationales(content_data.get('rationale', ''))
            # Removed css_styles and html_file fields
        }
        
        # Clean up difficulty mapping
        difficulty_map = {'E': 'Easy', 'M': 'Medium', 'H': 'Hard'}
        if extracted_data['difficulty'] in difficulty_map:
            extracted_data['difficulty'] = difficulty_map[extracted_data['difficulty']]
        
        return extracted_data
        
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse JSON: {e}"}



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
    questions_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.', 'questions')
    os.makedirs(questions_dir, exist_ok=True)
    json_file = os.path.join(questions_dir, f'{question_id}.json')

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(extracted_data, f, indent=2, ensure_ascii=False)

    extracted_data['json_file'] = json_file
    return extracted_data

def process_all_verbal_ids(ids_file: str = "VerbalIDs", start_from: int = 0, max_questions: Optional[int] = None) -> None:
    """
    Process all question IDs from the VerbalIDs file with safe intervals to avoid getting banned.
    
    Args:
        ids_file: Path to the file containing question IDs (one per line)
        start_from: Line number to start from (0-indexed, useful for resuming)
        max_questions: Maximum number of questions to process (None for all)
    """
    
    # Check if the IDs file exists
    if not os.path.exists(ids_file):
        print(f"Error: {ids_file} file not found!")
        return
    
    # Read all question IDs
    with open(ids_file, 'r') as f:
        question_ids = [line.strip() for line in f.readlines() if line.strip()]
    
    total_ids = len(question_ids)
    print(f"Found {total_ids} question IDs in {ids_file}")
    
    # Apply start_from and max_questions limits
    if start_from > 0:
        question_ids = question_ids[start_from:]
        print(f"Starting from line {start_from + 1}")
    
    if max_questions:
        question_ids = question_ids[:max_questions]
        print(f"Processing maximum {max_questions} questions")
    
    print(f"Will process {len(question_ids)} questions")
    print("=" * 60)
    
    # Counters for tracking progress
    processed = 0
    skipped = 0
    errors = 0
    
    for i, question_id in enumerate(question_ids):
        current_line = start_from + i + 1
        print(f"\n[{current_line}/{total_ids}] Processing: {question_id}")
        
        try:
            # Process the question
            result = process_question(question_id)
            
            if "error" in result:
                if "Skipping question:" in result["error"]:
                    print(f"  SKIPPED: {result['error']}")
                    skipped += 1
                else:
                    print(f"  ERROR: {result['error']}")
                    errors += 1
            else:
                print(f"  SUCCESS: Saved to {result.get('json_file', 'JSON file')}")
                processed += 1
        
        except Exception as e:
            print(f"  EXCEPTION: {str(e)}")
            errors += 1
        
        # Safe interval between requests to avoid getting banned
        if i < len(question_ids) - 1:  # Don't wait after the last question
            # Random delay between 0.5-2 seconds to be more human-like but faster
            delay = random.uniform(0.5, 2.0)
            print(f"  Waiting {delay:.1f} seconds...")
            time.sleep(delay)
            
            # Longer break every 100 questions (3-8 seconds)
            if (i + 1) % 100 == 0:
                longer_delay = random.uniform(3.0, 8.0)
                print(f"  📋 Progress checkpoint: {processed} processed, {skipped} skipped, {errors} errors")
                print(f"  Taking longer break: {longer_delay:.1f} seconds...")
                time.sleep(longer_delay)
    
    # Final summary
    print("\n" + "=" * 60)
    print("BATCH PROCESSING COMPLETE!")
    print(f"Total processed successfully: {processed}")
    print(f"Total skipped (images/other): {skipped}")
    print(f"Total errors: {errors}")
    print(f"Total attempted: {len(question_ids)}")
    
    if errors > 0:
        print(f"\n⚠️  {errors} errors occurred. Check the output above for details.")
    if processed > 0:
        print(f"✅ {processed} questions successfully processed and saved as JSON files.")

def main():
    # Check if we're running in batch mode
    if len(sys.argv) > 1 and sys.argv[1] == "batch":
        # Parse additional arguments for batch processing
        start_from = 0
        max_questions = None
        
        if len(sys.argv) > 2:
            try:
                start_from = int(sys.argv[2])
            except ValueError:
                print("Error: start_from must be an integer")
                return
        
        if len(sys.argv) > 3:
            try:
                max_questions = int(sys.argv[3])
            except ValueError:
                print("Error: max_questions must be an integer")
                return
        
        print("🚀 Starting batch processing of VerbalIDs...")
        process_all_verbal_ids(start_from=start_from, max_questions=max_questions)
        return
    
    # Single question processing (original behavior)
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
        if "Skipping question:" in extracted_data["error"]:
            print(f"SKIPPED: {extracted_data['error']}")
        else:
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

if __name__ == "__main__":
    main()