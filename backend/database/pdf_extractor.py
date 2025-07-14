

import os
import sys
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import io
import re


def extract_first_100_lines(pdf_path, output_path, max_lines=10000):
    # Convert PDF pages to images
    # Limit to first 10 pages for memory efficiency
    images = convert_from_path(pdf_path, first_page=1, last_page=10)
    lines = []
    marker1 = "a15b3219"
    marker2 = "In the United States, firms often seek incentives"
    image_filename = os.path.join(os.path.dirname(output_path), "extracted_image.png")

    # Fuzzy matching helpers
    def fuzzy_match(text, pattern):
        # Accept substring match, ignore case, ignore whitespace
        return pattern.lower().replace(' ', '') in text.lower().replace(' ', '')

    for page_num, img in enumerate(images):
        ocr_data = pytesseract.image_to_data(img, lang='eng', output_type=pytesseract.Output.DICT)
        text = pytesseract.image_to_string(img, lang='eng')
        img_lines = text.splitlines()
        for line in img_lines:
            if len(lines) < max_lines:
                lines.append(line)
            else:
                break

        # Build lines from OCR data
        n = len(ocr_data['level'])
        line_map = {}
        for i in range(n):
            line_num = ocr_data['line_num'][i]
            if line_num not in line_map:
                line_map[line_num] = {
                    'text': [],
                    'top': ocr_data['top'][i],
                    'height': ocr_data['height'][i]
                }
            line_map[line_num]['text'].append(ocr_data['text'][i])

        # Join words into lines
        ocr_lines = []
        for ln in sorted(line_map.keys()):
            line_text = ' '.join([w for w in line_map[ln]['text'] if w.strip()])
            ocr_lines.append({
                'text': line_text,
                'top': line_map[ln]['top'],
                'height': line_map[ln]['height']
            })

        # Print all OCR lines for debugging
        print(f"\n--- OCR lines for page {page_num+1} ---")
        for idx, l in enumerate(ocr_lines):
            print(f"{idx}: '{l['text']}' (top={l['top']}, height={l['height']})")

        # Find marker lines and check if both are in the same line
        marker1_line = None
        marker2_line = None
        marker1_idx = -1
        marker2_idx = -1
        for idx, l in enumerate(ocr_lines):
            if marker1_line is None and fuzzy_match(l['text'], marker1):
                marker1_line = l
                marker1_idx = idx
            if marker2_line is None and fuzzy_match(l['text'], marker2):
                marker2_line = l
                marker2_idx = idx

        # If both markers are in the same line
        if marker1_idx == marker2_idx and marker1_idx != -1:
            line_text = ocr_lines[marker1_idx]['text']
            print(f"Both markers found in the same OCR line: '{line_text}' (top={ocr_lines[marker1_idx]['top']}, height={ocr_lines[marker1_idx]['height']})")
            # Find character positions
            pos1 = line_text.lower().find(marker1.lower())
            pos2 = line_text.lower().find(marker2.lower())
            print(f"Marker1 position: {pos1}, Marker2 position: {pos2}")
            # Crop a region just a bit further below this line (heuristic: 350px gap, then 300px window)
            y_start = ocr_lines[marker1_idx]['top'] + ocr_lines[marker1_idx]['height'] + 350
            y_end = min(y_start + 300, img.height)
            print(f"Cropping region just a bit further below marker line: y={y_start} to y={y_end} on page {page_num+1}")
            cropped_img = img.crop((0, y_start, img.width, y_end))
            cropped_img.save(image_filename)
            break
        # If both markers found on this page, extract region strictly between them (marker2 below marker1)
        elif marker1_line and marker2_line:
            pad = 10
            y1 = marker1_line['top'] + marker1_line['height'] + pad
            y2 = marker2_line['top'] - pad
            if y2 > y1:
                print(f"Extracting region from y={y1} to y={y2} on page {page_num+1}")
                cropped_img = img.crop((0, y1, img.width, y2))
                cropped_img.save(image_filename)
            else:
                print(f"Markers found but marker2 is not below marker1 (y1={y1}, y2={y2}) on page {page_num+1}. No extraction.")
            break
        if len(lines) >= max_lines:
            break

    # Write to output file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

if __name__ == "__main__":
    # Example usage: python pdf_extractor.py math780.pdf
    if len(sys.argv) < 2:
        print("Usage: python pdf_extractor.py <pdf_file>")
        sys.exit(1)
    pdf_file = sys.argv[1]
    output_file = os.path.join(os.path.dirname(__file__), '../debug_text.txt')
    extract_first_100_lines(pdf_file, output_file)
