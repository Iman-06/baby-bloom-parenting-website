import api from "./axios";

export const logSleep        = (data) => api.post("/activities/sleep",        data).then(r => r.data);
export const logTemperature  = (data) => api.post("/activities/temperature",  data).then(r => r.data);
export const logDiaper       = (data) => api.post("/activities/diaper",       data).then(r => r.data);
export const logFeeding      = (data) => api.post("/activities/feeding",      data).then(r => r.data);
export const logCrying       = (data) => api.post("/activities/crying",       data).then(r => r.data);

export const getActivities   = (childId, date) =>
  api.get(`/activities/${childId}`, { params: { date } }).then(r => r.data);