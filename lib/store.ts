import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  phone: string;
  name: string;
  email?: string;
  kyc_verified?: boolean;
  kyc_status?: string;
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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      admin: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,

      setUser: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isAdmin: false,
          admin: null // Clear admin data when user logs in
        });
      },

      setAdmin: (admin, token) => {
        set({
          admin,
          token,
          isAuthenticated: true,
          isAdmin: true,
          user: null // Clear user data when admin logs in
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          admin: null
        });
      },

      logoutAdmin: () => {
        set({
          admin: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          user: null
        });
      },

      initAuth: () => {
        // With persist middleware, this is handled automatically
        // But we keep it for backwards compatibility
        const state = get();
        if (state.token && (state.user || state.admin)) {
          set({
            isAuthenticated: true,
            isAdmin: !!state.admin
          });
        }
      },
    }),
    {
      name: 'emb-auth-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        admin: state.admin,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
