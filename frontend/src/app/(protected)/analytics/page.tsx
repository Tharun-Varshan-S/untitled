'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ROUTES } from '@/lib/constants';
import { useProjects } from '@/hooks/useProjects';
import { useAnalyticsOverview, useAnalyticsLogLevels, useAnalyticsServices } from '@/hooks/useAnalytics';
import { useAnalyticsStream } from '@/hooks/useAnalyticsStream';

/**
 * Analytics page — Client Component.
 * Uses React Query for data fetching.
 */
export default function AnalyticsPage() {
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useProjects();
  
  const activeProject = projects.length > 0 ? projects[0] : null;
  const projectId = activeProject?.id || null;

  const { data: overview, isLoading: isLoadingOverview } = useAnalyticsOverview(projectId);
  const { data: logLevels, isLoading: isLoadingLogLevels } = useAnalyticsLogLevels(projectId);
  const { data: services = [], isLoading: isLoadingServices } = useAnalyticsServices(projectId);

  useAnalyticsStream(projectId || undefined);

  const fetchError = projectsError instanceof Error ? projectsError.message : null;
  const isLoading = isLoadingProjects || isLoadingOverview || isLoadingLogLevels || isLoadingServices;

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
        <PageHeader title="Analytics & Observability" description="System-wide metrics, error distribution, and log volume trends." />
        <ErrorState message={fetchError} />
      </div>
    );
  }

  // ── No projects ──
  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader title="Analytics & Observability" description="System-wide metrics, error distribution, and log volume trends." />
        <EmptyState
          title="No projects to analyse"
          description="Create a project and ingest some logs to see analytics here."
          action={
            <Link href={ROUTES.PROJECTS} className="btn-primary">
              Go to Projects
            </Link>
          }
        />
      </div>
    );
  }

  const totalEvents = (overview?.totalLogs ?? 0);
  const errorPct = totalEvents > 0
    ? ((overview?.totalErrors ?? 0) / totalEvents * 100).toFixed(2) + '%'
    : '0.00%';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics & Observability"
        description={`Showing data for: ${activeProject!.name}`}
      >
        <Link href={ROUTES.PROJECTS} className="btn-secondary !h-8 !px-3 gap-2 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          Switch Project
        </Link>
      </PageHeader>

      {/* ── 1. Metrics Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Events"
          value={totalEvents.toLocaleString()}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
        />
        <MetricCard
          title="Error Events"
          value={(overview?.totalErrors ?? 0).toLocaleString()}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          title="Warning Events"
          value={(overview?.totalWarnings ?? 0).toLocaleString()}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <MetricCard
          title="Error Rate"
          value={errorPct}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      {/* ── 2. Chart Containers (Phase M) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="log-volume-trend-chart" className="card-premium p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-medium text-[hsl(var(--text-primary))]">Global Event Volume</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-secondary))]"><span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-1))]"></span>All</span>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] flex items-center justify-center border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--surface-hover))]">
            <div className="text-center">
              <svg className="w-8 h-8 text-[hsl(var(--text-muted))] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              <p className="text-sm text-[hsl(var(--text-muted))]">Interactive Time-Series Chart (Phase M)</p>
            </div>
          </div>
        </div>

        <div id="error-distribution-chart" className="card-premium p-6 flex flex-col">
          <h3 className="font-medium text-[hsl(var(--text-primary))] mb-4">Severity Distribution</h3>
          {/* Show real log-level counts as a simple breakdown until Phase M */}
          {logLevels && (
            <div className="space-y-3 mb-6">
              {[
                { label: 'Info', value: logLevels.info, color: 'hsl(var(--info))' },
                { label: 'Warn', value: logLevels.warn, color: 'hsl(var(--warning))' },
                { label: 'Error', value: logLevels.error, color: 'hsl(var(--error))' },
              ].map(({ label, value, color }) => {
                const total = logLevels.info + logLevels.warn + logLevels.error;
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[hsl(var(--text-secondary))]">{label}</span>
                      <span className="font-mono text-[hsl(var(--text-primary))]">{value.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[hsl(var(--surface-elevated))] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex-1 min-h-[180px] flex items-center justify-center border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--surface-hover))]">
            <p className="text-sm text-[hsl(var(--text-muted))]">Donut Chart (Phase M)</p>
          </div>
        </div>
      </div>

      {/* ── 3. Services Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-premium p-0 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[hsl(var(--border))]">
            <h3 className="font-medium text-[hsl(var(--text-primary))]">Top Services by Volume</h3>
          </div>
          {services.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-[hsl(var(--text-muted))]">No service data yet. Ingest logs with a <code className="font-mono text-xs bg-[hsl(var(--surface-elevated))] px-1 rounded">service</code> field to see breakdown.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--surface-hover))]">
                  <tr className="text-[hsl(var(--text-secondary))]">
                    <th className="text-left py-3 px-6 font-medium">Service</th>
                    <th className="text-right py-3 px-6 font-medium">Events</th>
                    <th className="text-right py-3 px-6 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {services.map((svc) => (
                    <tr key={svc.service} className="hover:bg-[hsl(var(--surface-hover))] transition-colors">
                      <td className="py-3 px-6 font-medium text-[hsl(var(--text-primary))]">{svc.service}</td>
                      <td className="py-3 px-6 text-right font-mono text-[hsl(var(--text-secondary))]">{svc.count.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right">
                        <StatusBadge status="neutral" label="Active" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── 4. AI Insights placeholder (Phase Q) ── */}
        <div id="ai-insights-panel" className="card-premium p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent))] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[hsl(var(--accent))]"></span>
            </div>
            <h3 className="font-medium text-[hsl(var(--text-primary))]">Pattern Recognition</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
              LogLens AI will analyse your telemetry data and establish baselines automatically.
            </p>
            <div className="p-3 bg-[hsl(var(--surface-hover))] rounded-md border border-[hsl(var(--border))]">
              <p className="text-xs font-mono text-[hsl(var(--text-muted))]">Phase Q Feature</p>
              <p className="text-sm text-[hsl(var(--text-primary))] mt-1">Automated anomaly detection and RCA summaries will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
