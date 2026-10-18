import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (session && !refreshError) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return api(originalRequest);
        }
      } catch {
        // Refresh failed — redirect to login (avoid infinite loop if already on auth page)
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// ============================================================================
// API Service Functions
// ============================================================================

// Auth
export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Dashboard
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getSpendingTrend: () => api.get('/dashboard/spending-trend'),
};

// Expenses
export const expenseApi = {
  list: (params?: Record<string, any>) => api.get('/expenses', { params }),
  get: (id: string) => api.get(`/expenses/${id}`),
  create: (data: any, config?: any) => api.post('/expenses', data, config),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

// Groups
export const groupApi = {
  list: () => api.get('/groups'),
  get: (id: string) => api.get(`/groups/${id}`),
  create: (data: any) => api.post('/groups', data),
  update: (id: string, data: any) => api.put(`/groups/${id}`, data),
  addMember: (groupId: string, payload: { userId?: string; email?: string; phone?: string } | string) =>
    api.post(`/groups/${groupId}/members`, typeof payload === 'string' ? { userId: payload } : payload),
  updateMemberRole: (groupId: string, userId: string, role: 'ADMIN' | 'MEMBER') =>
    api.patch(`/groups/${groupId}/members/${userId}/role`, { role }),
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  getBalances: (groupId: string) => api.get(`/groups/${groupId}/balances`),
  getInviteLink: (groupId: string) => api.get(`/groups/${groupId}/invite`),
  getPublicInfo: (groupId: string) => api.get(`/groups/public/${groupId}`),
  join: (groupId: string, data?: { passcode?: string }) => api.post(`/groups/${groupId}/join`, data || {}),
  delete: (id: string) => api.delete(`/groups/${id}`),
};

// Settlements
export const settlementApi = {
  list: (params?: Record<string, any>) => api.get('/settlements', { params }),
  create: (data: any, config?: any) => api.post('/settlements', data, config),
  confirm: (id: string) => api.patch(`/settlements/${id}/confirm`),
  reject: (id: string) => api.patch(`/settlements/${id}/reject`),
  cancel: (id: string) => api.delete(`/settlements/${id}`),
  getSimplified: () => api.get('/settlements/simplified'),
};

// Budgets
export const budgetApi = {
  list: () => api.get('/budgets'),
  create: (data: any) => api.post('/budgets', data),
  update: (id: string, data: any) => api.put(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

// Activities
export const activityApi = {
  list: (params?: Record<string, any>) => api.get('/activities', { params }),
};

// Friends
export const friendApi = {
  list: () => api.get('/friends'),
  pending: () => api.get('/friends/pending'),
  sent: () => api.get('/friends/sent'),
  request: (payload: { friendId?: string; email?: string; phone?: string } | string) =>
    api.post('/friends/request', typeof payload === 'string' ? { friendId: payload } : payload),
  accept: (id: string) => api.patch(`/friends/${id}/accept`),
  remove: (id: string) => api.delete(`/friends/${id}`),
  getInviteLink: () => api.get('/friends/invite-link'),
};

// Users
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  search: (query: string) => api.get('/users/search', { params: { q: query } }),
  getPublicProfile: (id: string) => api.get(`/users/${id}/public-profile`),
};

// Notifications
export const notificationApi = {
  list: (limit?: number) => api.get(`/notifications${limit ? `?limit=${limit}` : ''}`),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
  clear: () => api.delete('/notifications'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Admin Operations
export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: (params?: Record<string, any>) => api.get('/admin/users', { params }),
  getActivity: () => api.get('/admin/activity'),
  toggleUserStatus: (id: string) => api.patch(`/admin/users/${id}/toggle-status`),
};

