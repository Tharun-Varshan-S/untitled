import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogDetailPanel } from '@/features/dashboard/components/LogDetailPanel';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('LogDetailPanel Component', () => {
  const mockOnClose = vi.fn();
  
  const baseLog = {
    id: 'log-123',
    projectId: 'proj-123',
    level: 'error',
    message: 'Test error message',
    service: 'auth-service',
    timestamp: '2023-10-01T12:00:00Z',
    createdAt: '2023-10-01T12:00:00Z',
    updatedAt: '2023-10-01T12:00:00Z',
  };

  const aiLog = {
    ...baseLog,
    aiAnalysis: {
      summary: 'Auth failed',
      rootCause: 'Invalid credentials',
      suggestedFix: 'Reset password',
      confidence: 0.95,
      severity: 'high',
      tags: ['auth']
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering logic', () => {
    it('1. should not render anything if log is null', () => {
      const { container } = render(<LogDetailPanel log={null} onClose={mockOnClose} />);
      expect(container.firstChild).toBeNull();
    });

    it('2. should render the panel if log is provided', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      expect(screen.getByText('Log Details')).toBeInTheDocument();
    });

    it('3. should display the correct log ID in the header', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      expect(screen.getByText(/ID: log-123/)).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('4. should display the log timestamp correctly formatted', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      const formattedDate = new Date(baseLog.timestamp).toLocaleString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('5. should fallback to createdAt if timestamp is missing', () => {
      const { timestamp, ...logWithoutTimestamp } = baseLog;
      render(<LogDetailPanel log={logWithoutTimestamp as any} onClose={mockOnClose} />);
      const formattedDate = new Date(baseLog.createdAt).toLocaleString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('6. should display the log severity level', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });

    it('7. should display the log service', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      expect(screen.getByText('auth-service')).toBeInTheDocument();
    });

    it('8. should display N/A if service is missing', () => {
      render(<LogDetailPanel log={{ ...baseLog, service: undefined } as any} onClose={mockOnClose} />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('9. should display the raw log message', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('10. should call onClose when clicking the close button', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      const buttons = screen.getAllByRole('button');
      // The close button is the first button usually
      fireEvent.click(buttons[0]);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('11. should copy JSON to clipboard when clicking "Copy JSON"', async () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      const copyBtn = screen.getByText('Copy JSON');
      fireEvent.click(copyBtn);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(baseLog, null, 2));
    });
  });

  describe('AI Analysis Section', () => {
    it('12. should display "Not yet analyzed" if aiAnalysis is missing', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      expect(screen.getByText('Not yet analyzed.')).toBeInTheDocument();
    });

    it('13. should display AI summary if present', () => {
      render(<LogDetailPanel log={aiLog as any} onClose={mockOnClose} />);
      expect(screen.getByText('Auth failed')).toBeInTheDocument();
    });

    it('14. should display AI root cause if present', () => {
      render(<LogDetailPanel log={aiLog as any} onClose={mockOnClose} />);
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('15. should display AI suggested fix if present', () => {
      render(<LogDetailPanel log={aiLog as any} onClose={mockOnClose} />);
      expect(screen.getByText('Reset password')).toBeInTheDocument();
    });

    it('16. should display AI confidence as percentage', () => {
      render(<LogDetailPanel log={aiLog as any} onClose={mockOnClose} />);
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('17. should display AI severity', () => {
      render(<LogDetailPanel log={aiLog as any} onClose={mockOnClose} />);
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });

  describe('Severity Styling', () => {
    it('18. should apply error styling for error logs', () => {
      render(<LogDetailPanel log={baseLog} onClose={mockOnClose} />);
      const span = screen.getByText('ERROR');
      expect(span.className).toContain('text-[hsl(var(--error))]');
    });

    it('19. should apply fatal styling for fatal logs', () => {
      render(<LogDetailPanel log={{ ...baseLog, level: 'fatal' }} onClose={mockOnClose} />);
      const span = screen.getByText('FATAL');
      expect(span.className).toContain('text-red-500');
    });

    it('20. should apply warning styling for warn logs', () => {
      render(<LogDetailPanel log={{ ...baseLog, level: 'warn' }} onClose={mockOnClose} />);
      const span = screen.getByText('WARN');
      expect(span.className).toContain('text-[hsl(var(--warning))]');
    });
  });
});
