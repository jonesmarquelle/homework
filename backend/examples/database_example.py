"""
Example usage of the database helper functions.
Demonstrates how to create, read, update, and delete syllabi and assignments.
"""

from datetime import date
import sys
import os

# Add the src directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
# Add the shared directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'shared'))

from init_db import init_database
from db_helpers import (
    create_syllabus_with_session,
    get_all_syllabi_with_session,
    get_syllabus_by_course_code_with_session,
    db_syllabus_to_pydantic,
    get_upcoming_assignments,
    get_db_session
)
from custom_types import Assignment, Syllabus

def main():
    """Demonstrate database operations."""
    print("Initializing database...")
    init_database()
    
    # Create sample data
    sample_assignments = [
        Assignment(
            name="Midterm Exam",
            due_date=date(2025, 10, 10),
            due_time="10:00 AM",
            submission_link="https://example.com/midterm"
        ),
        Assignment(
            name="Final Project",
            due_date=date(2024, 5, 10),
            due_time="11:59 PM",
            submission_link="https://example.com/final-project"
        ),
        Assignment(
            name="Homework 1",
            due_date=date(2024, 2, 20),
            due_time="11:59 PM",
            submission_link="https://example.com/hw1"
        )
    ]
    
    sample_syllabus = Syllabus(
        class_name="Advanced Computer Science",
        course_code="CS-401",
        assignments=sample_assignments
    )
    
    print("Creating syllabus...")
    created_syllabus = create_syllabus_with_session(sample_syllabus)
    print(f"Created syllabus with ID: {created_syllabus.id}")
    
    print("\nRetrieving all syllabi...")
    all_syllabi = get_all_syllabi_with_session()
    for syllabus in all_syllabi:
        print(f"- {syllabus.course_code}: {syllabus.class_name}")
    
    print("\nSearching for specific course...")
    found_syllabus = get_syllabus_by_course_code_with_session(sample_syllabus.course_code)
    if found_syllabus:
        pydantic_syllabus = db_syllabus_to_pydantic(found_syllabus)
        print(f"Found: {pydantic_syllabus.class_name}")
        print("Assignments:")
        for assignment in pydantic_syllabus.assignments:
            print(f"  - {assignment.name} (Due: {assignment.due_date} at {assignment.due_time})")
    
    print("\nGetting upcoming assignments...")
    with get_db_session() as db:
        upcoming = get_upcoming_assignments(db, days_ahead=7)
        print(f"Found {len(upcoming)} upcoming assignments:")
        for assignment in upcoming:
            print(f"  - {assignment.name} (Due: {assignment.due_date})")

if __name__ == "__main__":
    main()
