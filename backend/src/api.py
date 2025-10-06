#!/usr/bin/env python3
"""
FastAPI application for PDF syllabus analysis.
Provides REST API endpoints for uploading and analyzing PDF syllabi.
"""

import os
import tempfile
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add current src directory to path
import sys
from pathlib import Path
src_path = Path(__file__).parent
sys.path.insert(0, str(src_path))

# Set up shared paths
from path_utils import setup_shared_paths
setup_shared_paths()

from custom_types import Syllabus
from pdf_analyzer import extract_syllabus_structure
from database import create_tables
from db_helpers import get_db_session, upsert_syllabus, get_all_syllabi_with_session, db_syllabus_to_pydantic, delete_syllabus
from database import SyllabusDB

# Response models
class AnalysisResponse(BaseModel):
    """Response model for PDF analysis."""
    success: bool
    message: str
    data: Optional[Syllabus] = None
    error: Optional[str] = None

class DatabaseResponse(BaseModel):
    """Response model for database operations."""
    success: bool
    message: str
    syllabus_id: Optional[int] = None
    error: Optional[str] = None

# Initialize FastAPI app
app = FastAPI(
    title="Syllabus Analyzer API",
    description="API for analyzing PDF syllabi and extracting assignment information",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint to check if the API is running."""
    return {"message": "Syllabus Analyzer API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "syllabus-analyzer"}

@app.post("/analyze-pdf", response_model=AnalysisResponse)
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Upload and analyze a PDF syllabus file.
    
    Args:
        file: The PDF file to analyze
        
    Returns:
        AnalysisResponse with extracted syllabus data
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF"
        )
    
    # Check if GEMINI_API_KEY is available
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable not set"
        )
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Extract syllabus structure
            syllabus_data = extract_syllabus_structure(temp_file_path)
            
            if syllabus_data is None:
                return AnalysisResponse(
                    success=False,
                    message="Failed to extract syllabus data",
                    error="PDF analysis failed"
                )
            
            return AnalysisResponse(
                success=True,
                message="Syllabus analyzed successfully",
                data=syllabus_data
            )
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing PDF: {str(e)}"
        )

@app.post("/save-to-database", response_model=DatabaseResponse)
async def save_to_database(syllabus_data: Syllabus):
    """
    Save extracted syllabus data to the database.
    
    Args:
        syllabus_data: The parsed Syllabus object
        
    Returns:
        DatabaseResponse with operation result
    """
    try:
        # Ensure database tables exist
        create_tables()
        
        # Get database session and save data
        db = get_db_session()
        try:
            db_syllabus = upsert_syllabus(db, syllabus_data)
            return DatabaseResponse(
                success=True,
                message="Syllabus saved to database successfully",
                syllabus_id=db_syllabus.id
            )
        finally:
            db.close()
            
    except Exception as e:
        return DatabaseResponse(
            success=False,
            message="Failed to save syllabus to database",
            error=str(e)
        )

@app.post("/analyze-and-save", response_model=dict)
async def analyze_and_save(file: UploadFile = File(...)):
    """
    Analyze PDF and save to database in one operation.
    
    Args:
        file: The PDF file to analyze and save
        
    Returns:
        Combined response with analysis and database operation results
    """
    # First analyze the PDF
    analysis_result = await analyze_pdf(file)
    
    if not analysis_result.success:
        return {
            "analysis": analysis_result,
            "database": DatabaseResponse(
                success=False,
                message="Skipped database save due to analysis failure"
            )
        }
    
    # If analysis succeeded, save to database
    db_result = await save_to_database(analysis_result.data)
    
    return {
        "analysis": analysis_result,
        "database": db_result
    }

@app.get("/syllabi")
async def get_syllabi():
    """
    Get all syllabi from the database.
    
    Returns:
        List of all syllabi with their assignments
    """
    try:
        # Ensure database tables exist
        create_tables()
        
        # Get all syllabi from database
        db_syllabi = get_all_syllabi_with_session()
        
        # Convert to Pydantic models
        syllabi_data = [db_syllabus_to_pydantic(syllabus) for syllabus in db_syllabi]
        
        return {
            "success": True,
            "message": f"Retrieved {len(syllabi_data)} syllabi",
            "data": syllabi_data
        }
    except Exception as e:
        print(f"Error retrieving syllabi: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving syllabi: {str(e)}"
        )

@app.put("/syllabi/{syllabus_id}")
async def update_syllabus(syllabus_id: int, syllabus_data: Syllabus):
    """
    Update an existing syllabus in the database.
    
    Args:
        syllabus_id: The ID of the syllabus to update
        syllabus_data: The updated syllabus data
        
    Returns:
        DatabaseResponse with operation result
    """
    try:
        # Ensure database tables exist
        create_tables()
        
        # Get database session and update data
        db = get_db_session()
        try:
            # Check if syllabus exists
            existing_syllabus = db.query(SyllabusDB).filter(SyllabusDB.id == syllabus_id).first()
            if not existing_syllabus:
                raise HTTPException(
                    status_code=404,
                    detail=f"Syllabus with ID {syllabus_id} not found"
                )
            
            # Update the syllabus using upsert_syllabus
            updated_syllabus = upsert_syllabus(db, syllabus_data)
            
            return DatabaseResponse(
                success=True,
                message="Syllabus updated successfully",
                syllabus_id=updated_syllabus.id
            )
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        return DatabaseResponse(
            success=False,
            message="Failed to update syllabus",
            error=str(e)
        )

@app.delete("/syllabi/{syllabus_id}")
async def delete_syllabus_endpoint(syllabus_id: int):
    """
    Delete a syllabus from the database.
    
    Args:
        syllabus_id: The ID of the syllabus to delete
        
    Returns:
        DatabaseResponse with operation result
    """
    try:
        # Ensure database tables exist
        create_tables()
        
        # Get database session and delete syllabus
        db = get_db_session()
        try:
            # Check if syllabus exists
            existing_syllabus = db.query(SyllabusDB).filter(SyllabusDB.id == syllabus_id).first()
            if not existing_syllabus:
                raise HTTPException(
                    status_code=404,
                    detail=f"Syllabus with ID {syllabus_id} not found"
                )
            
            # Delete the syllabus
            success = delete_syllabus(db, syllabus_id)
            
            if success:
                return DatabaseResponse(
                    success=True,
                    message="Syllabus deleted successfully"
                )
            else:
                return DatabaseResponse(
                    success=False,
                    message="Failed to delete syllabus"
                )
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        return DatabaseResponse(
            success=False,
            message="Failed to delete syllabus",
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
