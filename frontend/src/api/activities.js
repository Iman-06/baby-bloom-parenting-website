import api from "./axios";

export const logSleep = (childId, data) => 
  api.post("/activities/sleep", { child_id: childId, ...data }).then(r => r.data);

export const logTemperature = (childId, data) => 
  api.post("/activities/temperature", { child_id: childId, ...data }).then(r => r.data);

export const logDiaper = (childId, data) => 
  api.post("/activities/diaper", { child_id: childId, ...data }).then(r => r.data);

export const logFeeding = (childId, data) => 
  api.post("/activities/feeding", { child_id: childId, ...data }).then(r => r.data);

export const logCrying = (childId, data) => 
  api.post("/activities/crying", { child_id: childId, ...data }).then(r => r.data);

export const getActivities = (childId, date) =>
  api.get(`/activities/${childId}`, { params: { date } }).then(r => r.data);