import api from './axios';

export const getChild = async () => {
  const response = await api.get('/child');
  return response.data;
};

export const createChild = async (childData) => {
  const response = await api.post('/child', childData);
  return response.data;
};
