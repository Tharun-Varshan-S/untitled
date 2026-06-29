import React from 'react';

interface EmptyChartProps {
  message?: string;
}

export const EmptyChart = React.memo(({ message = 'No data available' }: EmptyChartProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--surface-hover))]">
      <p className="text-sm text-[hsl(var(--text-muted))] font-medium">{message}</p>
    </div>
  );
});
EmptyChart.displayName = 'EmptyChart';
