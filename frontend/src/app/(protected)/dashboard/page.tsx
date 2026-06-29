'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/lib/constants';
import { useProjects } from '@/hooks/useProjects';
import { useAnalyticsOverview } from '@/hooks/useAnalytics';

import { OverviewStats } from '@/features/dashboard/components/OverviewStats';
import { LogVolumeChart } from '@/features/dashboard/components/LogVolumeChart';
import { ErrorsByServiceChart } from '@/features/dashboard/components/ErrorsByServiceChart';
import { ProjectSummaryWidget } from '@/features/dashboard/components/ProjectSummaryWidget';

/**
 * Dashboard page — Client Component.
 * Uses React Query for data fetching.
 * Composed using Feature Widget Architecture (Phase L).
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
      <OverviewStats overview={overview} />

      {/* ── Charts Row (Recharts — Phase M) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LogVolumeChart />
        <ErrorsByServiceChart />
      </div>

      {/* ── Projects Summary Row ── */}
      <ProjectSummaryWidget projects={projects} />
    </div>
  );
}
