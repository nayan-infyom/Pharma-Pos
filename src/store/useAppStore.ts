import { create } from 'zustand';
import { setAccessToken, setSessionExpiredHandler } from '../api/client';
import * as authApi from '../api/auth';
import type { AuthUser } from '../api/auth';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

/**
 * Lighter than the full Employee type on purpose — this is what the JWT
 * session actually carries (see server AuthContext), not a fetched Employee
 * record (the Employees API doesn't exist yet — later phase). `id` mirrors
 * `employeeId` so existing `currentUser.id`/`.name`/`.role` call sites in
 * pages not yet migrated in this Phase K checkpoint keep compiling and
 * behaving sensibly without being touched.
 */
export interface SessionUser {
  id: string;
  employeeId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

const GUEST_USER: SessionUser = { id: '', employeeId: '', email: '', name: '', role: '', permissions: [] };

function toSessionUser(u: AuthUser): SessionUser {
  return { id: u.employeeId, employeeId: u.employeeId, email: u.email, name: u.name, role: u.role, permissions: u.permissions };
}

interface AppState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  globalSearchOpen: boolean;
  quickActionOpen: boolean;
  shortcutsModalOpen: boolean;
  currentStore: string;
  currentUser: SessionUser;
  toasts: ToastMessage[];

  // Auth session state
  isAuthenticated: boolean;
  /** True once the initial silent-refresh attempt (on app load) has resolved either way. */
  isAuthReady: boolean;
  authError: string | null;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setQuickActionOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setCurrentStore: (storeName: string) => void;

  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Wired once here rather than in a component — a session-expiry event (a
  // refresh that ultimately failed) can happen from any API call, at any time.
  setSessionExpiredHandler(() => {
    set({ isAuthenticated: false, currentUser: GUEST_USER });
  });

  return {
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    globalSearchOpen: false,
    quickActionOpen: false,
    shortcutsModalOpen: false,
    currentStore: 'Apex Care - Main Galleria',
    currentUser: GUEST_USER,
    toasts: [],

    isAuthenticated: false,
    isAuthReady: false,
    authError: null,

    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
    setGlobalSearchOpen: (globalSearchOpen) => set({ globalSearchOpen }),
    setQuickActionOpen: (quickActionOpen) => set({ quickActionOpen }),
    setShortcutsModalOpen: (shortcutsModalOpen) => set({ shortcutsModalOpen }),
    setCurrentStore: (currentStore) => set({ currentStore }),

    /** Called once on app mount. Relies on client.ts's own 401-triggers-refresh
     *  logic: /auth/me with no in-memory access token yet returns 401, which
     *  attempts a refresh using the httpOnly cookie automatically. */
    initializeAuth: async () => {
      try {
        const { user } = await authApi.me();
        set({ currentUser: toSessionUser(user), isAuthenticated: true, isAuthReady: true });
      } catch {
        set({ currentUser: GUEST_USER, isAuthenticated: false, isAuthReady: true });
      }
    },

    login: async (email: string, password: string) => {
      set({ authError: null });
      try {
        const { accessToken, user } = await authApi.login(email, password);
        setAccessToken(accessToken);
        set({ currentUser: toSessionUser(user), isAuthenticated: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        set({ authError: message });
        throw err;
      }
    },

    logout: async () => {
      try {
        await authApi.logout();
      } catch {
        // Logout is idempotent server-side; proceed to clear local state regardless.
      }
      setAccessToken(null);
      set({ currentUser: GUEST_USER, isAuthenticated: false });
    },

    addToast: (toast) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastMessage = { ...toast, id };
      set((state) => ({ toasts: [...state.toasts, newToast] }));

      const duration = toast.duration || 4000;
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    },

    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  };
});
