# Syllabus Analyzer FastAPI

This FastAPI application provides REST API endpoints for analyzing PDF syllabi and extracting assignment information using Google Gemini AI. The API supports full CRUD operations for syllabus management and integrates with a SQLite database.

## Running the Server

```bash
# Install dependencies
uv sync

# Run the server
python main.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### Health Check
- **GET** `/` - Root endpoint
  - **Response**: `{"message": "Syllabus Analyzer API is running"}`
- **GET** `/health` - Health check endpoint
  - **Response**: `{"status": "healthy", "service": "syllabus-analyzer"}`

### PDF Analysis
- **POST** `/analyze-pdf` - Upload and analyze a PDF syllabus
  - **Body**: `multipart/form-data` with PDF file
  - **Response**: `AnalysisResponse` with extracted syllabus data
  - **Validation**: File must be a PDF, GEMINI_API_KEY must be set

### Database Operations
- **POST** `/save-to-database` - Save syllabus data to database
  - **Body**: `Syllabus` JSON object
  - **Response**: `DatabaseResponse` with operation result

- **GET** `/syllabi` - Get all syllabi from database
  - **Response**: List of all syllabi with assignments
  - **Format**: `{"success": bool, "message": str, "data": [Syllabus]}`

- **PUT** `/syllabi/{syllabus_id}` - Update an existing syllabus
  - **Path Parameter**: `syllabus_id` (int) - ID of the syllabus to update
  - **Body**: `Syllabus` JSON object
  - **Response**: `DatabaseResponse` with operation result
  - **Error**: 404 if syllabus not found

- **DELETE** `/syllabi/{syllabus_id}` - Delete a syllabus from database
  - **Path Parameter**: `syllabus_id` (int) - ID of the syllabus to delete
  - **Response**: `DatabaseResponse` with operation result
  - **Error**: 404 if syllabus not found

### Combined Operations
- **POST** `/analyze-and-save` - Analyze PDF and save to database in one operation
  - **Body**: `multipart/form-data` with PDF file
  - **Response**: Combined analysis and database operation results
  - **Format**: `{"analysis": AnalysisResponse, "database": DatabaseResponse}`

## Response Models

### AnalysisResponse
```json
{
  "success": bool,
  "message": string,
  "data": Syllabus | null,
  "error": string | null
}
```

### DatabaseResponse
```json
{
  "success": bool,
  "message": string,
  "syllabus_id": int | null,
  "error": string | null
}
```

### Syllabus
```json
{
  "class_name": string,
  "course_code": string,
  "assignments": [
    {
      "name": string,
      "due_date": "YYYY-MM-DD",
      "due_time": string,
      "submission_link": string
    }
  ]
}
```

### SyllabiListResponse
```json
{
  "success": bool,
  "message": string,
  "data": [Syllabus]
}
```

## Error Handling

The API uses standard HTTP status codes:
- **200**: Success
- **400**: Bad Request (e.g., invalid file type)
- **404**: Not Found (e.g., syllabus ID not found)
- **500**: Internal Server Error (e.g., missing API key, database error)

Error responses include detailed error messages in the response body.

## Environment Variables

Make sure to set the following environment variable:
- `GEMINI_API_KEY` - Your Google Gemini API key

## Database

The API uses SQLite database with the following tables:
- `syllabi` - Stores syllabus information
- `assignments` - Stores assignment details linked to syllabi

Database tables are automatically created on first use.

## CORS

The API includes CORS middleware configured to allow all origins for development. Configure this properly for production use.

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## Example Usage

### Upload and Analyze a PDF
```bash
curl -X POST "http://localhost:8000/analyze-pdf" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@syllabus.pdf"
```

### Get All Syllabi
```bash
curl -X GET "http://localhost:8000/syllabi" \
  -H "accept: application/json"
```

### Update a Syllabus
```bash
curl -X PUT "http://localhost:8000/syllabi/1" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "class_name": "Advanced Computer Science",
    "course_code": "CS 401",
    "assignments": [...]
  }'
```

### Delete a Syllabus
```bash
curl -X DELETE "http://localhost:8000/syllabi/1" \
  -H "accept: application/json"
```
