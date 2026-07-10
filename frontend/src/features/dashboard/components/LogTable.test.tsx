import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LogTable } from './LogTable';
import * as reactQuery from '@tanstack/react-query';
import * as useLogStreamHook from '@/hooks/useLogStream';

// Mock the hooks
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/hooks/useLogStream', () => ({
  useLogStream: vi.fn(),
}));

describe('LogTable Component', () => {
  const mockProjectId = 'test-project-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.spyOn(reactQuery, 'useQuery').mockReturnValue({
      isLoading: true,
      error: null,
      data: null,
    } as any);

    render(<LogTable projectId={mockProjectId} />);
    expect(screen.getByText(/Loading log stream/i)).toBeDefined();
  });

  it('renders error state', () => {
    vi.spyOn(reactQuery, 'useQuery').mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch'),
      data: null,
    } as any);

    render(<LogTable projectId={mockProjectId} />);
    expect(screen.getByText(/Failed to load logs/i)).toBeDefined();
  });

  it('renders empty state when no logs', () => {
    vi.spyOn(reactQuery, 'useQuery').mockReturnValue({
      isLoading: false,
      error: null,
      data: { logs: [] },
    } as any);

    render(<LogTable projectId={mockProjectId} />);
    expect(screen.getByText(/No logs recorded yet/i)).toBeDefined();
  });

  it('renders log rows with correct color coding', () => {
    const mockLogs = [
      { id: '1', level: 'fatal', message: 'Core dumped', service: 'auth', timestamp: new Date().toISOString() },
      { id: '2', level: 'error', message: 'DB disconnected', service: 'db', timestamp: new Date().toISOString() },
      { id: '3', level: 'info', message: 'User logged in', service: 'auth', timestamp: new Date().toISOString() },
    ];

    vi.spyOn(reactQuery, 'useQuery').mockReturnValue({
      isLoading: false,
      error: null,
      data: { logs: mockLogs },
    } as any);

    render(<LogTable projectId={mockProjectId} />);
    
    // Check if messages render
    expect(screen.getByText('Core dumped')).toBeDefined();
    expect(screen.getByText('DB disconnected')).toBeDefined();
    expect(screen.getByText('User logged in')).toBeDefined();

    // Check if useLogStream was called to subscribe to real-time events
    expect(useLogStreamHook.useLogStream).toHaveBeenCalledWith(mockProjectId);
  });
});
