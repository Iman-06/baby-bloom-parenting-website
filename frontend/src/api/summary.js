import api from './axios';

export const getDailySummary = async (childId, date) => {
  const response = await api.get(`/summary/${childId}?date=${date}`);
  return response.data;
};

export const getChartsData = async (childId) => {
  const response = await api.get(`/charts/${childId}`);
  return response.data;
};
