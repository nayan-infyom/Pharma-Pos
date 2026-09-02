import { create } from 'zustand';
import { Employee } from '../types';
import { initialEmployees } from '../data/employees';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface AppState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  globalSearchOpen: boolean;
  quickActionOpen: boolean;
  shortcutsModalOpen: boolean;
  currentStore: string;
  currentUser: Employee;
  toasts: ToastMessage[];

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setQuickActionOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setCurrentStore: (storeName: string) => void;
  setCurrentUser: (user: Employee) => void;

  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  globalSearchOpen: false,
  quickActionOpen: false,
  shortcutsModalOpen: false,
  currentStore: 'Apex Care - Main Galleria',
  currentUser: initialEmployees[0], // Admin
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
  setGlobalSearchOpen: (globalSearchOpen) => set({ globalSearchOpen }),
  setQuickActionOpen: (quickActionOpen) => set({ quickActionOpen }),
  setShortcutsModalOpen: (shortcutsModalOpen) => set({ shortcutsModalOpen }),
  setCurrentStore: (currentStore) => set({ currentStore }),
  setCurrentUser: (currentUser) => set({ currentUser }),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    const duration = toast.duration || 4000;
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}));
