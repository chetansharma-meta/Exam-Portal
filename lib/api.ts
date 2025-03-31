// services/api.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

// Types for API requests and responses
interface StudentRegisterData {
  name: string;
  roll_no: string;
  password: string;
  department: string;
  semester: string;
}

interface TeacherRegisterData {
  name: string;
  username: string;
  password: string;
  department: string;
}

interface StudentLoginData {
  roll_no: string;
  password: string;
}

interface TeacherLoginData {
  username: string;
  password: string;
}

// API service
const apiService = {
  // Student registration
  registerStudent: async (data: StudentRegisterData) => {
    try {
      const response = await axios.post(`${BASE_URL}/register_student`, data);
      return response.data;
    } catch (error) {
      console.error('Error registering student:', error);
      throw error;
    }
  },

  // Teacher registration
  registerTeacher: async (data: TeacherRegisterData) => {
    try {
      const response = await axios.post(`${BASE_URL}/register_teacher`, data);
      return response.data;
    } catch (error) {
      console.error('Error registering teacher:', error);
      throw error;
    }
  },

  // Student login
  loginStudent: async (data: StudentLoginData) => {
    try {
      const response = await axios.post(`${BASE_URL}/login_student`, data);
      return response.data;
    } catch (error) {
      console.error('Error logging in student:', error);
      throw error;
    }
  },

  // Teacher login
  loginTeacher: async (data: TeacherLoginData) => {
    try {
      const response = await axios.post(`${BASE_URL}/login_teacher`, data);
      return response.data;
    } catch (error) {
      console.error('Error logging in teacher:', error);
      throw error;
    }
  },

  // Fetch questions
  getQuestions: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/questions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  // Fetch subjects
  getSubjects: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/subjects`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  }
};

export default apiService;
