#!/usr/bin/env python3

"""
Extract all unique question IDs directly from a PDF using fast text extraction.
"""

import os
import sys
import re
import PyPDF2
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import fitz  # PyMuPDF


def extract_text_from_page(pdf_path, page_num):
    """Extract text from a single PDF page using PyMuPDF."""
    try:
        doc = fitz.open(pdf_path)
        page = doc[page_num]
        text = page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"Error processing page {page_num}: {e}")
        return ""


def extract_ids_from_text(text):
    """Extract question IDs from text."""
    question_id_pattern = re.compile(r'Question ID\s+(\w+)', re.IGNORECASE)
    ids = set()
    for match in question_id_pattern.finditer(text):
        ids.add(match.group(1))
    return ids


def extract_ids_from_pdf_fast(pdf_path, output_path, max_workers=20):
    """Extract all unique question IDs from a PDF using fast text extraction with multithreading."""
    print(f"Opening PDF: {pdf_path}")
    
    # Get total number of pages
    doc = fitz.open(pdf_path)
    total_pages = doc.page_count
    doc.close()
    
    print(f"Processing {total_pages} pages with {max_workers} threads...")
    
    unique_ids = set()
    ids_lock = Lock()
    
    # Process pages in parallel
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all page extraction tasks
        future_to_page = {
            executor.submit(extract_text_from_page, pdf_path, page_num): page_num 
            for page_num in range(total_pages)
        }
        
        # Process completed tasks
        for future in as_completed(future_to_page):
            page_num = future_to_page[future]
            try:
                text = future.result()
                if text:
                    page_ids = extract_ids_from_text(text)
                    if page_ids:
                        with ids_lock:
                            unique_ids.update(page_ids)
                        print(f"Page {page_num + 1}: Found {len(page_ids)} IDs")
            except Exception as e:
                print(f"Error processing page {page_num + 1}: {e}")
    
    # Write results
    with open(output_path, 'w', encoding='utf-8') as f:
        for qid in sorted(unique_ids):
            f.write(f"{qid}\n")
    
    print(f"Extracted {len(unique_ids)} unique IDs to {output_path}")
    return unique_ids


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_ids.py <pdf_file>")
        sys.exit(1)
    
    pdf_file = sys.argv[1]
    output_file = os.path.join(os.path.dirname(__file__), 'question_ids.txt')
    extract_ids_from_pdf_fast(pdf_file, output_file)
