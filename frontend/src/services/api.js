import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Device API
export const deviceAPI = {
  getAll: () => api.get('/devices'),
  getOne: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  getMetrics: (id, params) => api.get(`/devices/${id}/metrics`, { params }),
  getStats: (id, params) => api.get(`/devices/${id}/stats`, { params }),
  ping: (id) => api.post(`/devices/${id}/ping`),
  traceroute: (id) => api.post(`/devices/${id}/traceroute`),
};

// Alert API
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getByDevice: (deviceId, params) => api.get(`/alerts/device/${deviceId}`, { params }),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  delete: (id) => api.delete(`/alerts/${id}`),
  getStats: (params) => api.get('/alerts/stats', { params }),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getTopology: () => api.get('/dashboard/topology'),
  getActivity: (params) => api.get('/dashboard/activity', { params }),
  getMetrics: (params) => api.get('/dashboard/metrics', { params }),
};

// System API
export const systemAPI = {
  health: () => api.get('/health'),
  testNotifications: () => api.post('/test-notifications'),
};

export default api;
