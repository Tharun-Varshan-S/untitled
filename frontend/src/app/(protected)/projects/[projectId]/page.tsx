import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/constants';
import Link from 'next/link';

export default async function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  // Mock data for Phase I layout
  const project = {
    _id: params.projectId,
    name: 'Production API',
    status: 'active',
    stats: {
      totalLogs: 54000,
      errorCount: 120,
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href={ROUTES.PROJECTS} className="text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors">
          Projects
        </Link>
        <span className="text-[hsl(var(--text-muted))]">/</span>
        <span className="text-sm text-[hsl(var(--text-primary))] font-medium">{project.name}</span>
      </div>

      <PageHeader 
        title={project.name}
        description="Project-specific metrics, API keys, and configuration."
      >
        <StatusBadge status="success" label="Healthy" />
        <button className="btn-secondary gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          Settings
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard title="Total Logs" value={project.stats.totalLogs.toLocaleString()} />
        <MetricCard title="Errors" value={project.stats.errorCount} trend="+12%" trendDirection="up" />
      </div>

      <div className="card-premium overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--surface-hover))]">
          <h3 className="font-medium text-[hsl(var(--text-primary))]">Live Log Stream</h3>
          <span className="flex items-center gap-2 text-xs font-mono text-[hsl(var(--success))] bg-[hsl(var(--success-bg))] px-2 py-1 rounded">
             <span className="relative flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]"></span>
             </span>
             Connected
          </span>
        </div>
        <div className="p-6 min-h-[400px] font-mono text-sm bg-[#000000] space-y-2">
          {/* Phase N: WebSocket Stream Placeholder */}
          <p className="text-[hsl(var(--text-muted))]">/* Live WebSocket stream connects here (Phase N) */</p>
          <div className="flex gap-4">
             <span className="text-[hsl(var(--text-muted))] w-32 shrink-0">14:02:45.102</span>
             <span className="text-[hsl(var(--info))] w-12 shrink-0">INFO</span>
             <span className="text-[hsl(var(--text-primary))]">Service initialized on port 8080</span>
          </div>
          <div className="flex gap-4">
             <span className="text-[hsl(var(--text-muted))] w-32 shrink-0">14:02:47.332</span>
             <span className="text-[hsl(var(--info))] w-12 shrink-0">INFO</span>
             <span className="text-[hsl(var(--text-primary))]">Connected to database cluster</span>
          </div>
          <div className="flex gap-4">
             <span className="text-[hsl(var(--text-muted))] w-32 shrink-0">14:05:12.991</span>
             <span className="text-[hsl(var(--error))] w-12 shrink-0">ERRO</span>
             <span className="text-[hsl(var(--error))]">Failed to authenticate tenant: invalid_token</span>
          </div>
        </div>
      </div>
    </div>
  );
}
