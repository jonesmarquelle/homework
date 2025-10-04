"""
Shared data models for the homework management system.
These models define the structure of assignment and syllabus data.
"""

from pydantic import BaseModel, Field
from datetime import date
from typing import List


class Assignment(BaseModel):
    """Represents a single assignment with all its details."""
    name: str = Field(..., description="The full title or name of the assignment.")
    due_date: date = Field(..., description="The assignment's due date. Must be a valid date.")
    due_time: str = Field(..., description="The assignment's due time. Must be a valid time.")
    submission_link: str = Field(..., description="The link to submit the assignment.")


class Syllabus(BaseModel):
    """Represents a complete syllabus with class information and assignments."""
    class_name: str = Field(..., description="The official name of the class.")
    course_code: str = Field(..., description="The official course code of the class.")
    assignments: List[Assignment] = Field(..., description="A comprehensive list of all assignments found in the syllabus.")


class AssignmentData(BaseModel):
    """Alternative name for Syllabus to match frontend naming conventions."""
    class_name: str = Field(..., description="The official name of the class.")
    course_code: str = Field(..., description="The official course code of the class.")
    assignments: List[Assignment] = Field(..., description="A comprehensive list of all assignments found in the syllabus.")
