import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { WorkspaceStore } from './types';

export const useWorkspaceStore = create<WorkspaceStore>()(
  devtools(
    persist(
      (set) => ({
        selectedWorkspaceId: null,
        selectedWorkspaceName: null,
        setSelectedWorkspace: (id, name) =>
          set({ selectedWorkspaceId: id, selectedWorkspaceName: name }, false, 'workspace/setSelectedWorkspace'),
        clearSelectedWorkspace: () =>
          set({ selectedWorkspaceId: null, selectedWorkspaceName: null }, false, 'workspace/clearSelectedWorkspace'),
      }),
      { name: 'loglens_workspace_storage' }
    ),
    { name: 'WorkspaceStore' }
  )
);
