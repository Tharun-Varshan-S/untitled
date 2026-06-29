import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../project.store';

describe('useProjectStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useProjectStore.setState({ selectedProjectId: null, selectedProjectName: null });
  });

  it('should have initial state as null', () => {
    const { selectedProjectId, selectedProjectName } = useProjectStore.getState();
    expect(selectedProjectId).toBeNull();
    expect(selectedProjectName).toBeNull();
  });

  it('should set selected project', () => {
    useProjectStore.getState().setSelectedProject('proj_1', 'Acme App');
    const { selectedProjectId, selectedProjectName } = useProjectStore.getState();
    expect(selectedProjectId).toBe('proj_1');
    expect(selectedProjectName).toBe('Acme App');
  });

  it('should clear selected project', () => {
    useProjectStore.getState().setSelectedProject('proj_1', 'Acme App');
    useProjectStore.getState().clearSelectedProject();
    const { selectedProjectId, selectedProjectName } = useProjectStore.getState();
    expect(selectedProjectId).toBeNull();
    expect(selectedProjectName).toBeNull();
  });
});
