// lib/types.ts

export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password: string; // In a real app, never store plain text passwords
}

export interface Student extends User {
  role: 'student';
  rollNo: string;
}

export interface Teacher extends User {
  role: 'teacher';
  subject?: string;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  text: string;
  difficulty: DifficultyLevel;
}

export interface Exam {
  id: string;
  title: string;
  createdBy: string; // Teacher ID
  questions: Question[];
  duration: number; // in seconds
  scheduledFor?: Date;
  isActive: boolean;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  answers: {
    questionId: string;
    imageData: string; // base64 encoded canvas image
  }[];
  submittedAt: Date;
  evaluated?: boolean;
  marks?: number;
  feedback?: string;
  percentage?: number;
}
