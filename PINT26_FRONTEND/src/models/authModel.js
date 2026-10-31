import { api } from '../services/api';

export const authModel = {
  login: async (payload) => {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },
  logout: async (token) => {
    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    const response = await api.post('/auth/logout', {}, config);
    return response.data;
  }
};
