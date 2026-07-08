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

export interface SavedFilter {
  id: string;
  name: string;
  config: {
    query?: string;
    level?: string;
    service?: string;
    environment?: string;
    source?: string;
  };
}

export interface SearchState {
  query: string;
  level: string;
  service: string;
  environment: string;
  source: string;
  startDate: string | null;
  endDate: string | null;
}

export interface SearchStore extends SearchState {
  history: string[];
  savedFilters: SavedFilter[];
  
  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<Omit<SearchState, 'query'>>) => void;
  clearFilters: () => void;
  
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  
  saveFilter: (filter: Omit<SavedFilter, 'id'>) => void;
  removeSavedFilter: (id: string) => void;
  applySavedFilter: (filter: SavedFilter) => void;
}
