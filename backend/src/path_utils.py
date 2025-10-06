#!/usr/bin/env python3
"""
Path utilities for setting up Python module paths.
Handles shared directory path detection for both development and Docker environments.
"""

import sys
from pathlib import Path


def setup_shared_paths():
    """
    Set up Python module paths for shared directory access.
    
    This function detects whether the code is running in a development environment
    or Docker container and adds the appropriate shared directory path to sys.path.
    It also adds the current src directory to the path.
    """
    # Detect environment and use appropriate path
    shared_dev_path = Path(__file__).parent.parent.parent / "shared"
    shared_docker_path = Path(__file__).parent.parent / "shared"
    
    # Check if we're running in development (shared folder exists 3 levels up)
    # or in Docker (shared folder exists 2 levels up)
    if shared_dev_path.exists():
        # Development environment - shared folder is 3 levels up
        sys.path.insert(0, str(shared_dev_path))
    elif shared_docker_path.exists():
        # Docker environment - shared folder is 2 levels up
        sys.path.insert(0, str(shared_docker_path))
    else:
        # Fallback - try both paths
        sys.path.insert(0, str(shared_dev_path))
        sys.path.insert(0, str(shared_docker_path))