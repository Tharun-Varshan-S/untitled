import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/api/search.api';
import { LogDetailPanel } from './LogDetailPanel';
import { LogResponse } from '@/types/search.types';
import { LogEntry } from '@/services/socket/types';
import { useLogStream } from '@/hooks/useLogStream';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LogTableProps {
  projectId: string;
}

export const LogTable: React.FC<LogTableProps> = ({ projectId }) => {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // Show 12 logs per page cleanly without infinite scrolling

  // Fetch initial logs (most recent 50) and auto-refetch every 3s as fallback
  const { data, isLoading, error } = useQuery({
    queryKey: ['logs', projectId],
    queryFn: () => searchApi.searchLogs({ projectId, limit: 50 }),
    enabled: !!projectId,
    refetchInterval: 3000,
  });

  // Subscribe to real-time updates
  useLogStream(projectId);

  if (isLoading) {
    return (
      <div className="card-premium flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[hsl(var(--accent))] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[hsl(var(--text-muted))]">Loading log stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-premium p-6 min-h-[300px] flex items-center justify-center">
        <p className="text-sm text-[hsl(var(--error))]">Failed to load logs.</p>
      </div>
    );
  }

  const logs = (data as any)?.results || data?.logs || [];
  const validLogs = logs.filter(Boolean);
  const totalLogs = validLogs.length;
  const totalPages = Math.ceil(totalLogs / pageSize) || 1;

  // Ensure current page stays within bounds when new logs arrive
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const displayedLogs = validLogs.slice(startIndex, startIndex + pageSize);

  return (
    <>
      <div className="card-premium overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--surface-hover))]">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-[hsl(var(--text-primary))]">Live Log Stream</h3>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--success))/0.1] text-[hsl(var(--success))] text-xs font-medium border border-[hsl(var(--success))/0.2]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]"></span>
              </span>
              Connected
            </span>
          </div>
          {totalLogs > 0 && (
            <span className="text-xs text-[hsl(var(--text-muted))] font-mono">
              Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalLogs)} of {totalLogs} logs
            </span>
          )}
        </div>
        
        {totalLogs === 0 ? (
          <div className="p-6 min-h-[300px] flex items-center justify-center flex-col gap-2">
            <svg className="w-8 h-8 text-[hsl(var(--text-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-[hsl(var(--text-muted))] text-sm">No logs recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[hsl(var(--surface-primary))] border-b border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] text-xs uppercase font-medium">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Level</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4 w-full">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))] font-mono">
                  {displayedLogs.map((log: LogResponse, index: number) => {
                    const level = log?.level?.toLowerCase() || 'info';
                    let rowStyle = 'hover:bg-[hsl(var(--surface-hover))] cursor-pointer transition-colors';
                    let badgeStyle = '';
                    
                    if (level === 'fatal') {
                      rowStyle = 'bg-red-950/20 hover:bg-red-950/40 cursor-pointer transition-colors border-l-2 border-l-red-500';
                      badgeStyle = 'bg-red-900/30 text-red-500 border-red-500/30';
                    } else if (level === 'error') {
                      rowStyle = 'bg-[hsl(var(--error))/0.02] hover:bg-[hsl(var(--error))/0.08] cursor-pointer transition-colors border-l-2 border-l-[hsl(var(--error))]';
                      badgeStyle = 'bg-[hsl(var(--error))/0.1] text-[hsl(var(--error))] border-[hsl(var(--error))/0.2]';
                    } else if (level === 'warn') {
                      badgeStyle = 'bg-[hsl(var(--warning))/0.1] text-[hsl(var(--warning))] border-[hsl(var(--warning))/0.2]';
                    } else if (level === 'debug') {
                      badgeStyle = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                    } else {
                      badgeStyle = 'bg-[hsl(var(--info))/0.1] text-[hsl(var(--info))] border-[hsl(var(--info))/0.2]';
                    }

                    return (
                      <tr key={log?._id || log?.id || index} className={rowStyle} onClick={() => setSelectedLog(log as any)}>
                        <td className="px-6 py-3 whitespace-nowrap text-[hsl(var(--text-secondary))] text-xs">
                          {log?.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${badgeStyle}`}>
                            {level}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-[hsl(var(--text-primary))] text-xs">
                          {log.service}
                        </td>
                        <td className="px-6 py-3 text-[hsl(var(--text-secondary))] truncate max-w-md text-xs">
                          {typeof log.message === 'object' ? JSON.stringify(log.message) : String(log.message || '')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Page-by-Page Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-hover))] flex items-center justify-between">
                <p className="text-xs text-[hsl(var(--text-muted))]">
                  Page <span className="font-semibold text-[hsl(var(--text-primary))]">{safePage}</span> of{' '}
                  <span className="font-semibold text-[hsl(var(--text-primary))]">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded border border-[hsl(var(--border))] text-xs text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface))] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded border border-[hsl(var(--border))] text-xs text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface))] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <LogDetailPanel 
        log={selectedLog} 
        onClose={() => setSelectedLog(null)} 
      />
    </>
  );
};
