# Backend: Syllabus Extractor with Google Gemini

This Python backend extracts structured data from PDF syllabi using Google Gemini API, including class name, course code, and assignments with due dates.

> **Note**: This is part of the homework management system. See the main README.md for full project setup.

## Setup

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Set up Google API key:**
   You need to set up your Google API key for the Gemini API. You can do this by:
   - Setting the `GOOGLE_API_KEY` environment variable
   - Or create a `.env` file in the root directory with the following content:
     ```env
     GOOGLE_API_KEY=your_api_key_here
     ```
   - Or following the Google AI Studio setup instructions

## Usage

### Command Line Interface

Basic usage:
```bash
python pdf_analyzer.py path/to/your/syllabus.pdf
```

Save results to file:
```bash
# Save as JSON
python pdf_analyzer.py syllabus.pdf --output syllabus.json

# Save as formatted text
python pdf_analyzer.py syllabus.pdf --output syllabus.txt
```

### Programmatic Usage

```python
from pdf_analyzer import extract_syllabus_structure
import json

# Extract structured syllabus data
syllabus_data = extract_syllabus_structure("syllabus.pdf")

if syllabus_data:
    print(f"Class: {syllabus_data.class_name}")
    print(f"Course Code: {syllabus_data.course_code}")
    print(f"Assignments: {len(syllabus_data.assignments)}")
    
    # Convert to JSON
    json_data = json.dumps(syllabus_data.model_dump(), indent=2, default=str)
    print(json_data)
```

## Features

- ✅ PDF file validation
- ✅ Error handling and user-friendly messages
- ✅ Optional output file saving (JSON or text format)
- ✅ Command-line interface with help
- ✅ Programmatic API for integration
- ✅ **Structured output with Pydantic models**
- ✅ **JSON export for structured data**
- ✅ **Syllabus-specific extraction (class name, course code, assignments)**

## What Gets Extracted

The script automatically extracts:

- **Class Name:** The official name of the course
- **Course Code:** The official course code (e.g., CS 251, MATH 101)
- **Assignments:** A comprehensive list of all assignments with:
  - Assignment name/title
  - Due date

## Structured Data Models

The script uses Pydantic models for structured output:

```python
from pydantic import BaseModel, Field
from datetime import date
from typing import List

class Assignment(BaseModel):
    name: str = Field(..., description="The full title or name of the assignment.")
    due_date: date = Field(..., description="The assignment's due date. Must be a valid date.")
    due_time: str = Field(..., description="The assignment's due time. Must be a valid time.")
    submission_link: str = Field(..., description="The link to submit the assignment.")


class Syllabus(BaseModel):
    class_name: str = Field(..., description="The official name of the class.")
    course_code: str = Field(..., description="The official course code of the class.")
    assignments: List[Assignment] = Field(..., description="A comprehensive list of all assignments found in the syllabus.")
```

## Requirements

- Python 3.9+
- google-generativeai package
- pydantic package
- Valid Google API key for Gemini

## Error Handling

The script includes comprehensive error handling for:
- Missing or invalid PDF files
- API connection issues
- File upload failures
- Model response errors

## Example Output

```
Uploading PDF file: syllabus.pdf
File uploaded successfully!
File ID: files/abc123xyz
Extracting structured syllabus data...

============================================================
STRUCTURED SYLLABUS DATA
============================================================
Class Name: Programming with Java
Course Code: CS 251
Number of Assignments: 8

Assignments:
  1. Homework 1: Introduction to Java (Due: 2024-01-15)
  2. Lab 1: Variables and Data Types (Due: 2024-01-22)
  3. Homework 2: Control Structures (Due: 2024-01-29)
  4. Lab 2: Methods and Classes (Due: 2024-02-05)
  5. Midterm Project: Java Application (Due: 2024-02-19)
  6. Homework 3: Inheritance and Polymorphism (Due: 2024-03-05)
  7. Lab 3: Exception Handling (Due: 2024-03-12)
  8. Final Project: Complete Java Program (Due: 2024-04-15)
============================================================
```
