import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injecte automatiquement le JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  register: (data)            => api.post('/auth/register', data),
};

export default api;
