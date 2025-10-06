# Use Python 3.12 slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

# Copy pyproject.toml and uv.lock for dependency installation
COPY backend/pyproject.toml backend/uv.lock ./

# Install Python dependencies
RUN uv sync --frozen

# Copy shared types directory
COPY shared /app/shared

# Copy backend source code
COPY backend/src/ ./src/
COPY backend/main.py ./

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Create a non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Expose port for FastAPI server
EXPOSE 8000

# Default command
CMD ["uv", "run", "main.py"]
