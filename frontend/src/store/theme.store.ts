import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ThemeStore } from './types';

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set) => ({
        theme: 'dark', // Default theme
        setTheme: (theme) => set({ theme }, false, 'theme/setTheme'),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }), false, 'theme/toggleTheme'),
      }),
      {
        name: 'loglens-theme',
      }
    ),
    { name: 'ThemeStore' }
  )
);
