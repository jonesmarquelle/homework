import React, { useState, useCallback, useEffect } from 'react';
import AssignmentEditor from './components/AssignmentEditor';
import KanbanView from './components/KanbanView';
import ConfirmationModal from './components/ConfirmationModal';
import type { AssignmentData } from '../../../shared/types';
import { analyzeAndSave, getAllSyllabi, deleteSyllabus } from './services/api';
import './App.css';

function App() {
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [syllabusId, setSyllabusId] = useState<number | null>(null);
  const [savedSyllabi, setSavedSyllabi] = useState<any[]>([]);
  const [isLoadingSyllabi, setIsLoadingSyllabi] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'editor' | 'kanban'>('editor');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [syllabusToDelete, setSyllabusToDelete] = useState<any>(null);

  // Fetch saved syllabi on component mount
  useEffect(() => {
    fetchSyllabi();
  }, []);

  const fetchSyllabi = useCallback(async () => {
    setIsLoadingSyllabi(true);
    try {
      const response = await getAllSyllabi();
      if (response.success && response.data) {
        setSavedSyllabi(response.data);
      }
    } catch (error) {
      console.error('Error fetching syllabi:', error);
    } finally {
      setIsLoadingSyllabi(false);
    }
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file (.pdf)');
      return;
    }

    setUploadedFile(file);
    setIsUploaded(true);
    setError(null);
  }, []);

  const handleAnalyzeFile = useCallback(async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeAndSave(uploadedFile);
      
      if (result.analysis.success && result.analysis.data) {
        // Convert the backend data format to frontend format
        const convertedData: AssignmentData = {
          id: result.database.syllabus_id || 0, // Use syllabus_id from database response
          class_name: result.analysis.data.class_name,
          course_code: result.analysis.data.course_code,
          assignments: result.analysis.data.assignments.map(assignment => ({
            name: assignment.name,
            due_date: assignment.due_date,
            due_time: assignment.due_time,
            submission_link: assignment.submission_link
          }))
        };
        
        setAssignmentData(convertedData);
        setSyllabusId(result.database.syllabus_id || null);
        setIsUploaded(false);
        setUploadedFile(null);
      } else {
        setError(result.analysis.error || 'Failed to analyze PDF');
      }
    } catch (err) {
      setError(`Error analyzing PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadedFile]);

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
    setSyllabusId(null);
    setError(null);
    setView('editor');
    setUploadedFile(null);
    setIsUploaded(false);
    setIsAnalyzing(false);
    fetchSyllabi(); // Refresh the syllabi list
  };

  const handleDataChange = (newData: AssignmentData) => {
    setAssignmentData(newData);
  };

  const handleViewKanban = () => {
    setView('kanban');
  };

  const handleBackToEditor = () => {
    setView('editor');
  };

  const handleEditSyllabus = (syllabus: any) => {
    // Convert backend syllabus format to frontend format
    const convertedData: AssignmentData = {
      id: syllabus.id,
      class_name: syllabus.class_name,
      course_code: syllabus.course_code,
      assignments: syllabus.assignments.map((assignment: any) => ({
        name: assignment.name,
        due_date: assignment.due_date,
        due_time: assignment.due_time,
        submission_link: assignment.submission_link
      }))
    };
    
    setAssignmentData(convertedData);
    setSyllabusId(syllabus.id);
    setView('editor');
  };

  const handleViewSyllabusKanban = (syllabus: any) => {
    // Convert backend syllabus format to frontend format
    const convertedData: AssignmentData = {
      id: syllabus.id,
      class_name: syllabus.class_name,
      course_code: syllabus.course_code,
      assignments: syllabus.assignments.map((assignment: any) => ({
        name: assignment.name,
        due_date: assignment.due_date,
        due_time: assignment.due_time,
        submission_link: assignment.submission_link
      }))
    };
    
    setAssignmentData(convertedData);
    setSyllabusId(syllabus.id);
    setView('kanban');
  };

  const handleDeleteClick = (syllabus: any) => {
    setSyllabusToDelete(syllabus);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!syllabusToDelete) return;

    if (!syllabusToDelete.id) {
      setError('Cannot delete syllabus: No ID found');
      setDeleteModalOpen(false);
      setSyllabusToDelete(null);
      return;
    }

    try {
      const result = await deleteSyllabus(syllabusToDelete.id);
      if (result.success) {
        // Remove the deleted syllabus from the local state
        setSavedSyllabi(prev => prev.filter(s => s.id !== syllabusToDelete.id));
        setDeleteModalOpen(false);
        setSyllabusToDelete(null);
      } else {
        setError(result.error || 'Failed to delete syllabus');
      }
    } catch (err) {
      setError(`Error deleting syllabus: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSyllabusToDelete(null);
  };

  return (
    <div 
      className={`App ${isDragOver ? 'drag-over' : ''} ${view === 'kanban' ? 'kanban-mode' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {!assignmentData && !isUploaded && (
        <div className="main-upload-screen">
          <div className="file-drop-zone">
            <div className="drop-zone-content">
              <div className="drop-zone-icon">📄</div>
              <h3>Drag & Drop PDF Syllabus Here</h3>
              <p>Or click to browse files</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="file-input"
                id="file-input"
              />
              <label htmlFor="file-input" className="file-input-label">
                Choose PDF File
              </label>
            </div>
          </div>
          
          {savedSyllabi.length > 0 && (
            <div className="saved-syllabi-section">
              <h3>Saved Syllabi</h3>
              <div className="syllabi-list">
                {isLoadingSyllabi ? (
                  <div className="loading-syllabi">Loading saved syllabi...</div>
                ) : (
                  savedSyllabi.map((syllabus) => (
                    <div key={syllabus.id} className="syllabus-item">
                      <div className="syllabus-info">
                        <h4 className="syllabus-title" title={syllabus.class_name}>
                          {syllabus.class_name}
                        </h4>
                        <p className="syllabus-code">{syllabus.course_code}</p>
                        <p className="syllabus-assignments">
                          {syllabus.assignments.length} assignment{syllabus.assignments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="syllabus-actions">
                        <button 
                          className="syllabus-btn edit-btn"
                          onClick={() => handleEditSyllabus(syllabus)}
                        >
                          Edit
                        </button>
                        <button 
                          className="syllabus-btn view-btn"
                          onClick={() => handleViewSyllabusKanban(syllabus)}
                        >
                          View Kanban
                        </button>
                        <button 
                          className="syllabus-delete-btn"
                          onClick={() => handleDeleteClick(syllabus)}
                          title="Delete syllabus"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isUploaded && !assignmentData && (
        <div className="upload-success">
          <div className="upload-success-content">
            <div className="success-icon">✅</div>
            <h3>PDF Uploaded Successfully!</h3>
            <p>File: {uploadedFile?.name}</p>
            <button 
              className="analyze-btn" 
              onClick={handleAnalyzeFile}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Start AI Analysis'}
            </button>
            <button 
              className="reset-btn" 
              onClick={handleReset}
              disabled={isAnalyzing}
            >
              Upload Different File
            </button>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="analyzing-overlay">
          <div className="analyzing-content">
            <div className="loading-spinner"></div>
            <h3>Analyzing PDF with AI...</h3>
            <p>This may take a few moments</p>
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
          {view === 'editor' ? (
            <>
              <div className="reset-section">
                <button className="reset-btn" onClick={handleReset}>
                  Upload Different File
                </button>
                <p className="drag-hint">Or drag a new PDF file anywhere on this page</p>
              </div>
              <AssignmentEditor 
                data={assignmentData} 
                onViewKanban={handleViewKanban} 
                syllabusId={syllabusId || undefined}
                onDataChange={handleDataChange}
              />
            </>
          ) : (
            <KanbanView data={assignmentData} onBack={handleBackToEditor} />
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Syllabus"
        message={`Are you sure you want to delete "${syllabusToDelete?.class_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default App;