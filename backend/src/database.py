"""
Database models and configuration for the homework management system.
Uses SQLAlchemy to define database tables based on Pydantic models.
"""

from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime, ForeignKey, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import enum

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/homework.db")

# Ensure data directory exists
if "sqlite" in DATABASE_URL:
    db_path = DATABASE_URL.replace("sqlite:///", "")
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


class AssignmentStatus(enum.Enum):
    """Enum for assignment status values."""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class AssignmentDB(Base):
    """SQLAlchemy model for assignments table."""
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    due_date = Column(Date, nullable=False, index=True)
    due_time = Column(String(50), nullable=False)
    submission_link = Column(Text, nullable=False)
    status = Column(Enum(AssignmentStatus), nullable=False, default=AssignmentStatus.NOT_STARTED)
    
    # Foreign key to syllabus
    syllabus_id = Column(Integer, ForeignKey("syllabi.id"), nullable=False)
    
    # Relationship
    syllabus = relationship("SyllabusDB", back_populates="assignments")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SyllabusDB(Base):
    """SQLAlchemy model for syllabi table."""
    __tablename__ = "syllabi"
    
    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(255), nullable=False, index=True)
    course_code = Column(String(50), nullable=False, index=True)
    
    # Relationships
    assignments = relationship("AssignmentDB", back_populates="syllabus", cascade="all, delete-orphan")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session():
    """Get a database session for direct use."""
    return SessionLocal()
