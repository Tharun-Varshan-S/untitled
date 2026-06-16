export function StatusBadge({ 
  status, 
  label 
}: { 
  status: 'success' | 'error' | 'warning' | 'info' | 'neutral'; 
  label: string;
}) {
  const styles = {
    success: 'bg-[hsl(var(--success-bg))] text-[hsl(var(--success))] border-[hsl(var(--success))/0.2]',
    error: 'bg-[hsl(var(--error-bg))] text-[hsl(var(--error))] border-[hsl(var(--error))/0.2]',
    warning: 'bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning))] border-[hsl(var(--warning))/0.2]',
    info: 'bg-[hsl(var(--info-bg))] text-[hsl(var(--info))] border-[hsl(var(--info))/0.2]',
    neutral: 'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))] border-[hsl(var(--border))]',
  };

  const dots = {
    success: 'bg-[hsl(var(--success))]',
    error: 'bg-[hsl(var(--error))]',
    warning: 'bg-[hsl(var(--warning))]',
    info: 'bg-[hsl(var(--info))]',
    neutral: 'bg-[hsl(var(--text-muted))]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`}></span>
      {label}
    </span>
  );
}
