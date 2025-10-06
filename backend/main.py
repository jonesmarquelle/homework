#!/usr/bin/env python3
"""
Main entry point for the Syllabus Analyzer FastAPI application.
"""

import uvicorn
from src.api import app

def main():
    """Run the FastAPI application."""
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Enable auto-reload for development
    )

if __name__ == "__main__":
    main()
