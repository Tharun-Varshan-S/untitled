import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES } from '@/lib/constants';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function ProjectsPage() {
  // Mock projects
  const projects = [
    { _id: '1', name: 'Production API', status: 'active', env: 'production', framework: 'Node.js', stats: { totalLogs: 54000, errorCount: 120, lastActivity: '2 mins ago', health: 98 } },
    { _id: '2', name: 'Frontend Client', status: 'active', env: 'production', framework: 'Next.js', stats: { totalLogs: 12000, errorCount: 15, lastActivity: '1 hr ago', health: 100 } },
    { _id: '3', name: 'Payment Worker', status: 'warning', env: 'staging', framework: 'Python', stats: { totalLogs: 8400, errorCount: 342, lastActivity: '5 mins ago', health: 82 } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projects" 
        description="Manage your monitored applications and services."
      >
        <button className="btn-primary gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Project
        </button>
      </PageHeader>

      <div className="card-premium overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-[hsl(var(--border))] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[hsl(var(--surface-hover))]">
           <div className="relative w-full max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Find a project..." 
                className="input-premium pl-9 h-9"
              />
           </div>
           <div className="flex items-center gap-2">
              <button className="btn-secondary !h-9 text-xs">
                Environment: All
              </button>
              <button className="btn-secondary !h-9 text-xs">
                Sort: Last Active
              </button>
           </div>
        </div>

        {/* Project List */}
        <div className="divide-y divide-[hsl(var(--border))]">
          {projects.map((project) => (
            <div key={project._id} className="p-5 hover:bg-[hsl(var(--surface-hover))] transition-colors group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <Link href={`${ROUTES.PROJECTS}/${project._id}`} className="text-lg font-semibold text-[hsl(var(--text-primary))] hover:text-[hsl(var(--accent))] hover:underline transition-colors truncate">
                    {project.name}
                  </Link>
                  <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))]">
                    {project.env}
                  </span>
                  {project.status === 'warning' ? (
                     <StatusBadge status="warning" label="Degraded" />
                  ) : (
                     <StatusBadge status="success" label="Healthy" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-[hsl(var(--text-muted))] mt-2">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    {project.framework}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Updated {project.stats.lastActivity}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8 sm:pr-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-[hsl(var(--text-primary))]">{project.stats.totalLogs.toLocaleString()}</p>
                  <p className="text-xs text-[hsl(var(--text-muted))]">Events/24h</p>
                </div>
                <div className="hidden lg:block w-24">
                   <div className="flex justify-between text-xs mb-1">
                      <span className="text-[hsl(var(--text-secondary))]">Health</span>
                      <span className={project.stats.health < 90 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]'}>{project.stats.health}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-[hsl(var(--surface-elevated))] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${project.stats.health < 90 ? 'bg-[hsl(var(--warning))]' : 'bg-[hsl(var(--success))]'}`} 
                        style={{ width: `${project.stats.health}%` }}
                      />
                   </div>
                </div>
                <div className="flex gap-2">
                   <Link href={`${ROUTES.PROJECTS}/${project._id}`} className="btn-secondary !h-8 !px-3 text-xs">
                     View
                   </Link>
                   <button className="btn-ghost !h-8 !px-2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                   </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
