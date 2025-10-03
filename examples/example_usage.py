#!/usr/bin/env python3
"""
Example usage of the syllabus extractor script.

This demonstrates how to use the pdf_analyzer module programmatically for structured syllabus extraction.
"""

import os
import json
from pdf_analyzer import validate_pdf_file, extract_syllabus_structure


def example_syllabus_extraction():
    """Example of how to use the syllabus extractor programmatically."""
    
    # Example PDF path (you can change this to your actual PDF)
    pdf_path = "example_syllabi/CS 251 - PROGRAMMING WITH JAVA.pdf"
    
    # Check if the example PDF exists
    if not os.path.exists(pdf_path):
        print(f"Example PDF not found at: {pdf_path}")
        print("Please provide a valid PDF file path.")
        return
    
    # Validate the PDF file
    if not validate_pdf_file(pdf_path):
        return
    
    print("=== Structured Syllabus Extraction Example ===")
    syllabus_data = extract_syllabus_structure(pdf_path)
    
    if syllabus_data:
        print(f"Class Name: {syllabus_data.class_name}")
        print(f"Course Code: {syllabus_data.course_code}")
        print(f"Number of Assignments: {len(syllabus_data.assignments)}")
        print("\nAssignments:")
        for i, assignment in enumerate(syllabus_data.assignments, 1):
            print(f"  {i}. {assignment.name} (Due: {assignment.due_date})")
        
        # Example: Convert to JSON
        print("\n--- JSON Output ---")
        json_output = json.dumps(syllabus_data.model_dump(), indent=2, default=str)
        print(json_output[:500] + "..." if len(json_output) > 500 else json_output)
        
        # Example: Save to file
        print("\n--- Saving to File ---")
        with open("example_syllabus_output.json", "w", encoding="utf-8") as f:
            json.dump(syllabus_data.model_dump(), f, indent=2, default=str)
        print("✅ Saved to example_syllabus_output.json")
        
    else:
        print("❌ Syllabus extraction failed")


if __name__ == "__main__":
    example_syllabus_extraction()
