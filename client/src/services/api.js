import axios from 'axios';

// Retrieve base URL and normalize it to ensure it always ends with /api
let rawApiUrl = import.meta.env?.VITE_API_URL || 'https://signal-board-eb7y.vercel.app/api';
// Strip trailing slashes and ensure exactly one '/api' at the end
rawApiUrl = rawApiUrl.replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10s default timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to inject JWT authorization header if preserved in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('signal_board_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for normalization and global error handling
apiClient.interceptors.response.use(
  (response) => {
    // Normalizing successful responses
    return response.data;
  },
  (error) => {
    // Normalizing error responses
    const normalizedError = {
      success: false,
      message: 'An unexpected network error occurred.',
      code: 'NETWORK_ERROR',
      details: null
    };

    if (error.response) {
      normalizedError.message = error.response.data?.error || error.response.data?.message || 'Server returned an error.';
      normalizedError.code = error.response.data?.code || `HTTP_${error.response.status}`;
      normalizedError.details = error.response.data?.details || null;
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
         normalizedError.message = 'Request timed out. Please try again.';
         normalizedError.code = 'TIMEOUT';
      }
    } else {
      normalizedError.message = error.message;
    }

    // Returning rejected promise to let callers handle if needed, or they can catch it.
    // For this refactor, we will reject so the callers can try/catch properly.
    return Promise.reject(normalizedError);
  }
);

export const apiService = {
  // Authentication & Identity
  async register(data) {
    const dataResponse = await apiClient.post('/auth/register', data);
    if (dataResponse.token) {
      localStorage.setItem('signal_board_token', dataResponse.token);
      localStorage.setItem('signal_board_user', JSON.stringify(dataResponse.user));
    }
    return dataResponse;
  },

  async login(credentials) {
    const dataResponse = await apiClient.post('/auth/login', credentials);
    if (dataResponse.token) {
      localStorage.setItem('signal_board_token', dataResponse.token);
      localStorage.setItem('signal_board_user', JSON.stringify(dataResponse.user));
    }
    return dataResponse;
  },

  logout() {
    localStorage.removeItem('signal_board_token');
    localStorage.removeItem('signal_board_user');
  },

  getCurrentUser() {
    const str = localStorage.getItem('signal_board_user');
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  },

  // Feature 1: AI-Assisted Job Generation (Employer-Facing)
  async generateAiJobDescription(rawNotes, title, companyName) {
    const dataResponse = await apiClient.post('/ai/generate-job', { rawNotes, title, companyName });
    return dataResponse.data?.formattedDescription || dataResponse.formattedDescription;
  },

  // Feature 2: Natural Language Smart Search (Candidate-Facing)
  async smartAiSearch(query) {
    console.log('[SmartSearch API] Sending POST /api/search/ai-search with payload:', { query });
    const dataResponse = await apiClient.post('/search/ai-search', { query });
    console.log('[SmartSearch API] Response received:', dataResponse);
    return dataResponse;
  },

  // Job Posting CRUD & Application Service
  async getJobs() {
    const dataResponse = await apiClient.get('/jobs');
    return dataResponse.jobs || [];
  },

  async getJobById(id) {
    const dataResponse = await apiClient.get(`/jobs/${id}`);
    return dataResponse.job;
  },

  async createJob(data) {
    const dataResponse = await apiClient.post('/jobs', data);
    return dataResponse.job;
  },

  async submitApplication(jobId, coverLetter) {
    const dataResponse = await apiClient.post(`/jobs/${jobId}/apply`, { coverLetter });
    return dataResponse;
  },
};
