import { create } from 'zustand';

interface User {
  id: number;
  phone: string;
  name: string;
  email?: string;
}

interface Admin {
  id: number;
  username: string;
  email?: string;
}

interface AuthStore {
  user: User | null;
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  setUser: (user: User, token: string) => void;
  setAdmin: (admin: Admin, token: string) => void;
  logout: () => void;
  logoutAdmin: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  admin: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,

  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isAdmin: false });
  },

  setAdmin: (admin, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('admin', JSON.stringify(admin));
    }
    set({ admin, token, isAuthenticated: true, isAdmin: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
  },

  logoutAdmin: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
    }
    set({ admin: null, token: null, isAuthenticated: false, isAdmin: false });
  },

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const adminStr = localStorage.getItem('admin');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true, isAdmin: false });
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      } else if (token && adminStr) {
        try {
          const admin = JSON.parse(adminStr);
          set({ admin, token, isAuthenticated: true, isAdmin: true });
        } catch (error) {
          console.error('Error parsing admin data:', error);
        }
      }
    }
  },
}));
