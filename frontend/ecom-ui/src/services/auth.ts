import { apiClient } from '../config/api';

export const AuthService = {
  login: async (credentials: any) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },
  register: async (credentials: any) => {
    const response = await apiClient.post('/api/auth/register', credentials);
    return response.data;
  }
};
