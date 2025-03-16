// lib/store.ts
import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { User, Student, Teacher, Exam, ExamSubmission } from './types';

// Generate a unique ID
export const generateId = () => Math.random().toString(36).substring(2, 9);

// Interface for PDF document storage
interface PdfSubmission {
  id: string;
  examId: string;
  studentId: string;
  fileName: string;
  pdfBlob: Blob;
  submittedAt: string;
}

interface AppState {
  users: User[];
  exams: Exam[];
  submissions: ExamSubmission[];
  pdfSubmissions: PdfSubmission[];
  currentUser: User | null;

  // Auth methods
  login: (username: string, password: string) => User | null;
  logout: () => void;
  register: (user: Omit<Student | Teacher, 'id'>) => User;

  // Exam methods
  createExam: (exam: Omit<Exam, 'id'>) => Exam;
  getExams: (teacherId?: string) => Exam[];
  getExam: (id: string) => Exam | undefined;

  // Submission methods
  submitExam: (submission: Omit<ExamSubmission, 'id' | 'submittedAt'>) => ExamSubmission;
  evaluateSubmission: (id: string, marks: number, feedback: string) => ExamSubmission | null;
  getSubmissions: (examId?: string, studentId?: string) => ExamSubmission[];

  // PDF submission methods
  savePdfForTeacher: (pdfData: Omit<PdfSubmission, 'id'>) => PdfSubmission;
  getPdfSubmissions: (examId?: string, studentId?: string) => PdfSubmission[];
  getPdfSubmission: (id: string) => PdfSubmission | undefined;
  getStudentPdfSubmissionsByExam: (examId: string) => PdfSubmission[];
}

// Create a type for serializable PDF submission (without Blob)
interface SerializablePdfSubmission extends Omit<PdfSubmission, 'pdfBlob'> {
  pdfBlob: null;
}

// Define a storage interface that allows us to customize serialization
type StorageValue = {
  state: {
    users: User[];
    exams: Exam[];
    submissions: ExamSubmission[];
    pdfSubmissions: SerializablePdfSubmission[];
    currentUser: User | null;
  };
  version: number;
}

// Sample data
const initialUsers: User[] = [
  { id: '1', name: 'Admin Teacher', role: 'teacher', password: 'teacher123' },
  { id: '2', name: 'John Student', role: 'student', password: 'student123', rollNo: '211550001' } as Student,
];

const initialExams: Exam[] = [
  {
    id: '1',
    title: 'Science Test',
    createdBy: '1',
    questions: [
      { id: '1', text: 'What are the main causes of climate change?', difficulty: 'medium' },
      { id: '2', text: 'Explain the process of photosynthesis.', difficulty: 'hard' },
    ],
    duration: 3600, // 1 hour
    isActive: true,
  }
];

// Define custom storage with proper types
const customStorage = {
  getItem: (name: string): string | null => {
    try {
      const value = localStorage.getItem(name);
      return value;
    } catch (err) {
      console.error(err);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      // Convert PdfSubmission to serializable form
      const parsedValue: StorageValue = JSON.parse(value);

      const serializedValue: StorageValue = {
        ...parsedValue,
        state: {
          ...parsedValue.state,
          // Remove actual Blob data before serialization
          pdfSubmissions: parsedValue.state.pdfSubmissions.map(sub => ({
            ...sub,
            pdfBlob: null,
          }))
        }
      };

      localStorage.setItem(name, JSON.stringify(serializedValue));
    } catch (err) {
      console.error(err);
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  }
};

// Set up persist options with proper typing
const persistOptions: PersistOptions<AppState> = {
  name: 'exam-app-storage',
  storage: customStorage as any, // Use type assertion since we're using a custom storage
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      exams: initialExams,
      submissions: [],
      pdfSubmissions: [],
      currentUser: null,

      login: (username, password) => {
        const user = get().users.find(
          u => (u.role === 'student' ? (u as Student).rollNo === username : u.name === username) &&
          u.password === password
        );
        if (user) {
          set({ currentUser: user });
          return user;
        }
        return null;
      },

      logout: () => {
        set({ currentUser: null });
      },

      register: (userData) => {
        const newUser = { ...userData, id: generateId() };
        set(state => ({ users: [...state.users, newUser as User] }));
        return newUser as User;
      },

      createExam: (examData) => {
        const newExam = { ...examData, id: generateId() };
        set(state => ({ exams: [...state.exams, newExam] }));
        return newExam;
      },

      getExams: (teacherId) => {
        const { exams } = get();
        if (teacherId) {
          return exams.filter(exam => exam.createdBy === teacherId);
        }
        return exams;
      },

      getExam: (id) => {
        return get().exams.find(exam => exam.id === id);
      },

      submitExam: (submissionData) => {
        const newSubmission = {
          ...submissionData,
          id: generateId(),
          submittedAt: new Date(),
        };
        set(state => ({ submissions: [...state.submissions, newSubmission] }));
        return newSubmission;
      },

      evaluateSubmission: (id, marks, feedback) => {
        let updatedSubmission: ExamSubmission | null = null;

        set(state => {
          const submissions = state.submissions.map(sub => {
            if (sub.id === id) {
              const percentage = marks / sub.answers.length * 100;
              updatedSubmission = {
                ...sub,
                evaluated: true,
                marks,
                feedback,
                percentage,
              };
              return updatedSubmission;
            }
            return sub;
          });

          return { submissions };
        });

        return updatedSubmission;
      },

      getSubmissions: (examId, studentId) => {
        const { submissions } = get();
        return submissions.filter(sub =>
          (!examId || sub.examId === examId) &&
          (!studentId || sub.studentId === studentId)
        );
      },

      // New PDF submission methods
      savePdfForTeacher: (pdfData) => {
        const newPdfSubmission = {
          ...pdfData,
          id: generateId(),
        };

        set(state => ({
          pdfSubmissions: [...state.pdfSubmissions, newPdfSubmission]
        }));

        return newPdfSubmission;
      },

      getPdfSubmissions: (examId, studentId) => {
        const { pdfSubmissions } = get();
        return pdfSubmissions.filter(sub =>
          (!examId || sub.examId === examId) &&
          (!studentId || sub.studentId === studentId)
        );
      },

      getPdfSubmission: (id) => {
        return get().pdfSubmissions.find(sub => sub.id === id);
      },

      getStudentPdfSubmissionsByExam: (examId) => {
        return get().pdfSubmissions.filter(sub => sub.examId === examId);
      }
    }),
    persistOptions
  )
);
