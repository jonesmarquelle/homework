/**
 * Shared TypeScript type definitions for the homework management system.
 * These types define the structure of assignment and syllabus data.
 */

export type AssignmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

export interface Assignment {
  /** The unique identifier of the assignment in the database */
  id: number;
  /** The full title or name of the assignment */
  name: string;
  /** The assignment's due date in YYYY-MM-DD format */
  due_date: string;
  /** The assignment's due time */
  due_time: string;
  /** The link to submit the assignment */
  submission_link: string;
  /** The current status of the assignment */
  status: AssignmentStatus;
}

export interface AssignmentData {
  /** The unique identifier of the syllabus in the database */
  id: number;
  /** The official name of the class */
  class_name: string;
  /** The official course code of the class */
  course_code: string;
  /** A comprehensive list of all assignments */
  assignments: Assignment[];
}

// Alternative name for consistency with backend
export interface Syllabus extends AssignmentData {}

// Utility types for form handling
export interface AssignmentFormData {
  name: string;
  due_date: string;
  due_time: string;
  submission_link: string;
}

export interface ClassFormData {
  class_name: string;
  course_code: string;
}
