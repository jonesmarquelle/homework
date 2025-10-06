# Shared package for homework management system

# Import and expose the custom_types module
from . import custom_types

# Make the classes available at package level
from .custom_types import Syllabus, Assignment, AssignmentData

__all__ = ['custom_types', 'Syllabus', 'Assignment', 'AssignmentData']