import axios from 'axios';
import { getApiUrl } from './config';

const API_URL = getApiUrl();

// Instance axios qui sera configurée dynamiquement
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configurer l'URL de base dynamiquement
api.interceptors.request.use(
  (config) => {
    // Définir baseURL dynamiquement à chaque requête
    if (!config.baseURL) {
      const apiUrl = getApiUrl();
      config.baseURL = `${apiUrl}/api`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Récupérer le token depuis le store Zustand persisté
      const authStorage = localStorage.getItem('emb-auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          const token = state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Erreur lors de la lecture du token:', error);
        }
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
        // Nettoyer le storage Zustand
        localStorage.removeItem('emb-auth-storage');
        // Rediriger vers la page de connexion appropriée
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  requestVerificationCode: (data: any) => api.post('/auth/request-verification-code', data),
  verifyAndRegister: (data: any) => api.post('/auth/verify-and-register', data),
  resendVerificationCode: (email: string) => api.post('/auth/resend-verification-code', { email }),
  login: (data: any) => api.post('/auth/login', data),
  requestPasswordReset: (email: string) => api.post('/auth/request-password-reset', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/profile'),
};

// Admin
export const adminAPI = {
  login: (data: any) => api.post('/admin/login', data),
  createAdmin: (data: any) => api.post('/admin/create', data),
  getProfile: () => api.get('/admin/profile'),
  listAdmins: () => api.get('/admin/list'),
  getAdmin: (id: string) => api.get(`/admin/${id}`),
  toggleAdminStatus: (id: string) => api.patch(`/admin/${id}/toggle-status`),
  updateAdmin: (id: string, data: any) => api.put(`/admin/${id}`, data),
  deleteAdmin: (id: string) => api.delete(`/admin/${id}`),
};

// Transactions
export const transactionsAPI = {
  create: (data: any) => api.post('/transactions/create', data),
  getMyTransactions: () => api.get('/transactions/my-transactions'),
  getTransaction: (id: string) => api.get(`/transactions/${id}`),
  getAllTransactions: (params?: any) => api.get('/transactions', { params }),
  validateTransaction: (id: string, data: any) => api.put(`/transactions/${id}/validate`, data),
  getStats: () => api.get('/transactions/stats/overview'),
  checkReference: (reference: string) => api.get(`/transactions/check-reference/${reference}`),
  getMonthlyLimit: () => api.get('/transactions/monthly-limit'),
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

// Payment Methods
export const paymentMethodsAPI = {
  getAll: (activeOnly = false) => api.get('/payment-methods', { params: { active_only: activeOnly } }),
  getById: (id: string) => api.get(`/payment-methods/${id}`),
  create: (data: any) => api.post('/payment-methods', data),
  update: (id: string, data: any) => api.put(`/payment-methods/${id}`, data),
  delete: (id: string) => api.delete(`/payment-methods/${id}`),
};

// Exchange Pairs
export const exchangePairsAPI = {
  getAll: (activeOnly = false) => api.get('/exchange-pairs', { params: { active_only: activeOnly } }),
  getById: (id: string) => api.get(`/exchange-pairs/${id}`),
  create: (data: any) => api.post('/exchange-pairs', data),
  update: (id: string, data: any) => api.put(`/exchange-pairs/${id}`, data),
  delete: (id: string) => api.delete(`/exchange-pairs/${id}`),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Permissions
export const permissionsAPI = {
  getAll: () => api.get('/permissions'),
  getAdminPermissions: (adminId: string) => api.get(`/permissions/admin/${adminId}`),
  grantPermission: (adminId: string, permissionId: number) =>
    api.post(`/permissions/admin/${adminId}/grant`, { permissionId }),
  revokePermission: (adminId: string, permissionId: number) =>
    api.delete(`/permissions/admin/${adminId}/revoke/${permissionId}`),
  updateAdminPermissions: (adminId: string, permissionIds: number[]) =>
    api.put(`/permissions/admin/${adminId}/bulk`, { permissionIds }),
};

// Newsletters
export const newslettersAPI = {
  getAll: () => api.get('/newsletters'),
  getById: (id: string) => api.get(`/newsletters/${id}`),
  create: (data: any) => api.post('/newsletters', data),
  update: (id: string, data: any) => api.put(`/newsletters/${id}`, data),
  send: (id: string, recipientType: string) =>
    api.post(`/newsletters/${id}/send`, { recipient_type: recipientType }),
  delete: (id: string) => api.delete(`/newsletters/${id}`),
  getSubscriberStats: () => api.get('/newsletters/stats/subscribers'),
  getSubscribers: (params?: any) => api.get('/newsletters/subscribers/list', { params }),
  updateSubscriberStatus: (userId: string, subscribed: boolean) =>
    api.patch(`/newsletters/subscribers/${userId}`, { newsletter_subscribed: subscribed }),
};

// Users
export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  getTransactions: (id: string, params?: any) => api.get(`/users/${id}/transactions`, { params }),
  toggleActive: (id: string) => api.put(`/users/${id}/toggle-active`),
  updateNewsletter: (id: string, subscribed: boolean) =>
    api.put(`/users/${id}/newsletter`, { subscribed }),
  getStats: () => api.get('/users/stats/overview'),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

// KYC
export const kycAPI = {
  // Routes utilisateur
  submit: (formData: FormData) => {
    return axios.post(`${API_URL}/api/kyc/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('emb-auth-storage') || '{}')?.state?.token : ''}`,
      },
    });
  },
  getStatus: () => api.get('/kyc/status'),

  // Routes admin
  getPending: () => api.get('/kyc/admin/pending'),
  getAll: (status?: string) => api.get('/kyc/admin/all', { params: { status } }),
  verify: (id: string) => api.post(`/kyc/admin/verify/${id}`),
  reject: (id: string, reason: string) => api.post(`/kyc/admin/reject/${id}`, { reason }),
  getDocument: (filename: string) => `${API_URL}/api/kyc/document/${filename}`,
  // Récupérer le document avec authentification comme blob
  fetchDocumentBlob: async (filename: string) => {
    const response = await api.get(`/kyc/document/${filename}`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },
};

// Chat
export const chatAPI = {
  // Routes utilisateur
  getConversation: () => api.get('/chat/conversation'),
  getMessages: (conversationId: string) => api.get(`/chat/messages/${conversationId}`),
  sendMessage: (conversationId: string, message: string) =>
    api.post('/chat/message', { conversation_id: conversationId, message }),

  // Routes admin
  getAllConversations: (status?: string) => api.get('/chat/admin/conversations', { params: { status } }),
  getConversationById: (id: string) => api.get(`/chat/admin/conversation/${id}`),
  sendAdminMessage: (conversationId: string, message: string) =>
    api.post('/chat/admin/message', { conversation_id: conversationId, message }),
  closeConversation: (id: string) => api.post(`/chat/admin/close/${id}`),
  reopenConversation: (id: string) => api.post(`/chat/admin/reopen/${id}`),
};

// Email Templates
export const emailTemplatesAPI = {
  getAll: () => api.get('/email-templates'),
  getById: (id: string) => api.get(`/email-templates/${id}`),
  create: (data: any) => api.post('/email-templates', data),
  update: (id: string, data: any) => api.put(`/email-templates/${id}`, data),
  delete: (id: string) => api.delete(`/email-templates/${id}`),
};

export default api;
