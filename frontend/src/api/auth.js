import api from './axios';

export const loginUser = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/me');
  return response.data;
};
