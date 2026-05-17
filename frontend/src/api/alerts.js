import api from './axios';

export const getActiveAlerts = async (childId) => {
  const response = await api.get(`/alerts/${childId}`);
  return response.data;
};
