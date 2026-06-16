export function PageHeader({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--text-primary))]">{title}</h1>
        {description && (
          <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
