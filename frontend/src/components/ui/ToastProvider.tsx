'use client';

import { useUIStore } from '@/store';
import { useEffect, useState } from 'react';

export function ToastProvider() {
  const notifications = useUIStore((state) => state.notifications);
  const removeNotification = useUIStore((state) => state.removeNotification);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((notification) => {
        const isSuccess = notification.type === 'success';
        const isError = notification.type === 'error';
        const isWarning = notification.type === 'warning';

        return (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg bg-[hsl(var(--surface-elevated))] animate-in slide-in-from-right-8 fade-in duration-300 ${
              isSuccess
                ? 'border-[hsl(var(--success))] text-[hsl(var(--success))]'
                : isError
                ? 'border-[hsl(var(--error))] text-[hsl(var(--error))]'
                : isWarning
                ? 'border-[hsl(var(--warning))] text-[hsl(var(--warning))]'
                : 'border-[hsl(var(--border))] text-[hsl(var(--text-primary))]'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              )}
              {isError && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              {isWarning && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
              {!isSuccess && !isError && !isWarning && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              <p className="text-xs mt-1 text-[hsl(var(--text-secondary))]">{notification.message}</p>
            </div>

            {/* Close button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="shrink-0 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
