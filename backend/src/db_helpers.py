"""
Database helper methods for CRUD operations.
Provides functions to convert between Pydantic models and SQLAlchemy models.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import date

from database import AssignmentDB, SyllabusDB, get_db_session

# Set up shared paths
from path_utils import setup_shared_paths
setup_shared_paths()
from custom_types import Assignment, Syllabus, AssignmentData


def upsert_syllabus(db: Session, syllabus_data: Syllabus) -> SyllabusDB:
    """Create or update a syllabus in the database based on ID."""
    from sqlalchemy.orm import joinedload
    
    # Check if syllabus with this ID already exists
    existing_syllabus = db.query(SyllabusDB).options(joinedload(SyllabusDB.assignments)).filter(
        SyllabusDB.id == syllabus_data.id
    ).first()
    
    if existing_syllabus:
        # Update existing syllabus
        existing_syllabus.class_name = syllabus_data.class_name
        existing_syllabus.course_code = syllabus_data.course_code
        
        # Clear existing assignments
        for assignment in existing_syllabus.assignments:
            db.delete(assignment)
        
        # Add new assignments
        for assignment in syllabus_data.assignments:
            db_assignment = AssignmentDB(
                name=assignment.name,
                due_date=assignment.due_date,
                due_time=assignment.due_time,
                submission_link=assignment.submission_link,
                syllabus_id=existing_syllabus.id
            )
            db.add(db_assignment)
        
        db.commit()
        db.refresh(existing_syllabus)
        return existing_syllabus
    else:
        # Create new syllabus
        db_syllabus = SyllabusDB(
            class_name=syllabus_data.class_name,
            course_code=syllabus_data.course_code
        )
        db.add(db_syllabus)
        db.flush()  # Flush to get the ID
        print("New syllabus ID: ", db_syllabus.id)
        
        # Create assignments
        for assignment in syllabus_data.assignments:
            db_assignment = AssignmentDB(
                name=assignment.name,
                due_date=assignment.due_date,
                due_time=assignment.due_time,
                submission_link=assignment.submission_link,
                syllabus_id=db_syllabus.id
            )
            db.add(db_assignment)
        
        db.commit()
        db.refresh(db_syllabus)
        return db_syllabus


def get_syllabus(db: Session, syllabus_id: int) -> Optional[SyllabusDB]:
    """Get a syllabus by ID."""
    from sqlalchemy.orm import joinedload
    return db.query(SyllabusDB).options(joinedload(SyllabusDB.assignments)).filter(SyllabusDB.id == syllabus_id).first()


def get_syllabus_by_course_code(db: Session, course_code: str) -> Optional[SyllabusDB]:
    """Get a syllabus by course code."""
    from sqlalchemy.orm import joinedload
    return db.query(SyllabusDB).options(joinedload(SyllabusDB.assignments)).filter(SyllabusDB.course_code == course_code).first()


def get_all_syllabi(db: Session) -> List[SyllabusDB]:
    """Get all syllabi."""
    from sqlalchemy.orm import joinedload
    return db.query(SyllabusDB).options(joinedload(SyllabusDB.assignments)).all()


def update_syllabus(db: Session, syllabus_id: int, syllabus_data: Syllabus) -> Optional[SyllabusDB]:
    """Update an existing syllabus."""
    db_syllabus = get_syllabus(db, syllabus_id)
    if not db_syllabus:
        return None
    
    # Update syllabus fields
    db_syllabus.class_name = syllabus_data.class_name
    db_syllabus.course_code = syllabus_data.course_code
    
    # Delete existing assignments
    db.query(AssignmentDB).filter(AssignmentDB.syllabus_id == syllabus_id).delete()
    
    # Add new assignments
    for assignment in syllabus_data.assignments:
        db_assignment = AssignmentDB(
            name=assignment.name,
            due_date=assignment.due_date,
            due_time=assignment.due_time,
            submission_link=assignment.submission_link,
            syllabus_id=syllabus_id
        )
        db.add(db_assignment)
    
    db.commit()
    db.refresh(db_syllabus)
    return db_syllabus


def delete_syllabus(db: Session, syllabus_id: int) -> bool:
    """Delete a syllabus and all its assignments."""
    db_syllabus = get_syllabus(db, syllabus_id)
    if not db_syllabus:
        return False
    
    db.delete(db_syllabus)
    db.commit()
    return True


def get_assignments_by_syllabus(db: Session, syllabus_id: int) -> List[AssignmentDB]:
    """Get all assignments for a specific syllabus."""
    return db.query(AssignmentDB).filter(AssignmentDB.syllabus_id == syllabus_id).all()


def get_assignments_by_due_date(db: Session, due_date: date) -> List[AssignmentDB]:
    """Get all assignments due on a specific date."""
    return db.query(AssignmentDB).filter(AssignmentDB.due_date == due_date).all()


def get_upcoming_assignments(db: Session, days_ahead: int = 7) -> List[AssignmentDB]:
    """Get assignments due within the next N days."""
    from datetime import date, timedelta
    end_date = date.today() + timedelta(days=days_ahead)
    return db.query(AssignmentDB).filter(
        AssignmentDB.due_date >= date.today(),
        AssignmentDB.due_date <= end_date
    ).order_by(AssignmentDB.due_date).all()


def db_syllabus_to_pydantic(db_syllabus: SyllabusDB) -> Syllabus:
    """Convert SQLAlchemy SyllabusDB to Pydantic Syllabus."""
    assignments = []
    for db_assignment in db_syllabus.assignments:
        assignment = Assignment(
            name=db_assignment.name,
            due_date=db_assignment.due_date,
            due_time=db_assignment.due_time,
            submission_link=db_assignment.submission_link
        )
        assignments.append(assignment)
    
    return Syllabus(
        id=db_syllabus.id,
        class_name=db_syllabus.class_name,
        course_code=db_syllabus.course_code,
        assignments=assignments
    )


def db_syllabus_to_assignment_data(db_syllabus: SyllabusDB) -> AssignmentData:
    """Convert SQLAlchemy SyllabusDB to Pydantic AssignmentData."""
    assignments = []
    for db_assignment in db_syllabus.assignments:
        assignment = Assignment(
            name=db_assignment.name,
            due_date=db_assignment.due_date,
            due_time=db_assignment.due_time,
            submission_link=db_assignment.submission_link
        )
        assignments.append(assignment)
    
    return AssignmentData(
        id=db_syllabus.id,
        class_name=db_syllabus.class_name,
        course_code=db_syllabus.course_code,
        assignments=assignments
    )


def search_assignments(db: Session, query: str) -> List[AssignmentDB]:
    """Search assignments by name or course code."""
    return db.query(AssignmentDB).join(SyllabusDB).filter(
        (AssignmentDB.name.ilike(f"%{query}%")) |
        (SyllabusDB.course_code.ilike(f"%{query}%")) |
        (SyllabusDB.class_name.ilike(f"%{query}%"))
    ).all()


# Convenience functions that handle database sessions
def create_syllabus_with_session(syllabus_data: Syllabus) -> SyllabusDB:
    """Create or update a syllabus with automatic session management."""
    with get_db_session() as db:
        return upsert_syllabus(db, syllabus_data)


def get_all_syllabi_with_session() -> List[SyllabusDB]:
    """Get all syllabi with automatic session management."""
    db = get_db_session()
    try:
        return get_all_syllabi(db)
    finally:
        db.close()


def get_syllabus_by_course_code_with_session(course_code: str) -> Optional[SyllabusDB]:
    """Get syllabus by course code with automatic session management."""
    db = get_db_session()
    try:
        return get_syllabus_by_course_code(db, course_code)
    finally:
        db.close()
