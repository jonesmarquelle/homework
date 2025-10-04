#!/usr/bin/env python3
"""
Syllabus Extractor Script using Google Gemini API

This script uploads a PDF syllabus to Google Gemini and extracts structured data
including class name, course code, and assignments with due dates.
"""

import os
import sys
import argparse
import json
from pathlib import Path
from typing import Optional

try:
    from google import genai
    from dotenv import load_dotenv
    import sys
    from pathlib import Path
    
    # Add the shared directory to the Python path
    shared_path = Path(__file__).parent.parent.parent / "shared"
    sys.path.insert(0, str(shared_path))
    
    from custom_types import Syllabus
except ImportError as e:
    print(f"Error: Required package not found: {e}")
    print("Please install dependencies using: uv sync")
    sys.exit(1)

# Load environment variables from .env file
load_dotenv()


def validate_pdf_file(file_path: str) -> bool:
    """Validate that the file exists and is a PDF."""
    path = Path(file_path)
    
    if not path.exists():
        print(f"Error: File '{file_path}' does not exist.")
        return False
    
    if not path.is_file():
        print(f"Error: '{file_path}' is not a file.")
        return False
    
    if path.suffix.lower() != '.pdf':
        print(f"Error: '{file_path}' is not a PDF file.")
        return False
    
    return True


def extract_syllabus_structure(pdf_path: str) -> Optional[Syllabus]:
    """
    Upload a PDF file and extract structured syllabus information.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Parsed Syllabus object or None if error occurred
    """
    try:
        # Initialize the Gemini client
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        print(f"Uploading PDF file: {pdf_path}")
        
        # Upload the PDF file
        uploaded_file = client.files.upload(file=pdf_path)
        
        print("File uploaded successfully!")
        print(f"File ID: {uploaded_file.name}")
        
        # Create the extraction prompt
        prompt = """Extract the syllabus information from this document. 
Focus on finding:
1. The official class name
2. The course code (e.g., CS 251, MATH 101)
3. All assignments with their due dates, due times, and submission links

For assignments, extract:
- The full assignment name/title
- The due date in YYYY-MM-DD format (e.g., 2025-09-06, 2025-10-15). If not specified or unclear, use a reasonable default date in proper YYYY-MM-DD format.
- The due time (if not specified, use "11:59 PM" as default)
- The submission link (if not specified, use "N/A" as default)

IMPORTANT: All dates must be in YYYY-MM-DD format. Do not use MMDD-01-20 or any other format.

Look for submission links in various formats like URLs, Canvas links, or references to submission platforms.
"""
        
        print("Extracting structured syllabus data...")
        
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[prompt, uploaded_file],
            config={
                "response_mime_type": "application/json",
                "response_schema": Syllabus,
            }
        )
        
        # Parse the response into Pydantic objects
        syllabus_data: Syllabus = response.parsed
        return syllabus_data
        
    except Exception as e:
        print(f"Error during structured extraction: {str(e)}")
        return None


def main():
    """Main function to handle command line arguments and execute syllabus extraction."""
    parser = argparse.ArgumentParser(
        description="Extract structured syllabus data from PDF using Google Gemini API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python pdf_analyzer.py syllabus.pdf
  python pdf_analyzer.py syllabus.pdf --output syllabus.json
  python pdf_analyzer.py syllabus.pdf --output syllabus.txt
        """
    )
    
    parser.add_argument(
        "pdf_file",
        help="Path to the PDF syllabus file to extract data from"
    )
    
    parser.add_argument(
        "--output",
        help="Optional output file to save the structured data (JSON or text format)"
    )
    
    args = parser.parse_args()
    
    # Validate the PDF file
    if not validate_pdf_file(args.pdf_file):
        sys.exit(1)
    
    # Perform structured extraction
    print("Starting structured syllabus extraction...")
    syllabus_data = extract_syllabus_structure(args.pdf_file)
    
    if syllabus_data is None:
        print("Syllabus extraction failed.")
        sys.exit(1)
    
    # Display structured results
    print("\n" + "="*60)
    print("STRUCTURED SYLLABUS DATA")
    print("="*60)
    print(f"Class Name: {syllabus_data.class_name}")
    print(f"Course Code: {syllabus_data.course_code}")
    print(f"Number of Assignments: {len(syllabus_data.assignments)}")
    print("\nAssignments:")
    for i, assignment in enumerate(syllabus_data.assignments, 1):
        print(f"  {i}. {assignment.name}")
        print(f"     Due: {assignment.due_date} at {assignment.due_time}")
        print(f"     Submission: {assignment.submission_link}")
    print("="*60)
    
    # Save to output file if specified
    if args.output:
        try:
            if args.output.endswith('.json'):
                # Save as JSON
                with open(args.output, 'w', encoding='utf-8') as f:
                    json.dump(syllabus_data.model_dump(), f, indent=2, default=str)
            else:
                # Save as formatted text
                with open(args.output, 'w', encoding='utf-8') as f:
                    f.write(f"Structured Syllabus Data for: {args.pdf_file}\n")
                    f.write("="*60 + "\n")
                    f.write(f"Class Name: {syllabus_data.class_name}\n")
                    f.write(f"Course Code: {syllabus_data.course_code}\n")
                    f.write(f"Number of Assignments: {len(syllabus_data.assignments)}\n\n")
                    f.write("Assignments:\n")
                    for i, assignment in enumerate(syllabus_data.assignments, 1):
                        f.write(f"  {i}. {assignment.name}\n")
                        f.write(f"     Due: {assignment.due_date} at {assignment.due_time}\n")
                        f.write(f"     Submission: {assignment.submission_link}\n")
            print(f"\nStructured data saved to: {args.output}")
        except Exception as e:
            print(f"Error saving to output file: {str(e)}")


if __name__ == "__main__":
    main()
