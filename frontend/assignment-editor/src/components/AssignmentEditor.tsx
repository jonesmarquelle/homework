import React, { useState, useEffect, useRef } from 'react';
import { parse, format } from 'date-fns';
import type { Assignment, AssignmentData } from '../../../../shared/types';
import ConfirmationModal from './ConfirmationModal';
import { updateSyllabus } from '../services/api';

interface AssignmentEditorProps {
  data: AssignmentData;
  onViewKanban: () => void;
  syllabusId?: number;
  onDataChange?: (data: AssignmentData) => void;
}

interface EditableAssignment extends Assignment {
  id: string;
  dueDateTime: Date;
  isCollapsed: boolean;
}

const AssignmentEditor: React.FC<AssignmentEditorProps> = ({ data, onViewKanban, syllabusId, onDataChange }) => {
  
  const [assignments, setAssignments] = useState<EditableAssignment[]>([]);
  const [courseName, setCourseName] = useState(data.class_name);
  const [courseCode, setCourseCode] = useState(data.course_code);
  const [isEditingCourseName, setIsEditingCourseName] = useState(false);
  const [isEditingCourseCode, setIsEditingCourseCode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const originalDataRef = useRef<AssignmentData>(data);

  // Parse initial data and convert to editable format
  useEffect(() => {
    const parsedAssignments: EditableAssignment[] = data.assignments.map((assignment, index) => {
      // Combine date and time strings into a Date object
      const dateTimeString = `${assignment.due_date} ${assignment.due_time}`;
      const dueDateTime = parse(dateTimeString, 'yyyy-MM-dd h:mm a', new Date());
      
      return {
        ...assignment,
        id: `assignment-${index}`,
        dueDateTime,
        isCollapsed: false
      };
    });
    
    setAssignments(parsedAssignments);
    originalDataRef.current = data;
    setHasUnsavedChanges(false);
  }, [data]);

  // Check for changes whenever data changes
  useEffect(() => {
    const currentData = {
      id: data.id,
      class_name: courseName,
      course_code: courseCode,
      assignments: assignments.map(assignment => ({
        name: assignment.name,
        due_date: assignment.due_date,
        due_time: assignment.due_time,
        submission_link: assignment.submission_link
      }))
    };

    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(originalDataRef.current);
    setHasUnsavedChanges(hasChanges);
  }, [courseName, courseCode, assignments]);

  const handleAssignmentChange = (id: string, field: keyof Assignment, value: string) => {
    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === id) {
        if (field === 'due_date' || field === 'due_time') {
          // Update the combined DateTime when date or time changes
          const updatedAssignment = { ...assignment, [field]: value };
          const dateTimeString = `${updatedAssignment.due_date} ${updatedAssignment.due_time}`;
          const dueDateTime = parse(dateTimeString, 'yyyy-MM-dd h:mm a', new Date());
          return { ...updatedAssignment, dueDateTime };
        }
        return { ...assignment, [field]: value };
      }
      return assignment;
    }));
  };

  const toggleCollapse = (id: string) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === id 
        ? { ...assignment, isCollapsed: !assignment.isCollapsed }
        : assignment
    ));
  };


  const handleCourseNameClick = () => {
    setIsEditingCourseName(true);
  };

  const handleCourseCodeClick = () => {
    setIsEditingCourseCode(true);
  };

  const handleCourseNameBlur = () => {
    setIsEditingCourseName(false);
  };

  const handleCourseCodeBlur = () => {
    setIsEditingCourseCode(false);
  };

  const handleCourseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCourseName(e.target.value);
  };

  const handleCourseCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCourseCode(e.target.value);
  };

  const handleSave = async () => {
    if (!syllabusId) {
      alert('Save not available: No syllabus ID found. Please re-upload the PDF to enable saving.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = {
        id: data.id,
        class_name: courseName,
        course_code: courseCode,
        assignments: assignments.map(assignment => ({
          name: assignment.name,
          due_date: assignment.due_date,
          due_time: assignment.due_time,
          submission_link: assignment.submission_link
        }))
      };

      await updateSyllabus(syllabusId, updatedData);
      
      // Update the original data reference
      originalDataRef.current = updatedData;
      setHasUnsavedChanges(false);
      
      // Notify parent component of data change
      if (onDataChange) {
        onDataChange(updatedData);
      }
      
      // Close the modal if it's open
      if (showConfirmModal) {
        setShowConfirmModal(false);
        setPendingAction(null);
      }
      
      console.log('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActionWithConfirmation = (action: () => void) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
      setShowConfirmModal(true);
    } else {
      action();
    }
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      pendingAction();
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const handleViewKanbanBoard = () => {
    handleActionWithConfirmation(() => {
      onViewKanban();
    });
  };

  const handleExportToGoogleCalendar = () => {
    handleActionWithConfirmation(() => {
      console.log('Exporting to Google Calendar...');
    });
  };

  return (
    <div className="assignment-editor">
      <div className="header">
        {isEditingCourseName ? (
          <input
            type="text"
            value={courseName}
            onChange={handleCourseNameChange}
            onBlur={handleCourseNameBlur}
            className="class-name-input"
            autoFocus
          />
        ) : (
          <h1 className="class-name" onClick={handleCourseNameClick}>
            {courseName}
          </h1>
        )}
        {isEditingCourseCode ? (
          <input
            type="text"
            value={courseCode}
            onChange={handleCourseCodeChange}
            onBlur={handleCourseCodeBlur}
            className="course-code-input"
            autoFocus
          />
        ) : (
          <h2 className="course-code" onClick={handleCourseCodeClick}>
            {courseCode}
          </h2>
        )}
      </div>

      <div className="action-buttons">
        <button 
          className="action-btn export-btn" 
          onClick={handleExportToGoogleCalendar}
        >
          Export to Google Calendar
        </button>
        <button 
          className="action-btn kanban-btn" 
          onClick={handleViewKanbanBoard}
        >
          View on Kanban Board
        </button>
      </div>

      <div className="assignments-container">
        <h3>Assignments</h3>
        <div className="assignments-list">
          {assignments.map((assignment) => (
            <div key={assignment.id} className={`assignment-card ${assignment.isCollapsed ? 'collapsed' : ''}`}>
              <div className="assignment-header">
                <div className="assignment-title">
                  <input
                    type="text"
                    value={assignment.name}
                    onChange={(e) => handleAssignmentChange(assignment.id, 'name', e.target.value)}
                    className="assignment-title-input"
                    placeholder="Assignment name"
                  />
                </div>
                <button 
                  className="collapse-btn"
                  onClick={() => toggleCollapse(assignment.id)}
                  title={assignment.isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {assignment.isCollapsed ? '▶' : '▼'}
                </button>
              </div>
              
              {!assignment.isCollapsed && (
                <div className="assignment-content">
                  <div className="assignment-field">
                    <label>Due Date:</label>
                    <input
                      type="date"
                      value={assignment.due_date}
                      onChange={(e) => handleAssignmentChange(assignment.id, 'due_date', e.target.value)}
                      className="assignment-input"
                    />
                  </div>
                  
                  <div className="assignment-field">
                    <label>Due Time:</label>
                    <input
                      type="text"
                      value={assignment.due_time}
                      onChange={(e) => handleAssignmentChange(assignment.id, 'due_time', e.target.value)}
                      className="assignment-input"
                      placeholder="e.g., 11:59 PM"
                    />
                  </div>
                  
                  <div className="assignment-field">
                    <label>Submission Link:</label>
                    <input
                      type="url"
                      value={assignment.submission_link}
                      onChange={(e) => handleAssignmentChange(assignment.id, 'submission_link', e.target.value)}
                      className="assignment-input"
                    />
                  </div>
                  
                  <div className="assignment-info">
                    <small>Parsed DateTime: {format(assignment.dueDateTime, 'yyyy-MM-dd h:mm a')}</small>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
        onSave={handleSave}
        title="Unsaved Changes"
        message="You have unsaved changes. What would you like to do?"
        confirmText="Continue Without Saving"
        cancelText="Cancel"
        showSave={true}
        saveText="Save Changes"
        isSaving={isSaving}
      />
    </div>
  );
};

export default AssignmentEditor;
