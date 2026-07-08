import { useMemo } from 'react';
import { LogResponse } from '@/types/search.types';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface LogResultItemProps {
  log: LogResponse;
  searchQuery: string;
}

export function LogResultItem({ log, searchQuery }: LogResultItemProps) {
  // Highlight search terms purely on the frontend
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-[hsl(var(--accent))] text-white px-0.5 rounded font-medium">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  const getStatusType = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
      case 'critical':
      case 'fatal':
        return 'error';
      case 'warn':
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="p-4 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-hover))] transition-colors group">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={getStatusType(log.level)} label={log.level.toUpperCase()} />
            <span className="text-xs font-mono text-[hsl(var(--text-muted))]">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {log.service && (
              <span className="px-2 py-0.5 rounded bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))]">
                svc: {log.service}
              </span>
            )}
            {log.environment && (
              <span className="px-2 py-0.5 rounded bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))]">
                env: {log.environment}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm font-mono text-[hsl(var(--text-primary))] break-words mt-1 leading-relaxed">
          {highlightText(log.message, searchQuery)}
        </p>

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="mt-2 text-xs font-mono text-[hsl(var(--text-muted))] bg-[hsl(var(--surface))] p-2 rounded border border-[hsl(var(--border))] overflow-x-auto">
            {JSON.stringify(log.metadata, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
}
