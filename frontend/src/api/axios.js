import axios from 'axios';

// Get base URL smartly
const getBaseUrl = () => {
  // In local development, use empty string to let Vite proxy handle it
  if (import.meta.env.DEV) {
    return '';
  }

  // In production, prefer explicit backend URL via env var.
  // If no VITE_API_URL is set, use relative /api paths so the frontend can still work if served from the same origin.
  let url = import.meta.env.VITE_API_URL || '';

  if (!url) {
    return '';
  }

  // Remove trailing slashes
  url = url.replace(/\/+$|$/, '');

  // Remove /api if accidentally included in env var
  if (url.endsWith('/api')) {
    url = url.slice(0, -4);
  }

  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.url?.includes('/api/ai/')) {
    config.timeout = 90000;
  }
  return config;
});

export default api;
