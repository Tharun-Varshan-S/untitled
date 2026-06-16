import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function DashboardPage() {
  // Mock data for initial architecture layout
  const summary = {
    activeProjects: 4,
    totalLogs: 125043,
    errorCount: 342,
    throughput: '2.4k /s',
  };

  return (
    <div className="space-y-8">
      {/* ── Top Row ── */}
      <PageHeader 
        title="Overview" 
        description="Global system health and observability."
      >
        <div className="flex items-center gap-3">
          <select className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-md text-sm px-3 py-1.5 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--border-focus))]">
            <option>Last 15 minutes</option>
            <option>Last 1 hour</option>
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
          </select>
          <button className="btn-secondary !h-8 !px-3 gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </PageHeader>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Logs" 
          value={summary.totalLogs.toLocaleString()} 
          trend="12% vs last week" 
          trendDirection="up"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
        />
        <MetricCard 
          title="Error Rate" 
          value="0.27%" 
          trend="0.05% vs last week" 
          trendDirection="down"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard 
          title="Active Projects" 
          value={summary.activeProjects} 
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
        <MetricCard 
          title="Ingestion Throughput" 
          value={summary.throughput} 
          trend="Stable"
          trendDirection="neutral"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
      </div>

      {/* ── Charts Row (Placeholders) ── */}
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

      {/* ── Insights Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-premium p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent))/0.05] to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-[hsl(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            <h3 className="font-medium text-[hsl(var(--text-primary))]">AI Insights</h3>
          </div>
          <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed mb-4">
            Detected a 15% anomaly spike in <span className="text-[hsl(var(--text-primary))] font-medium">auth-service</span> 12 minutes ago. Correlates with a latency increase in <span className="text-[hsl(var(--text-primary))] font-medium">db-cluster-1</span>.
          </p>
          <button className="text-sm text-[hsl(var(--accent))] hover:underline flex items-center gap-1 font-medium">
            Investigate Root Cause
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="card-premium p-6 lg:col-span-2">
          <h3 className="font-medium text-[hsl(var(--text-primary))] mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {[
              { id: 1, msg: "Connection pool exhausted", service: "db-cluster", time: "2m ago", status: "error" as const },
              { id: 2, msg: "Rate limit threshold reached (85%)", service: "api-gateway", time: "15m ago", status: "warning" as const },
              { id: 3, msg: "Deployment successful", service: "frontend-app", time: "1h ago", status: "success" as const },
            ].map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border-subtle))] group transition-colors hover:border-[hsl(var(--border))]">
                <div className="flex items-center gap-3">
                  <StatusBadge status={alert.status} label={alert.status.charAt(0).toUpperCase() + alert.status.slice(1)} />
                  <p className="text-sm text-[hsl(var(--text-primary))]">{alert.msg}</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-xs font-mono text-[hsl(var(--text-muted))]">{alert.service}</span>
                   <span className="text-xs text-[hsl(var(--text-secondary))] w-12 text-right">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
