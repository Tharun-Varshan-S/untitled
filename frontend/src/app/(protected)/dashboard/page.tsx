'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/lib/constants';
import { useProjects } from '@/hooks/useProjects';
import { useAnalyticsOverview } from '@/hooks/useAnalytics';

/**
 * Dashboard page — Client Component.
 * Uses React Query for data fetching.
 */
export default function DashboardPage() {
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useProjects();
  
  const activeProject = projects.length > 0 ? projects[0] : null;
  const projectId = activeProject?.id || null;

  const { data: overview, isLoading: isLoadingOverview } = useAnalyticsOverview(projectId);

  const fetchError = projectsError instanceof Error ? projectsError.message : null;
  const isLoading = isLoadingProjects || isLoadingOverview;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-24 bg-[hsl(var(--surface-hover))] rounded-lg"></div>
        <div className="h-48 bg-[hsl(var(--surface-hover))] rounded-lg"></div>
        <div className="h-48 bg-[hsl(var(--surface-hover))] rounded-lg"></div>
      </div>
    );
  }

  // ── Error state ──
  if (fetchError) {
    return (
      <div className="space-y-8">
        <PageHeader title="Overview" description="Global system health and observability." />
        <ErrorState message={fetchError} />
      </div>
    );
  }

  // ── No projects yet ──
  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader title="Overview" description="Global system health and observability." />
        <EmptyState
          title="No projects yet"
          description="Create your first project to start seeing metrics on your dashboard."
          action={
            <Link href={ROUTES.PROJECTS} className="btn-primary">
              Go to Projects
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Top Row ── */}
      <PageHeader
        title="Overview"
        description={`Showing metrics for: ${activeProject!.name}`}
      >
        <div className="flex items-center gap-3">
          {/* Project switcher — Phase K will wire this to Zustand */}
          <Link
            href={ROUTES.PROJECTS}
            className="btn-secondary !h-8 !px-3 gap-2 text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            All Projects ({projects.length})
          </Link>
        </div>
      </PageHeader>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Logs"
          value={(overview?.totalLogs ?? 0).toLocaleString()}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
        />
        <MetricCard
          title="Errors"
          value={(overview?.totalErrors ?? 0).toLocaleString()}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          title="Warnings"
          value={(overview?.totalWarnings ?? 0).toLocaleString()}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <MetricCard
          title="Services"
          value={overview?.services ?? 0}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>}
        />
      </div>

      {/* ── Charts Row (Recharts — Phase M) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-premium p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-medium text-[hsl(var(--text-primary))]">Log Volume Trend</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-secondary))]"><span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))]"></span>Info</span>
              <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-secondary))]"><span className="w-2 h-2 rounded-full bg-[hsl(var(--error))]"></span>Error</span>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] flex items-center justify-center border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--surface-hover))]">
            <p className="text-sm text-[hsl(var(--text-muted))]">Recharts LineChart Container (Phase M)</p>
          </div>
        </div>

        <div className="card-premium p-6 flex flex-col">
          <h3 className="font-medium text-[hsl(var(--text-primary))] mb-6">Errors by Service</h3>
          <div className="flex-1 min-h-[250px] flex items-center justify-center border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--surface-hover))]">
            <p className="text-sm text-[hsl(var(--text-muted))]">Recharts DonutChart (Phase M)</p>
          </div>
        </div>
      </div>

      {/* ── Projects Summary Row ── */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-[hsl(var(--text-primary))]">Your Projects</h3>
          <Link href={ROUTES.PROJECTS} className="text-sm text-[hsl(var(--accent))] hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {projects.slice(0, 5).map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--border))] transition-colors"
            >
              <div className="flex items-center gap-3">
                <StatusBadge status="success" label="Active" />
                <Link
                  href={`${ROUTES.PROJECTS}/${project.id}`}
                  className="text-sm font-medium text-[hsl(var(--text-primary))] hover:text-[hsl(var(--accent))] transition-colors"
                >
                  {project.name}
                </Link>
              </div>
              <span className="text-xs text-[hsl(var(--text-muted))]">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
