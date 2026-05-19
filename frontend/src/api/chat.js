import api from "./axios";

export const sendMessage    = (data)   => api.post("/chat",                  data).then(r => r.data);
export const getChatHistory = (userId) => api.get(`/chat/history/${userId}`).then(r => r.data);