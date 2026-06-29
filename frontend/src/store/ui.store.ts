import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { UIStore } from './types';

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      sidebarOpen: false,
      notifications: [],
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'ui/toggleSidebar'),
      openSidebar: () => set({ sidebarOpen: true }, false, 'ui/openSidebar'),
      closeSidebar: () => set({ sidebarOpen: false }, false, 'ui/closeSidebar'),
      addNotification: (notification) =>
        set(
          (state) => ({
            notifications: [
              ...state.notifications,
              {
                ...notification,
                id: uuidv4(),
                createdAt: new Date().toISOString(),
              },
            ],
          }),
          false,
          'ui/addNotification'
        ),
      removeNotification: (id) =>
        set(
          (state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }),
          false,
          'ui/removeNotification'
        ),
      clearNotifications: () => set({ notifications: [] }, false, 'ui/clearNotifications'),
    }),
    { name: 'UIStore' }
  )
);
