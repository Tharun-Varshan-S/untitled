import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ProjectStore } from './types';

export const useProjectStore = create<ProjectStore>()(
  devtools(
    (set) => ({
      selectedProjectId: null,
      selectedProjectName: null,
      setSelectedProject: (id, name) => 
        set({ selectedProjectId: id, selectedProjectName: name }, false, 'project/setSelectedProject'),
      clearSelectedProject: () => 
        set({ selectedProjectId: null, selectedProjectName: null }, false, 'project/clearSelectedProject'),
    }),
    { name: 'ProjectStore' }
  )
);
