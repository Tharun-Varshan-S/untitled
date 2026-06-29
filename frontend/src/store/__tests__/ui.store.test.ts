import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '../ui.store';

// Mock UUID so tests are predictable
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}));

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: false, notifications: [] });
  });

  describe('Sidebar actions', () => {
    it('should open sidebar', () => {
      useUIStore.getState().openSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should close sidebar', () => {
      useUIStore.setState({ sidebarOpen: true });
      useUIStore.getState().closeSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it('should toggle sidebar', () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('Notification actions', () => {
    it('should add notification', () => {
      useUIStore.getState().addNotification({
        title: 'Success',
        message: 'Project created',
        type: 'success',
      });

      const { notifications } = useUIStore.getState();
      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toBe('Success');
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].id).toBe('mock-uuid-1234');
      expect(notifications[0].createdAt).toBeDefined();
    });

    it('should remove notification', () => {
      useUIStore.getState().addNotification({
        title: 'Error',
        message: 'Failed to delete',
        type: 'error',
      });
      
      let { notifications } = useUIStore.getState();
      expect(notifications.length).toBe(1);

      useUIStore.getState().removeNotification('mock-uuid-1234');
      
      notifications = useUIStore.getState().notifications;
      expect(notifications.length).toBe(0);
    });

    it('should clear notifications', () => {
      useUIStore.getState().addNotification({ title: '1', message: '1', type: 'info' });
      useUIStore.getState().addNotification({ title: '2', message: '2', type: 'info' });
      
      expect(useUIStore.getState().notifications.length).toBe(2);

      useUIStore.getState().clearNotifications();
      expect(useUIStore.getState().notifications.length).toBe(0);
    });
  });
});
