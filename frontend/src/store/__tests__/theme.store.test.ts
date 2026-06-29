import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../theme.store';

describe('useThemeStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useThemeStore.setState({ theme: 'dark' });
  });

  it('should have initial state theme as dark', () => {
    const { theme } = useThemeStore.getState();
    expect(theme).toBe('dark');
  });

  it('should set theme', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');

    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('should toggle theme', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});
