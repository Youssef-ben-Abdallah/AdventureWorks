import axios from 'axios';

export const environment = {
  apiBaseUrl: 'http://127.0.0.1:57241',
};

// Create a pre-configured Axios instance
export const apiClient = axios.create({
  baseURL: environment.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});
