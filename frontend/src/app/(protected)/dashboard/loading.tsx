export default function Loading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse p-6">
      <div className="h-10 w-1/4 bg-[hsl(var(--surface-elevated))] rounded-md"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl"></div>
        <div className="h-32 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl"></div>
        <div className="h-32 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl"></div>
      </div>

      <div className="h-96 w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl"></div>
    </div>
  );
}
