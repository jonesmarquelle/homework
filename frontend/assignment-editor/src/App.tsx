import React, { useState, useCallback } from 'react';
import AssignmentEditor from './components/AssignmentEditor';
import { AssignmentData } from '../../../../shared/types';
import './App.css';

function App() {
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAssignmentData = (data: any): data is AssignmentData => {
    return (
      data &&
      typeof data.class_name === 'string' &&
      typeof data.course_code === 'string' &&
      Array.isArray(data.assignments) &&
      data.assignments.every((assignment: any) =>
        typeof assignment.name === 'string' &&
        typeof assignment.due_date === 'string' &&
        typeof assignment.due_time === 'string' &&
        typeof assignment.submission_link === 'string'
      )
    );
  };

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please upload a JSON file (.json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        if (validateAssignmentData(parsedData)) {
          setAssignmentData(parsedData);
          setError(null);
        } else {
          setError('Invalid JSON structure. Please ensure the file contains class_name, course_code, and assignments array.');
        }
      } catch (err) {
        setError('Invalid JSON file. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleReset = () => {
    setAssignmentData(null);
    setError(null);
  };

  return (
    <div 
      className={`App ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!assignmentData && (
        <div className="file-drop-zone">
          <div className="drop-zone-content">
            <div className="drop-zone-icon">📁</div>
            <h3>Drag & Drop JSON File Here</h3>
            <p>Or click to browse files</p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileInputChange}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              Choose File
            </label>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {assignmentData && (
        <div className="editor-container">
          <div className="reset-section">
            <button className="reset-btn" onClick={handleReset}>
              Upload Different File
            </button>
            <p className="drag-hint">Or drag a new JSON file anywhere on this page</p>
          </div>
          <AssignmentEditor data={assignmentData} />
        </div>
      )}
    </div>
  );
}

export default App;