import { create } from 'zustand';
import { notificationsApi } from '@/api/endpoints';
import type { Notification } from '@/types/notification';

interface NotificationsState {
  items: Notification[];
  loading: boolean;
  panelOpen: boolean;

  fetchAll: () => Promise<void>;
  openPanel: () => void;
  closePanel: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;

  /** Derived */
  unreadCount: () => number;
  hasUnread: () => boolean;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  loading: false,
  panelOpen: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const items = await notificationsApi.list();
      set({ items });
    } catch {
      // silent — bell just shows no notifications
    } finally {
      set({ loading: false });
    }
  },

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  markRead: async (id) => {
    // Optimistic update
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    try {
      await notificationsApi.markRead(id);
    } catch {
      // revert on failure
      set((s) => ({
        items: s.items.map((n) => (n.id === id ? { ...n, read: false } : n)),
      }));
    }
  },

  markAllRead: async () => {
    const previous = get().items;
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read: true })),
    }));
    try {
      await notificationsApi.markAllRead();
    } catch {
      set({ items: previous });
    }
  },

  unreadCount: () => get().items.filter((n) => !n.read).length,
  hasUnread: () => get().items.some((n) => !n.read),
}));