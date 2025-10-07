/**
 * API service for communicating with the backend syllabus analyzer.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://backend:8000');

export interface AnalysisResponse {
  success: boolean;
  message: string;
  data?: {
    class_name: string;
    course_code: string;
    assignments: Array<{
      id: number;
      name: string;
      due_date: string;
      due_time: string;
      submission_link: string;
      status: string;
    }>;
  };
  error?: string;
}

export interface DatabaseResponse {
  success: boolean;
  message: string;
  syllabus_id?: number;
  error?: string;
}

export interface CombinedResponse {
  analysis: AnalysisResponse;
  database: DatabaseResponse;
}

/**
 * Upload and analyze a PDF file
 */
export async function analyzePdf(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze-pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Save syllabus data to database
 */
export async function saveToDatabase(syllabusData: any): Promise<DatabaseResponse> {
  const response = await fetch(`${API_BASE_URL}/save-to-database`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(syllabusData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Analyze PDF and save to database in one operation
 */
export async function analyzeAndSave(file: File): Promise<CombinedResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze-and-save`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all syllabi from the database
 */
export async function getAllSyllabi(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/syllabi`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Update existing syllabus data in database
 */
export async function updateSyllabus(syllabusId: number, syllabusData: any): Promise<DatabaseResponse> {
  const response = await fetch(`${API_BASE_URL}/syllabi/${syllabusId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(syllabusData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a syllabus from the database
 */
export async function deleteSyllabus(syllabusId: number): Promise<DatabaseResponse> {
  const response = await fetch(`${API_BASE_URL}/syllabi/${syllabusId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(assignmentId: number, status: string): Promise<DatabaseResponse> {
  const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(status),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if the API is healthy
 */
export async function healthCheck(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
