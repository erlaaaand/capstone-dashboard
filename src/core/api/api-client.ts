import axios from 'axios';
import { getCookie } from 'cookies-next';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nestjs-backed-production.up.railway.app/api/v1';

export const apiClient = axios.create({
  baseURL,
  timeout: 60000, // Fix: naikkan timeout untuk export ZIP besar (sebelumnya 30s)
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getCookie('admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (
      response.config.responseType === 'blob' ||
      response.config.responseType === 'arraybuffer'
    ) {
      return response;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    const errorMessage = error.response?.data?.message || 'Terjadi kesalahan pada server';
    return Promise.reject(new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage));
  }
);