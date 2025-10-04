# Docker Setup for Homework Management System

This document provides instructions for running the homework management system using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Google Gemini API key

## Quick Start

1. **Clone the repository and set up environment:**
   ```bash
   git clone <repository-url>
   cd homework
   cp env.example .env
   ```

2. **Edit the `.env` file with your Gemini API key:**
   ```bash
   # Edit .env file
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Build and run the services:**
   ```bash
   # Build and start all services
   docker-compose up --build
   
   # Or run in detached mode
   docker-compose up --build -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend: Available for PDF processing

## Services

### Backend Service
- **Container**: `homework-backend`
- **Purpose**: PDF syllabus extraction using Google Gemini API
- **Dependencies**: Python 3.12, uv package manager
- **Volumes**: 
  - `./shared` → `/app/shared` (read-only, for type definitions)
  - `./backend/examples` → `/app/examples` (read-only, for sample PDFs)
  - `./backend/output` → `/app/output` (for generated files)

### Frontend Service
- **Container**: `homework-frontend`
- **Purpose**: React assignment editor interface
- **Port**: 3001 (mapped to container port 80)
- **Dependencies**: Node.js 18, nginx

### Development Backend Service
- **Container**: `homework-backend-dev`
- **Purpose**: Development version with live code reloading
- **Profile**: `dev` (use `--profile dev` to include)

## Usage Examples

### Extract Syllabus from PDF
```bash
# Copy your PDF to the examples directory
cp your-syllabus.pdf backend/examples/

# Run the PDF analyzer
docker-compose exec backend uv run python -m src.pdf_analyzer examples/your-syllabus.pdf --output output/extracted.json
```

### Development Mode
```bash
# Run with development backend (includes live reloading)
docker-compose --profile dev up --build
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## File Structure in Containers

### Backend Container (`/app`)
```
/app/
├── src/                    # Backend source code
├── shared/                 # Shared type definitions (mounted)
├── examples/               # Sample PDF files (mounted)
├── output/                 # Generated files (mounted)
├── pyproject.toml          # Python dependencies
├── uv.lock                 # Lock file
└── main.py                 # Entry point
```

### Frontend Container (`/usr/share/nginx/html`)
```
/usr/share/nginx/html/
├── index.html              # Built React app
├── assets/                 # Static assets
└── ...                     # Other built files
```

## Troubleshooting

### Common Issues

1. **API Key Not Working:**
   - Ensure your `.env` file contains a valid `GEMINI_API_KEY`
   - Verify the API key has proper permissions

2. **Permission Issues:**
   - Ensure Docker has access to the project directory
   - Check file permissions on mounted volumes

3. **Port Conflicts:**
   - If port 3000 is in use, modify the port mapping in `docker-compose.yml`
   - Change `"3000:80"` to `"3001:80"` for example

4. **Build Failures:**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild without cache: `docker-compose build --no-cache`

### Useful Commands

```bash
# Rebuild specific service
docker-compose build backend

# Execute commands in running container
docker-compose exec backend bash
docker-compose exec frontend sh

# View container status
docker-compose ps

# Clean up everything
docker-compose down -v --rmi all
```

## Production Considerations

For production deployment:

1. **Security:**
   - Use Docker secrets for API keys
   - Implement proper network security
   - Use non-root users (already implemented)

2. **Performance:**
   - Use multi-stage builds (already implemented)
   - Optimize image sizes
   - Use production-ready base images

3. **Monitoring:**
   - Add health checks
   - Implement logging strategies
   - Set up monitoring and alerting

4. **Scaling:**
   - Configure load balancing
   - Use container orchestration (Kubernetes, Docker Swarm)
   - Implement horizontal scaling
