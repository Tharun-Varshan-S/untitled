import React, { useEffect } from 'react';
import { useSearchStore, useProjectStore } from '@/store';
import { useSearchLogs } from '@/hooks/useSearch';
import { LogResultItem } from './LogResultItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Search } from 'lucide-react';

export function SearchResults() {
  const store = useSearchStore();
  const projectId = useProjectStore((state) => state.selectedProjectId);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
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

  // Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!projectId) {
    return (
      <EmptyState 
        title="No Project Selected"
        description="Please select a project to search logs."
      />
    );
  }

  if (status === 'pending' && !isFetchingNextPage) {
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

  const allLogs = data?.pages.flatMap(page => page.logs) || [];

  if (allLogs.length === 0) {
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
    <div className="card-premium overflow-hidden">
      <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-hover))] flex justify-between items-center">
        <h3 className="font-medium text-[hsl(var(--text-primary))] flex items-center gap-2">
          Search Results
          {isFetching && !isFetchingNextPage && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[hsl(var(--accent))] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--accent))]"></span>
            </span>
          )}
        </h3>
        <span className="text-xs text-[hsl(var(--text-muted))] font-mono">
          {data?.pages[0]?.totalStats?.totalMatches !== undefined 
            ? `${data.pages[0].totalStats.totalMatches.toLocaleString()}+ matched` 
            : `${allLogs.length} logs loaded`}
        </span>
      </div>
      
      <div className="flex flex-col">
        {allLogs.map((log) => (
          <LogResultItem key={log._id} log={log} searchQuery={store.query} />
        ))}
      </div>

      {isFetchingNextPage && (
        <div className="p-4 flex justify-center items-center">
          <div className="h-5 w-5 border-2 border-[hsl(var(--accent))] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {!hasNextPage && allLogs.length > 0 && (
        <div className="p-6 text-center text-xs text-[hsl(var(--text-muted))]">
          End of search results
        </div>
      )}
    </div>
  );
}
