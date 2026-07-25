import React, { useState } from 'react';
import { useSearchStore, useProjectStore } from '@/store';
import { useSearchLogs } from '@/hooks/useSearch';
import { LogResultItem } from './LogResultItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function SearchResults() {
  const store = useSearchStore();
  const projectId = useProjectStore((state) => state.selectedProjectId);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Page-by-page display limit

  const {
    data,
    isFetching,
    status,
    error
  } = useSearchLogs({
    projectId: projectId || '',
    q: store.query,
    level: store.level,
    service: store.service,
    environment: store.environment,
    source: store.source,
    limit: 50
  });

  if (!projectId) {
    return (
      <EmptyState 
        title="No Project Selected"
        description="Please select a project to search logs."
      />
    );
  }

  if (status === 'pending') {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 border-b border-[hsl(var(--border))] animate-pulse flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-5 w-16 bg-[hsl(var(--surface-hover))] rounded"></div>
              <div className="h-4 w-32 bg-[hsl(var(--surface-hover))] rounded"></div>
            </div>
            <div className="h-4 w-3/4 bg-[hsl(var(--surface-hover))] rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return <ErrorState message={error instanceof Error ? error.message : 'Failed to search logs'} />;
  }

  const allLogs = data?.pages.flatMap(page => page?.logs || page?.results || []).filter(Boolean) || [];
  const totalLogs = allLogs.length;
  const totalPages = Math.ceil(totalLogs / pageSize) || 1;

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const displayedLogs = allLogs.slice(startIndex, startIndex + pageSize);

  if (totalLogs === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--surface-hover))] h-[400px]">
        <Search className="w-12 h-12 text-[hsl(var(--text-muted))] mb-4" />
        <h3 className="text-lg font-medium text-[hsl(var(--text-primary))] mb-2">No logs found</h3>
        <p className="text-sm text-[hsl(var(--text-muted))] max-w-md">
          No logs match your current search criteria. Try adjusting your query or removing some filters.
        </p>
        {(store.query || store.level || store.service) && (
          <button 
            onClick={store.clearFilters}
            className="mt-6 btn-secondary text-sm"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card-premium overflow-hidden flex flex-col">
      <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-hover))] flex justify-between items-center">
        <h3 className="font-medium text-[hsl(var(--text-primary))] flex items-center gap-2">
          Search Results
          {isFetching && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[hsl(var(--accent))] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--accent))]"></span>
            </span>
          )}
        </h3>
        <span className="text-xs text-[hsl(var(--text-muted))] font-mono">
          Showing {startIndex + 1} - {Math.min(startIndex + pageSize, totalLogs)} of {totalLogs} logs
        </span>
      </div>
      
      <div className="flex flex-col divide-y divide-[hsl(var(--border))]">
        {displayedLogs.map((log, index) => (
          <LogResultItem key={log?._id || log?.id || index} log={log} searchQuery={store.query} />
        ))}
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
    </div>
  );
}
