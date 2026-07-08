import { useState, useEffect, useRef } from 'react';
import { useSearchStore } from '@/store';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Clock, X } from 'lucide-react';

export function SearchBar() {
  const storeQuery = useSearchStore((state) => state.query);
  const setQuery = useSearchStore((state) => state.setQuery);
  const history = useSearchStore((state) => state.history);
  const addToHistory = useSearchStore((state) => state.addToHistory);
  const clearHistory = useSearchStore((state) => state.clearHistory);

  const [localQuery, setLocalQuery] = useState(storeQuery);
  const [showHistory, setShowHistory] = useState(false);
  const debouncedQuery = useDebounce(localQuery, 500);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external changes (e.g. from saved filter application) to local state
  useEffect(() => {
    setLocalQuery(storeQuery);
  }, [storeQuery]);

  // Sync debounced local state to store
  useEffect(() => {
    if (debouncedQuery !== storeQuery) {
      setQuery(debouncedQuery);
    }
  }, [debouncedQuery, setQuery, storeQuery]);

  // Handle clicking outside to close history
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addToHistory(localQuery);
      setShowHistory(false);
    }
  };

  const selectHistoryItem = (item: string) => {
    setLocalQuery(item);
    addToHistory(item);
    setShowHistory(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 w-5 h-5 text-[hsl(var(--text-muted))]" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={() => setShowHistory(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search logs via full-text index..."
          className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg h-11 pl-10 pr-10 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--border-focus))] transition-shadow shadow-sm"
        />
        {localQuery && (
          <button
            onClick={() => setLocalQuery('')}
            className="absolute right-3 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showHistory && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--surface-hover))]">
            <span className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">Recent Searches</span>
            <button onClick={clearHistory} className="text-xs text-[hsl(var(--accent))] hover:underline">
              Clear All
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {history.map((item, i) => (
              <li key={i}>
                <button
                  onClick={() => selectHistoryItem(item)}
                  className="w-full text-left px-4 py-2 text-sm text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))] transition-colors flex items-center gap-3"
                >
                  <Clock className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                  <span className="truncate">{item}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
