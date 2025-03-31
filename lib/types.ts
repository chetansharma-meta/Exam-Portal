
// lib/types.ts

// User roles
export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  password: string;
}

export interface Student extends User {
  role: 'student';
  rollNo: string;
  department?: string;
  semester?: string;
}

export interface Teacher extends User {
  role: 'teacher';
  username?: string;
  department?: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Answer {
  questionId: string;
  text: string;
}

export interface Exam {
  id: string;
  title: string;
  createdBy: string;
  questions: Question[];
  duration: number; // in seconds
  isActive: boolean;
  subject?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string | Date;
  evaluated?: boolean;
  marks?: number;
  feedback?: string;
  percentage?: number;
}

// API response types
export interface ApiResponse {
  success: boolean;
  message?: string;
}

export interface LoginResponse extends ApiResponse {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  token?: string;
}

export interface RegisterResponse extends ApiResponse {
  id: string;
  name: string;
}
