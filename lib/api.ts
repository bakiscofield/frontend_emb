import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Admin
export const adminAPI = {
  login: (data: any) => api.post('/admin/login', data),
  createAdmin: (data: any) => api.post('/admin/create', data),
  getProfile: () => api.get('/admin/profile'),
};

// Transactions
export const transactionsAPI = {
  create: (data: any) => api.post('/transactions/create', data),
  getMyTransactions: () => api.get('/transactions/my-transactions'),
  getTransaction: (id: string) => api.get(`/transactions/${id}`),
  getAllTransactions: (params?: any) => api.get('/transactions', { params }),
  validateTransaction: (id: string, data: any) => api.put(`/transactions/${id}/validate`, data),
  getStats: () => api.get('/transactions/stats/overview'),
};

// Settings
export const settingsAPI = {
  getConfigs: () => api.get('/settings/config'),
  getPublicConfig: (key: string) => api.get(`/settings/config/public/${key}`),
  updateConfig: (key: string, value: string) => api.put(`/settings/config/${key}`, { value }),
  createConfig: (data: any) => api.post('/settings/config', data),
  
  getBookmakers: (activeOnly = false) => api.get('/settings/bookmakers', { params: { active_only: activeOnly } }),
  createBookmaker: (data: any) => api.post('/settings/bookmakers', data),
  updateBookmaker: (id: string, data: any) => api.put(`/settings/bookmakers/${id}`, data),
  deleteBookmaker: (id: string) => api.delete(`/settings/bookmakers/${id}`),
};

export default api;
