# Architecture Overview

## Project Structure

```
homework/
├── 📁 backend/                    # Python Backend
│   ├── 📁 src/
│   │   └── 📄 pdf_analyzer.py     # PDF extraction logic
│   ├── 📁 examples/               # Sample files
│   ├── 📄 pyproject.toml          # Python dependencies
│   ├── 📄 uv.lock                 # Lock file
│   └── 📄 PDF_ANALYZER_README.md  # Backend documentation
│
├── 📁 frontend/                   # React Frontend
│   └── 📁 assignment-editor/
│       ├── 📁 src/
│       │   ├── 📁 components/
│       │   │   └── 📄 AssignmentEditor.tsx
│       │   ├── 📄 App.tsx
│       │   └── 📄 App.css
│       ├── 📄 package.json        # Frontend dependencies
│       └── 📄 README.md           # Frontend documentation
│
├── 📁 shared/                     # Shared Type Definitions
│   ├── 📄 types.py               # Python Pydantic models
│   ├── 📄 types.ts               # TypeScript interfaces
│   └── 📄 README.md              # Types documentation
│
├── 📄 package.json               # Workspace configuration
├── 📄 README.md                  # Main project documentation
└── 📄 ARCHITECTURE.md            # This file
```

## Data Flow

```
PDF Syllabus → Backend (Python) → JSON → Frontend (React) → User Interface
     ↓              ↓                    ↓              ↓
  Upload PDF    Extract Data        Parse JSON    Edit Assignments
  (Gemini API)  (Pydantic)        (TypeScript)   (React State)
```

## Component Responsibilities

### Backend (`backend/`)
- **PDF Analysis**: Extract structured data from PDF syllabi using Google Gemini API
- **Data Validation**: Use Pydantic models for robust data validation
- **JSON Export**: Generate structured JSON output for frontend consumption
- **Command Line Interface**: Provide CLI for PDF processing

### Frontend (`frontend/`)
- **File Upload**: Drag-and-drop JSON file handling
- **Data Visualization**: Display assignments in an interactive interface
- **Inline Editing**: Allow users to modify assignment details
- **Export Options**: Integration with Google Calendar and Kanban boards
- **Responsive Design**: Mobile-friendly UI with modern styling

### Shared (`shared/`)
- **Type Definitions**: Common data models for both frontend and backend
- **Data Consistency**: Ensure type safety across the entire application
- **Documentation**: Clear specification of data structures

## Development Workflow

1. **Setup**: Run `yarn install:all` to install all dependencies
2. **Backend Development**: Use `yarn dev:backend` for Python development
3. **Frontend Development**: Use `yarn dev:frontend` for React development
4. **Full Stack**: Use `yarn dev` to run both simultaneously

## Benefits of This Architecture

- **Separation of Concerns**: Clear boundaries between frontend, backend, and shared code
- **Type Safety**: Shared type definitions prevent data inconsistencies
- **Scalability**: Easy to add new features or modify existing ones
- **Maintainability**: Well-organized codebase with clear documentation
- **Development Experience**: Workspace configuration simplifies development workflow
