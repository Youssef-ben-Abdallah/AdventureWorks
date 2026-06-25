import axios from 'axios';

export const environment = {
  apiBaseUrl: 'http://localhost:57241',
};

// Create a pre-configured Axios instance
export const apiClient = axios.create({
  baseURL: environment.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      if (!url.toLowerCase().includes('/auth/login')) {
        window.dispatchEvent(new Event('session-expired'));
      }
    }
    return Promise.reject(error);
  }
);
