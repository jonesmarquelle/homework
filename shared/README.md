# Shared: Type Definitions

This directory contains shared type definitions used by both the frontend and backend components of the homework management system.

## Files

- **`types.py`**: Python Pydantic models for data validation and serialization
- **`types.ts`**: TypeScript interfaces for frontend type safety

## Data Models

### Assignment
Represents a single assignment with:
- `name`: Assignment title/name
- `due_date`: Due date in YYYY-MM-DD format
- `due_time`: Due time (e.g., "11:59 PM")
- `submission_link`: URL for assignment submission

### AssignmentData / Syllabus
Represents a complete course with:
- `class_name`: Official course name
- `course_code`: Course code (e.g., "CS 251")
- `assignments`: Array of Assignment objects

## Usage

### Python (Backend)
```python
from types import Assignment, Syllabus

# Create assignment data
assignment = Assignment(
    name="Homework 1",
    due_date="2024-01-15",
    due_time="11:59 PM",
    submission_link="https://canvas.example.edu/assignments/123"
)
```

### TypeScript (Frontend)
```typescript
import { Assignment, AssignmentData } from '../../../../shared/types';

const assignment: Assignment = {
  name: "Homework 1",
  due_date: "2024-01-15",
  due_time: "11:59 PM",
  submission_link: "https://canvas.example.edu/assignments/123"
};
```

## Benefits

- **Type Safety**: Ensures data consistency between frontend and backend
- **Single Source of Truth**: Changes to data models only need to be made in one place
- **Documentation**: Clear definition of expected data structure
- **Validation**: Pydantic models provide automatic validation in Python
