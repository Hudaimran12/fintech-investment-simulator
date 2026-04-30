import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE });

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Investment API
export const investmentAPI = {
  getAll:      (params) => api.get('/investments', { params }),
  add:         (data)   => api.post('/investments', data),
  update:      (id, d)  => api.put(`/investments/${id}`, d),
  remove:      (id)     => api.delete(`/investments/${id}`),
  simulate:    (id)     => api.get(`/investments/simulate/${id}`),
  aggregated:  ()       => api.get('/investments/stats/aggregated')
};

// Portfolio API
export const portfolioAPI = {
  get:      () => api.get('/portfolio'),
  rankings: () => api.get('/portfolio/rankings')
};

// Alert API
export const alertAPI = {
  getAll:   (params) => api.get('/alerts', { params }),
  markRead: (id)     => api.put(`/alerts/${id}/read`),
  readAll:  ()       => api.put('/alerts/read-all'),
  dismiss:  (id)     => api.delete(`/alerts/${id}`)
};

export default api;
