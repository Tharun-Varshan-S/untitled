import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { SearchStore, SearchState } from './types';

const initialState: SearchState = {
  query: '',
  level: '',
  service: '',
  environment: '',
  source: '',
  startDate: null,
  endDate: null,
};

export const useSearchStore = create<SearchStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        history: [],
        savedFilters: [],

        setQuery: (query) => set({ query }, false, 'search/setQuery'),
        
        setFilters: (filters) => set({ ...filters }, false, 'search/setFilters'),
        
        clearFilters: () => set({ ...initialState, query: get().query }, false, 'search/clearFilters'),

        addToHistory: (query) => {
          if (!query.trim()) return;
          const currentHistory = get().history;
          const newHistory = [query, ...currentHistory.filter((q) => q !== query)].slice(0, 20);
          set({ history: newHistory }, false, 'search/addToHistory');
        },

        clearHistory: () => set({ history: [] }, false, 'search/clearHistory'),

        saveFilter: (filter) => {
          const newFilter = { ...filter, id: uuidv4() };
          set((state) => ({
            savedFilters: [...state.savedFilters, newFilter]
          }), false, 'search/saveFilter');
        },

        removeSavedFilter: (id) => {
          set((state) => ({
            savedFilters: state.savedFilters.filter((f) => f.id !== id)
          }), false, 'search/removeSavedFilter');
        },

        applySavedFilter: (filter) => {
          set({
            query: filter.config.query || '',
            level: filter.config.level || '',
            service: filter.config.service || '',
            environment: filter.config.environment || '',
            source: filter.config.source || '',
          }, false, 'search/applySavedFilter');
        }
      }),
      {
        name: 'loglens-search-storage',
        // Only persist history and saved filters
        partialize: (state) => ({
          history: state.history,
          savedFilters: state.savedFilters
        }),
      }
    ),
    { name: 'SearchStore' }
  )
);
