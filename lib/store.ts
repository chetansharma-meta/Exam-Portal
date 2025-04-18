// lib/store.ts
import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { User, Student, Teacher, Exam, ExamSubmission, Question } from './types';
import apiService from '@/lib/api';

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
  subjects: string[];
  isLoading: boolean;
  error: string | null;

  // Auth methods
  login: (username: string, password: string, role: 'student' | 'teacher') => Promise<User | null>;
  logout: () => void;
  registerStudent: (userData: Omit<Student, 'id' | 'role'>) => Promise<User>;
  registerTeacher: (userData: Omit<Teacher, 'id' | 'role'>) => Promise<User>;

  // Exam methods
  createExam: (exam: Omit<Exam, 'id'>) => Exam;
  updateExam: (exam: Exam) => Exam;
  getExams: (teacherId?: string) => Exam[];
  getExam: (id: string) => Exam | undefined;
  fetchQuestions: () => Promise<void>;
  fetchSubjects: () => Promise<void>;

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
    subjects: string[];
  };
  version: number;
}

// Default admin users
const defaultStudentAdmin: Student = {
  id: "admin-student",
  name: "Admin Student",
  role: "student",
  password: "admin123",
  rollNo: "admin",
  department: "Administration",
  semester: "N/A"
};

const defaultTeacherAdmin: Teacher = {
  id: "admin-teacher",
  name: "Admin Teacher",
  role: "teacher",
  password: "admin123",
  username: "adminteacher",
  department: "Administration"
};

// Default exam with 5 questions
const defaultExamQuestions: Question[] = [
  {
    id: "q1",
    text: "What is the primary purpose of unit testing?",
    difficulty: "easy"
  },
  {
    id: "q2",
    text: "What is the difference between == and === in JavaScript?",
    difficulty: "medium"
  },
  {
    id: "q3",
    text: "What is the time complexity of the quicksort algorithm?",
    difficulty: "hard"
  },
  {
    id: "q4",
    text: "What is the difference between a stack and a queue?",
    difficulty: "easy"
  },
  {
    id: "q5",
    text: "What is the purpose of a constructor in Java?",
    difficulty: "medium"
  }
];

const defaultExam: Exam = {
  id: "default-exam",
  title: "Computer Science Fundamentals",
  subject: "Computer Science",
  duration: 1800, // 30 minutes
  createdBy: "admin-teacher",
  questions: defaultExamQuestions,
  isActive: true
};

// Sample data (will be replaced with API data)
const initialUsers: User[] = [defaultStudentAdmin, defaultTeacherAdmin];
const initialExams: Exam[] = [defaultExam];

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
  // Add onRehydrateStorage to ensure default admin users are always present
  onRehydrateStorage: (state) => {
    return (rehydratedState, error) => {
      if (error || !rehydratedState) {
        console.error('Error rehydrating state:', error);
        return;
      }

      // Ensure admin users exist after rehydration
      const hasStudentAdmin = rehydratedState.users.some(user => user.id === defaultStudentAdmin.id);
      const hasTeacherAdmin = rehydratedState.users.some(user => user.id === defaultTeacherAdmin.id);

      if (!hasStudentAdmin || !hasTeacherAdmin) {
        const updatedUsers = [...rehydratedState.users];

        if (!hasStudentAdmin) {
          updatedUsers.push(defaultStudentAdmin);
        }

        if (!hasTeacherAdmin) {
          updatedUsers.push(defaultTeacherAdmin);
        }

        rehydratedState.users = updatedUsers;
      }

      // Ensure default exam exists
      const hasDefaultExam = rehydratedState.exams.some(exam => exam.id === defaultExam.id);
      if (!hasDefaultExam) {
        rehydratedState.exams = [...rehydratedState.exams, defaultExam];
      }
    };
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      exams: initialExams,
      submissions: [],
      pdfSubmissions: [],
      currentUser: null,
      subjects: [],
      isLoading: false,
      error: null,

      login: async (username, password, role) => {
        set({ isLoading: true, error: null });

        try {
          // Check for admin users first
          if (role === 'student' && username === 'admin' && password === 'admin123') {
            set({ currentUser: defaultStudentAdmin, isLoading: false });
            return defaultStudentAdmin;
          }

          if (role === 'teacher' && username === 'adminteacher' && password === 'admin123') {
            set({ currentUser: defaultTeacherAdmin, isLoading: false });
            return defaultTeacherAdmin;
          }

          let userData;

          if (role === 'student') {
            userData = await apiService.loginStudent({
              roll_no: username,
              password
            });
          } else {
            userData = await apiService.loginTeacher({
              username,
              password
            });
          }

          // Transform server response to match your User type
          const user: User = {
            id: userData.id || generateId(),
            name: userData.name,
            role: role,
            password: password,
            ...(role === 'student' ? { rollNo: username } : {})
          };

          set({ currentUser: user, isLoading: false });
          return user;
        } catch (error) {
          console.error('Login error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to login'
          });
          return null;
        }
      },

      logout: () => {
        set({ currentUser: null });
      },

      registerStudent: async (userData) => {
        set({ isLoading: true, error: null });

        console.log('Registering student:', userData);

        try {
          const response = await apiService.registerStudent({
            name: userData.name,
            roll_no: userData.rollNo,
            password: userData.password,
            department: userData.department || '',
            semester: userData.semester || ''
          });

          // Create a new user from the response
          const newUser: Student = {
            id: response.id || generateId(),
            name: userData.name,
            role: 'student',
            password: userData.password,
            rollNo: userData.rollNo,
            department: userData.department,
            semester: userData.semester
          };

          set(state => ({
            users: [...state.users, newUser],
            isLoading: false
          }));

          return newUser;
        } catch (error) {
          console.error('Register student error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to register student'
          });
          throw error;
        }
      },

      registerTeacher: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.registerTeacher({
            name: userData.name,
            username: userData.username || userData.name,
            password: userData.password,
            department: userData.department || ''
          });

          // Create a new user from the response
          const newUser: Teacher = {
            id: response.id || generateId(),
            name: userData.name,
            role: 'teacher',
            password: userData.password,
            username: userData.username,
            department: userData.department
          };

          set(state => ({
            users: [...state.users, newUser],
            isLoading: false
          }));

          return newUser;
        } catch (error) {
          console.error('Register teacher error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to register teacher'
          });
          throw error;
        }
      },

      createExam: (examData) => {
        const newExam = { ...examData, id: generateId() };
        set(state => ({ exams: [...state.exams, newExam] }));
        return newExam;
      },

      updateExam: (examData) => {
        const updatedExam = { ...examData };
        set(state => ({
          exams: state.exams.map(exam =>
            exam.id === updatedExam.id ? updatedExam : exam
          )
        }));
        return updatedExam;
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

      fetchQuestions: async () => {
        set({ isLoading: true, error: null });

        try {
          const questions = await apiService.getQuestions();
          // Process questions as needed
          set({ isLoading: false });
        } catch (error) {
          console.error('Fetch questions error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch questions'
          });
        }
      },

      fetchSubjects: async () => {
        set({ isLoading: true, error: null });

        try {
          const subjects = await apiService.getSubjects();
          set({ subjects, isLoading: false });
        } catch (error) {
          console.error('Fetch subjects error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch subjects'
          });
        }
      },

      submitExam: (submissionData) => {
        const newSubmission = {
          ...submissionData,
          id: generateId(),
          submittedAt: new Date().toISOString(),
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

      // PDF submission methods
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
