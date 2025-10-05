"""
Database initialization script.
Creates the database tables and ensures the data directory exists.
"""

import os
from pathlib import Path
from database import create_tables, engine

def init_database():
    """Initialize the database by creating tables and ensuring directory exists."""
    # Ensure data directory exists
    data_dir = Path("./data")
    data_dir.mkdir(exist_ok=True)
    
    # Create all tables
    create_tables()
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_database()
