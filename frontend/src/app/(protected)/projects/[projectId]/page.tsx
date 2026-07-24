'use client';

import { use } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/lib/constants';
import Link from 'next/link';
import { useProject } from '@/hooks/useProjects';
import { useAnalyticsOverview } from '@/hooks/useAnalytics';
import { useAnalyticsStream } from '@/hooks/useAnalyticsStream';
import { LogTable } from '@/features/dashboard/components/LogTable';

/**
 * Project detail page — Client Component.
 * Uses React Query for data fetching.
 */
export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  const { data: project, isLoading: isLoadingProject, error: projectError } = useProject(projectId);
  const { data: overview, isLoading: isLoadingOverview } = useAnalyticsOverview(projectId);

  useAnalyticsStream(projectId || undefined);

  const fetchError = projectError instanceof Error ? projectError.message : null;
  const isLoading = isLoadingProject || isLoadingOverview;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-24 bg-[hsl(var(--surface-hover))] rounded-lg"></div>
        <div className="h-32 bg-[hsl(var(--surface-hover))] rounded-lg"></div>
      </div>
    );
  }

  if (fetchError || !project) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href={ROUTES.PROJECTS} className="text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors">
            Projects
          </Link>
          <span className="text-[hsl(var(--text-muted))]">/</span>
          <span className="text-sm text-[hsl(var(--text-muted))]">—</span>
        </div>
        <ErrorState message={fetchError ?? 'Project not found.'} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href={ROUTES.PROJECTS} className="text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors">
          Projects
        </Link>
        <span className="text-[hsl(var(--text-muted))]">/</span>
        <span className="text-sm text-[hsl(var(--text-primary))] font-medium">{project.name}</span>
      </div>

      <PageHeader
        title={project.name}
        description={project.description || 'Project-specific metrics, API keys, and configuration.'}
      >
        <StatusBadge status="success" label="Active" />
        <Link href={ROUTES.SETTINGS} className="btn-secondary gap-2 flex items-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          Settings
        </Link>
      </PageHeader>

      {/* Metrics from /analytics/overview */}
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

      {/* Live Log Stream */}
      <LogTable projectId={projectId} />
    </div>
  );
}
