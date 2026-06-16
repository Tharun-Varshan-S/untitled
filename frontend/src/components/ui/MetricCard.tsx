interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, trend, trendDirection = 'neutral', icon }: MetricCardProps) {
  return (
    <div className="card-premium p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[hsl(var(--text-secondary))]">{title}</h3>
        {icon && <div className="text-[hsl(var(--text-muted))]">{icon}</div>}
      </div>
      <div>
        <p className="text-2xl font-bold text-[hsl(var(--text-primary))]">{value}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
              trendDirection === 'up' ? 'text-[hsl(var(--success))] bg-[hsl(var(--success-bg))]' : 
              trendDirection === 'down' ? 'text-[hsl(var(--error))] bg-[hsl(var(--error-bg))]' : 
              'text-[hsl(var(--text-muted))] bg-[hsl(var(--surface-elevated))]'
            }`}>
              {trendDirection === 'up' && '↑ '}
              {trendDirection === 'down' && '↓ '}
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
