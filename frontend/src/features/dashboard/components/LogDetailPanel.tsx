import React from 'react';
import { LogEntry } from '@/services/socket/types';

interface LogDetailPanelProps {
  log: LogEntry | null;
  onClose: () => void;
}

export const LogDetailPanel: React.FC<LogDetailPanelProps> = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-[hsl(var(--surface-primary))] border-l border-[hsl(var(--border))] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
          <div>
            <h2 className="text-lg font-medium text-[hsl(var(--text-primary))]">Log Details</h2>
            <p className="text-sm text-[hsl(var(--text-muted))]">ID: {log.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--surface-hover))] rounded-md text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wider">Timestamp</span>
              <p className="text-sm text-[hsl(var(--text-primary))] font-mono">
                {new Date(log.timestamp || log.createdAt).toLocaleString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wider">Severity</span>
              <p className="text-sm font-medium">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${
                  log.level === 'error' ? 'bg-[hsl(var(--error))/0.1] text-[hsl(var(--error))] border-[hsl(var(--error))/0.2]' :
                  log.level === 'fatal' ? 'bg-red-900/30 text-red-500 border-red-500/30' :
                  log.level === 'warn' ? 'bg-[hsl(var(--warning))/0.1] text-[hsl(var(--warning))] border-[hsl(var(--warning))/0.2]' :
                  log.level === 'debug' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                  'bg-[hsl(var(--info))/0.1] text-[hsl(var(--info))] border-[hsl(var(--info))/0.2]'
                }`}>
                  {log.level.toUpperCase()}
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wider">Service</span>
              <p className="text-sm text-[hsl(var(--text-primary))] font-mono">{log.service || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wider">Message</span>
            <div className="bg-[hsl(var(--surface-hover))] p-4 rounded-md border border-[hsl(var(--border))]">
              <p className="text-sm text-[hsl(var(--text-primary))] break-words">{log.message}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wider">Raw JSON</span>
              <button 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))}
                className="text-xs text-[hsl(var(--accent))] hover:underline"
              >
                Copy JSON
              </button>
            </div>
            <div className="bg-[#0D0D11] p-4 rounded-md border border-[hsl(var(--border))] overflow-x-auto">
              <pre className="text-xs text-[hsl(var(--text-secondary))] font-mono">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
