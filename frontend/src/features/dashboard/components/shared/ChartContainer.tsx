import React from 'react';

interface ChartContainerProps {
  title: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartContainer = React.memo(({ title, legend, children, className = '' }: ChartContainerProps) => {
  return (
    <div className={`card-premium p-6 flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium text-[hsl(var(--text-primary))]">{title}</h3>
        {legend && <div className="flex gap-2">{legend}</div>}
      </div>
      <div className="flex-1 w-full min-h-[250px] relative">
        {children}
      </div>
    </div>
  );
});
ChartContainer.displayName = 'ChartContainer';
