import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { parse, format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import type { AssignmentData, Assignment, AssignmentStatus } from '../../../../shared/types';
import { updateAssignmentStatus, getAllSyllabi } from '../services/api';

interface KanbanViewProps {
  data: AssignmentData | AssignmentData[];
  onBack: () => void;
  isUnified?: boolean;
  onDataRefresh?: (freshData: AssignmentData | AssignmentData[]) => void;
}

interface AssignmentWithId extends Assignment {
  dueDateTime: Date;
  courseCode: string;
  class_name?: string;
  syllabus_id?: number;
}

interface WeeklyBoard {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  title: string;
  assignments: AssignmentWithId[];
}

interface AllAssignmentsBoard {
  id: 'all-assignments';
  title: string;
  assignments: AssignmentWithId[];
}

interface Column {
  id: string;
  title: string;
  assignments: AssignmentWithId[];
}

// Generate consistent colors for course codes
const generateCourseColor = (courseCode: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Draggable Assignment Card Component
const AssignmentCard: React.FC<{
  assignment: AssignmentWithId;
  courseColor: string;
  onDelete: (assignmentId: string) => void;
  isUnified?: boolean;
}> = ({ assignment, courseColor, onDelete, isUnified = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag when clicking delete
    
    if (window.confirm(`Are you sure you want to delete "${assignment.name}"?`)) {
      onDelete(assignment.id.toString());
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`assignment-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="assignment-card-content">
        <div className="assignment-header">
          <h4 className="assignment-name">{assignment.name}</h4>
          <button 
            className="delete-btn"
            onClick={handleDelete}
            title="Delete assignment"
          >
            ×
          </button>
        </div>
        <div className="assignment-due-date">
          Due: {isNaN(assignment.dueDateTime.getTime()) 
            ? 'Invalid Date' 
            : format(assignment.dueDateTime, 'MMM dd, yyyy h:mm a')
          }
        </div>
        {isUnified && assignment.class_name && (
          <div className="assignment-class-name" title={assignment.class_name}>
            {assignment.class_name}
          </div>
        )}
        <div 
          className="course-tag"
          style={{ backgroundColor: courseColor }}
        >
          {assignment.courseCode}
        </div>
      </div>
    </div>
  );
};

// Column Component
const Column: React.FC<{
  column: Column;
  assignments: AssignmentWithId[];
  courseColors: Record<string, string>;
  onDeleteAssignment: (assignmentId: string) => void;
  isUnified?: boolean;
}> = ({ column, assignments, courseColors, onDeleteAssignment, isUnified = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
      data-column-id={column.id}
    >
      <div className="column-header">
        <h3>{column.title}</h3>
        <span className="assignment-count">{assignments.length}</span>
      </div>
      <SortableContext items={assignments.map(a => a.id)} strategy={verticalListSortingStrategy}>
        <div className="column-content">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              courseColor={courseColors[assignment.courseCode]}
              onDelete={onDeleteAssignment}
              isUnified={isUnified}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

// Weekly Board Component
const WeeklyBoard: React.FC<{
  board: WeeklyBoard;
  courseColors: Record<string, string>;
  onAssignmentMove: (assignmentId: number, newColumn: string, weekNumber: number) => void;
  onDeleteAssignment: (assignmentId: string, weekNumber: number) => void;
  onRefreshData: () => Promise<void>;
  isUnified?: boolean;
}> = ({ board, courseColors, onAssignmentMove, onDeleteAssignment, onRefreshData, isUnified = false }) => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'not-started', title: 'Not Started', assignments: [] },
    { id: 'in-progress', title: 'In Progress', assignments: [] },
    { id: 'done', title: 'Done', assignments: [] },
  ]);

  // Reset columns when board changes - distribute assignments based on their status
  useEffect(() => {
    console.log(`Resetting columns for week ${board.weekNumber} with ${board.assignments.length} assignments`);
    
    const notStarted: AssignmentWithId[] = [];
    const inProgress: AssignmentWithId[] = [];
    const done: AssignmentWithId[] = [];

    board.assignments.forEach(assignment => {
      switch (assignment.status) {
        case 'NOT_STARTED':
          notStarted.push(assignment);
          break;
        case 'IN_PROGRESS':
          inProgress.push(assignment);
          break;
        case 'DONE':
          done.push(assignment);
          break;
      }
    });

    setColumns([
      { id: 'not-started', title: 'Not Started', assignments: notStarted },
      { id: 'in-progress', title: 'In Progress', assignments: inProgress },
      { id: 'done', title: 'Done', assignments: done },
    ]);
  }, [board.weekNumber, board.assignments]);

  const handleDeleteAssignment = (assignmentId: string) => {
    // Remove from all columns
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        assignments: column.assignments.filter(a => a.id.toString() !== assignmentId)
      }))
    );
    
    // Notify parent component
    onDeleteAssignment(assignmentId, board.weekNumber);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag end:', { active: active.id, over: over?.id });
    
    if (!over) {
      console.log('No drop target - returning to original position');
      return;
    }
    
    const assignmentId = active.id as number;
    const newColumnId = over.id as string;
    
    // Check if the drop target is a valid column
    const validColumns = ['not-started', 'in-progress', 'done'];
    if (!validColumns.includes(newColumnId)) {
      console.log('Invalid drop target - returning to original position');
      return;
    }
    
    console.log('Moving assignment:', assignmentId, 'to column:', newColumnId);
    
    // Map column IDs to status values
    const statusMap: Record<string, AssignmentStatus> = {
      'not-started': 'NOT_STARTED',
      'in-progress': 'IN_PROGRESS',
      'done': 'DONE'
    };

    const newStatus = statusMap[newColumnId];
    if (!newStatus) return;

    // Find the assignment in the current columns
    let assignment: AssignmentWithId | undefined;
    
    for (const column of columns) {
      assignment = column.assignments.find(a => a.id === assignmentId);
      if (assignment) break;
    }
    
    if (!assignment) {
      console.log('Assignment not found:', assignmentId);
      console.log('Available assignments:', columns.flatMap(c => c.assignments.map(a => a.id)));
      return;
    }
    
    try {
      // Update status in database first
      await updateAssignmentStatus(assignmentId, newStatus);
      
      // Refresh data to get the latest status from database
      await onRefreshData();
      
      onAssignmentMove(assignmentId, newColumnId, board.weekNumber);
    } catch (error) {
      console.error('Failed to update assignment status:', error);
      // Optionally show user feedback
    }
  };

  return (
    <div className="weekly-board">
      <div className="board-header">
        <h2>{board.title}</h2>
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              assignments={column.assignments}
              courseColors={courseColors}
              onDeleteAssignment={handleDeleteAssignment}
              isUnified={isUnified}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

// All Assignments Board Component
const AllAssignmentsBoard: React.FC<{
  board: AllAssignmentsBoard;
  courseColors: Record<string, string>;
  onAssignmentMove: (assignmentId: string, newColumn: string) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onRefreshData: () => Promise<void>;
  isUnified?: boolean;
}> = ({ board, courseColors, onAssignmentMove, onDeleteAssignment, onRefreshData, isUnified = false }) => {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'not-started', title: 'Not Started', assignments: board.assignments },
    { id: 'in-progress', title: 'In Progress', assignments: [] },
    { id: 'done', title: 'Done', assignments: [] },
  ]);

  // Update columns based on assignment statuses from database
  useEffect(() => {
    const notStarted: AssignmentWithId[] = [];
    const inProgress: AssignmentWithId[] = [];
    const done: AssignmentWithId[] = [];

    board.assignments.forEach(assignment => {
      switch (assignment.status) {
        case 'NOT_STARTED':
          notStarted.push(assignment);
          break;
        case 'IN_PROGRESS':
          inProgress.push(assignment);
          break;
        case 'DONE':
          done.push(assignment);
          break;
      }
    });

    setColumns([
      { id: 'not-started', title: 'Not Started', assignments: notStarted },
      { id: 'in-progress', title: 'In Progress', assignments: inProgress },
      { id: 'done', title: 'Done', assignments: done },
    ]);
  }, [board.assignments]);

  const handleDeleteAssignment = (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      onDeleteAssignment(assignmentId);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const assignmentId = active.id as number;
    const newColumnId = over.id as string;

    const validColumns = ['not-started', 'in-progress', 'done'];
    if (!validColumns.includes(newColumnId)) return;

    // Map column IDs to status values
    const statusMap: Record<string, AssignmentStatus> = {
      'not-started': 'NOT_STARTED',
      'in-progress': 'IN_PROGRESS',
      'done': 'DONE'
    };

    const newStatus = statusMap[newColumnId];
    if (!newStatus) return;

    try {
      // Update status in database
      await updateAssignmentStatus(assignmentId, newStatus);
      
      // Refresh data to get the latest status from database
      await onRefreshData();
      
      // Update local state
      onAssignmentMove(assignmentId.toString(), newColumnId);
    } catch (error) {
      console.error('Failed to update assignment status:', error);
      // Optionally show user feedback
    }
  };

  return (
    <div className="weekly-board">
      <div className="board-header">
        <h2>{board.title}</h2>
        <div className="board-stats">
          <span>{board.assignments.length} total assignments</span>
        </div>
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              assignments={column.assignments}
              courseColors={courseColors}
              onDeleteAssignment={handleDeleteAssignment}
              isUnified={isUnified}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

const KanbanView: React.FC<KanbanViewProps> = ({ data, onBack, isUnified = false, onDataRefresh }) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedBoardType, setSelectedBoardType] = useState<'weekly' | 'all-assignments'>('weekly');
  const [freshData, setFreshData] = useState<AssignmentData | AssignmentData[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh data from the database
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await getAllSyllabi();
      if (response.success && response.data) {
        const freshSyllabi = response.data;
        
        if (isUnified) {
          // For unified view, use all syllabi
          setFreshData(freshSyllabi);
          if (onDataRefresh) {
            onDataRefresh(freshSyllabi);
          }
        } else {
          // For single syllabus view, find the matching syllabus
          const currentSyllabusId = Array.isArray(data) ? data[0]?.id : data.id;
          const matchingSyllabus = freshSyllabi.find((s: any) => s.id === currentSyllabusId);
          if (matchingSyllabus) {
            setFreshData(matchingSyllabus);
            if (onDataRefresh) {
              onDataRefresh(matchingSyllabus);
            }
          } else {
            // Fallback to original data if not found
            setFreshData(data);
          }
        }
      } else {
        // Fallback to original data if fetch fails
        setFreshData(data);
      }
    } catch (error) {
      console.error('Failed to fetch fresh data:', error);
      // Fallback to original data if fetch fails
      setFreshData(data);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Refresh data when component mounts
  useEffect(() => {
    refreshData();
  }, [data, isUnified, onDataRefresh]);

  // Use fresh data if available, otherwise fall back to original data
  const currentData = freshData || data;

  // Process assignments and group by weeks
  const weeklyBoards = useMemo(() => {
    // Handle both single data and array of data
    const allAssignments = Array.isArray(currentData) 
      ? currentData.flatMap(syllabus => 
          syllabus.assignments.map(assignment => ({
            ...assignment,
            courseCode: syllabus.course_code,
            class_name: syllabus.class_name,
            syllabus_id: syllabus.id
          }))
        )
      : currentData.assignments.map(assignment => ({
          ...assignment,
          courseCode: currentData.course_code,
          class_name: currentData.class_name,
          syllabus_id: currentData.id
        }));

    const assignmentsWithId: AssignmentWithId[] = allAssignments.map((assignment) => {
      const dateTimeString = `${assignment.due_date} ${assignment.due_time}`;
      let dueDateTime: Date;
      
      try {
        dueDateTime = parse(dateTimeString, 'yyyy-MM-dd h:mm a', new Date());
        // Check if the parsed date is valid
        if (isNaN(dueDateTime.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.warn(`Failed to parse date for assignment "${assignment.name}": ${dateTimeString}`);
        // Fallback to a default date
        dueDateTime = new Date();
      }
      
      return {
        ...assignment,
        // Use database ID from assignment.id
        dueDateTime,
        courseCode: assignment.courseCode,
      };
    });

    // Sort assignments by due date
    assignmentsWithId.sort((a, b) => a.dueDateTime.getTime() - b.dueDateTime.getTime());

    // Find the overall date range
    if (assignmentsWithId.length === 0) return [];

    const earliestDate = assignmentsWithId[0].dueDateTime;
    const latestDate = assignmentsWithId[assignmentsWithId.length - 1].dueDateTime;

    // Generate weekly boards
    const boards: WeeklyBoard[] = [];
    let weekNumber = 1;
    let currentWeekStart = startOfWeek(earliestDate, { weekStartsOn: 1 }); // Start on Monday

    while (currentWeekStart <= latestDate) {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      
      // Find assignments that fall within this week
      const weekAssignments = assignmentsWithId.filter(assignment =>
        isWithinInterval(assignment.dueDateTime, {
          start: currentWeekStart,
          end: weekEnd,
        })
      );

      // Only create a board if there are assignments in this week
      if (weekAssignments.length > 0) {
        boards.push({
          weekNumber,
          startDate: currentWeekStart,
          endDate: weekEnd,
          title: `Week ${weekNumber} [${format(currentWeekStart, 'MM/dd')} - ${format(weekEnd, 'MM/dd')}]`,
          assignments: weekAssignments,
        });
        weekNumber++;
      }

      // Move to next week
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return boards;
  }, [currentData]);

  // Create all assignments board
  const allAssignmentsBoard = useMemo(() => {
    // Handle both single data and array of data
    const allAssignments = Array.isArray(currentData) 
      ? currentData.flatMap(syllabus => 
          syllabus.assignments.map(assignment => ({
            ...assignment,
            courseCode: syllabus.course_code,
            class_name: syllabus.class_name,
            syllabus_id: syllabus.id
          }))
        )
      : currentData.assignments.map(assignment => ({
          ...assignment,
          courseCode: currentData.course_code,
          class_name: currentData.class_name,
          syllabus_id: currentData.id
        }));

    const assignmentsWithId: AssignmentWithId[] = allAssignments.map((assignment) => {
      const dateTimeString = `${assignment.due_date} ${assignment.due_time}`;
      let dueDateTime: Date;
      
      try {
        dueDateTime = parse(dateTimeString, 'yyyy-MM-dd h:mm a', new Date());
        // Check if the parsed date is valid
        if (isNaN(dueDateTime.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        console.warn(`Failed to parse date for assignment "${assignment.name}": ${dateTimeString}`);
        // Fallback to a default date
        dueDateTime = new Date();
      }
      
      return {
        ...assignment,
        // Use database ID from assignment.id
        dueDateTime,
        courseCode: assignment.courseCode,
      };
    });

    return {
      id: 'all-assignments' as const,
      title: isUnified ? 'All Assignments (Unified View)' : 'All Assignments',
      assignments: assignmentsWithId,
    };
  }, [currentData, isUnified]);

  // Generate course colors
  const courseColors = useMemo(() => {
    const colors: Record<string, string> = {};
    const uniqueCourseCodes = [...new Set(weeklyBoards.flatMap(board => 
      board.assignments.map(a => a.courseCode)
    ))];
    
    uniqueCourseCodes.forEach(courseCode => {
      colors[courseCode] = generateCourseColor(courseCode);
    });
    
    return colors;
  }, [weeklyBoards]);

  // Auto-select the current week or first week when boards are loaded
  useEffect(() => {
    if (weeklyBoards.length > 0 && selectedWeek === null && selectedBoardType === 'weekly') {
      const today = new Date();
      
      // Find the week that contains today's date
      const currentWeek = weeklyBoards.find(board => 
        isWithinInterval(today, {
          start: board.startDate,
          end: board.endDate,
        })
      );
      
      if (currentWeek) {
        setSelectedWeek(currentWeek.weekNumber);
      } else {
        // If today is not in any week, select the first week
        setSelectedWeek(weeklyBoards[0].weekNumber);
      }
    }
  }, [weeklyBoards, selectedWeek, selectedBoardType]);

  const handleAssignmentMove = (assignmentId: number, newColumn: string, weekNumber: number) => {
    // Status updates are now handled in the drag end handler
    console.log(`Assignment ${assignmentId} moved to ${newColumn} in week ${weekNumber}`);
  };

  const handleDeleteAssignment = (assignmentId: string, weekNumber: number) => {
    console.log(`Assignment ${assignmentId} deleted from week ${weekNumber}`);
    // This could be used to persist changes or sync with parent component
    // For now, the assignment is removed from the local state in the WeeklyBoard component
  };

  const handleAllAssignmentsMove = async (assignmentId: string, newColumn: string) => {
    // Map column IDs to status values
    const statusMap: Record<string, AssignmentStatus> = {
      'not-started': 'NOT_STARTED',
      'in-progress': 'IN_PROGRESS',
      'done': 'DONE'
    };

    const newStatus = statusMap[newColumn];
    if (!newStatus) return;

    try {
      // Update status in database
      await updateAssignmentStatus(parseInt(assignmentId), newStatus);
      
      // Refresh data to get the latest status from database
      await refreshData();
    } catch (error) {
      console.error('Failed to update assignment status:', error);
    }
  };

  const handleAllAssignmentsDelete = (assignmentId: string) => {
    // Status tracking is no longer needed as it's handled by the database
    console.log(`Assignment ${assignmentId} deleted`);
  };


  const selectedBoard = weeklyBoards.find(board => board.weekNumber === selectedWeek);

  // Function to check if a week contains the current date
  const isCurrentWeek = (board: WeeklyBoard): boolean => {
    const today = new Date();
    return isWithinInterval(today, {
      start: board.startDate,
      end: board.endDate,
    });
  };

  return (
    <div className="kanban-view">
      <div className="kanban-header">
        <button className="back-button" onClick={onBack}>
          ← {isUnified ? 'Back to Home' : 'Back to Editor'}
        </button>
        <h1>
          {isUnified 
            ? 'Unified Kanban Board - All Courses' 
            : `Kanban Board - ${Array.isArray(currentData) ? 'Multiple Courses' : currentData.class_name}`
          }
        </h1>
        <div className="course-info">
          {isUnified ? (
            <span className="course-code">
              {Array.isArray(currentData) ? `${currentData.length} course${currentData.length !== 1 ? 's' : ''}` : '1 course'}
            </span>
          ) : (
            <span className="course-code">
              {Array.isArray(currentData) ? 'Multiple Courses' : currentData.course_code}
            </span>
          )}
        </div>
        </div>

        {isRefreshing && (
          <div className="refreshing-indicator">
            <div className="loading-spinner"></div>
            <span>Refreshing assignment data...</span>
          </div>
        )}

        <div className="kanban-layout">
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>Boards</h3>
          </div>
          <div className="sidebar-content">
            <div className="board-list">
              {/* All Assignments Board */}
              <button
                className={`week-item ${selectedBoardType === 'all-assignments' ? 'active' : ''}`}
                onClick={() => {
                  console.log('Switching to All Assignments board');
                  setSelectedBoardType('all-assignments');
                }}
              >
                <div className="week-title">📋 All Assignments</div>
                <div className="week-assignment-count">
                  {allAssignmentsBoard.assignments.length} assignment{allAssignmentsBoard.assignments.length !== 1 ? 's' : ''}
                </div>
              </button>

              {/* Weekly Boards */}
              {weeklyBoards.length === 0 ? (
                <div className="no-boards">
                  <p>No weekly boards available</p>
                </div>
              ) : (
                <div className="week-list">
                  {weeklyBoards.map((board) => (
                    <button
                      key={board.weekNumber}
                      className={`week-item ${selectedBoardType === 'weekly' && selectedWeek === board.weekNumber ? 'active' : ''} ${isCurrentWeek(board) ? 'current-week' : ''}`}
                      onClick={() => {
                        console.log(`Switching to week ${board.weekNumber}: ${board.title}`);
                        setSelectedBoardType('weekly');
                        setSelectedWeek(board.weekNumber);
                      }}
                    >
                      <div className="week-title">{board.title}</div>
                      <div className="week-assignment-count">
                        {board.assignments.length} assignment{board.assignments.length !== 1 ? 's' : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="main-content">
          {selectedBoardType === 'all-assignments' ? (
            <div className="selected-board-container">
              <div className="board-info">
                <h2>Currently Viewing: {allAssignmentsBoard.title}</h2>
                <p>{allAssignmentsBoard.assignments.length} total assignments across all courses</p>
              </div>
              <AllAssignmentsBoard
                key="all-assignments"
                board={allAssignmentsBoard}
                courseColors={courseColors}
                onAssignmentMove={handleAllAssignmentsMove}
                onDeleteAssignment={handleAllAssignmentsDelete}
                onRefreshData={refreshData}
                isUnified={isUnified}
              />
            </div>
          ) : selectedBoard ? (
            <div className="selected-board-container">
              <div className="board-info">
                <h2>Currently Viewing: {selectedBoard.title}</h2>
                <p>{selectedBoard.assignments.length} assignment{selectedBoard.assignments.length !== 1 ? 's' : ''} due this week</p>
              </div>
              <WeeklyBoard
                key={selectedBoard.weekNumber}
                board={selectedBoard}
                courseColors={courseColors}
                onAssignmentMove={handleAssignmentMove}
                onDeleteAssignment={handleDeleteAssignment}
                onRefreshData={refreshData}
                isUnified={isUnified}
              />
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a board from the sidebar to view its assignments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanView;
