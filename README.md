# Homework Management System

A full-stack application for organizing academic assignments with PDF syllabus extraction and interactive assignment editing.

## Architecture

This project is organized into three main components:

- **Backend** (`backend/`): Python-based PDF syllabus extraction using Google Gemini API
- **Frontend** (`frontend/`): React/TypeScript assignment editor with drag-and-drop functionality  
- **Shared** (`shared/`): Common type definitions for data models

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.12+
- Google API key for Gemini

### Installation

1. **Install all dependencies:**
   ```bash
   yarn install:all
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env file in backend/ directory
   echo "GEMINI_API_KEY=your_api_key_here" > backend/.env
   ```

### Development

**Start both frontend and backend:**
```bash
yarn dev
```

**Or start individually:**
```bash
# Frontend only (React app)
yarn dev:frontend

# Backend only (Python PDF analyzer)
yarn dev:backend
```

## Usage

1. **Extract syllabus data from PDF:**
   ```bash
   cd backend
   python -m src.pdf_analyzer path/to/syllabus.pdf --output assignments.json
   ```

2. **Edit assignments in the web interface:**
   - Open http://localhost:5173
   - Drag and drop the generated JSON file
   - Edit assignments, dates, and submission links
   - Export to Google Calendar or view on Kanban board

## Project Structure

```
homework/
├── backend/                 # Python PDF analyzer
│   ├── src/
│   │   └── pdf_analyzer.py  # Main extraction logic
│   ├── examples/            # Sample files
│   ├── pyproject.toml       # Python dependencies
│   └── PDF_ANALYZER_README.md
├── frontend/                # React assignment editor
│   └── assignment-editor/
│       ├── src/
│       │   ├── components/
│       │   │   └── AssignmentEditor.tsx
│       │   └── App.tsx
│       └── package.json
├── shared/                  # Common type definitions
│   ├── types.py            # Python Pydantic models
│   └── types.ts            # TypeScript interfaces
└── package.json            # Workspace configuration
```

## Features

- **PDF Syllabus Extraction**: Automatically extract assignments from PDF syllabi using AI
- **Interactive Editing**: Drag-and-drop JSON files with inline editing capabilities
- **Data Validation**: Comprehensive validation for assignment data structure
- **Export Options**: Export assignments to Google Calendar or Kanban board
- **Responsive Design**: Mobile-friendly interface with modern UI
- **Type Safety**: Shared type definitions ensure consistency between frontend and backend
