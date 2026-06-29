import React from 'react';

export const LoadingChart = React.memo(() => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--surface-elevated))]/50 rounded-lg animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[hsl(var(--accent))] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[hsl(var(--text-muted))] font-medium">Loading data...</p>
      </div>
    </div>
  );
});
LoadingChart.displayName = 'LoadingChart';
