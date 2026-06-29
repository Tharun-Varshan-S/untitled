export interface ThemeStore {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export interface ProjectStore {
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  setSelectedProject: (id: string, name: string) => void;
  clearSelectedProject: () => void;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  createdAt: string;
}

export interface UIStore {
  sidebarOpen: boolean;
  notifications: Notification[];
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}
