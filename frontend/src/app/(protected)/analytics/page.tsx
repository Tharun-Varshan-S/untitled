import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function AnalyticsPage() {
  const summary = {
    totalLogs: 125043,
    errorLogs: 342,
    warningLogs: 1024,
    activeProjects: 4,
  };

  const topProjects = [
    { name: 'Production API', logs: 54000, errorRate: '0.22%', trend: 'up' },
    { name: 'Frontend Client', logs: 12000, errorRate: '0.12%', trend: 'stable' },
    { name: 'Auth Service', logs: 9800, errorRate: '0.05%', trend: 'down' },
    { name: 'Notification Worker', logs: 4200, errorRate: '0.01%', trend: 'stable' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics & Observability"
        description="System-wide metrics, error distribution, and log volume trends."
      >
        <div className="flex items-center gap-3">
          <select className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-md text-sm px-3 py-1.5 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--border-focus))]">
            <option>Last 15 minutes</option>
            <option>Last 1 hour</option>
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
          </select>
        </div>
      </PageHeader>

      {/* ── 1. Metrics Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Events" 
          value={summary.totalLogs.toLocaleString()} 
          trend="8.2% vs last period" 
          trendDirection="up"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
        />
        <MetricCard 
          title="Error Events" 
          value={summary.errorLogs} 
          trend="4.1% vs last period" 
          trendDirection="down"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard 
          title="Warning Events" 
          value={summary.warningLogs} 
          trend="1.5% vs last period" 
          trendDirection="up"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <MetricCard 
          title="Impacted Projects" 
          value={summary.activeProjects} 
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
      </div>

      {/* ── 2. Chart Containers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div id="log-volume-trend-chart" className="card-premium p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-medium text-[hsl(var(--text-primary))]">Global Event Volume</h3>
            <div className="flex gap-2">
               <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-secondary))]"><span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-1))]"></span>System A</span>
               <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-secondary))]"><span className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]"></span>System B</span>
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
          <h3 className="font-medium text-[hsl(var(--text-primary))] mb-6">Severity Distribution</h3>
          <div className="flex-1 min-h-[300px] flex items-center justify-center border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--surface-hover))]">
             <div className="text-center">
              <svg className="w-8 h-8 text-[hsl(var(--text-muted))] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              <p className="text-sm text-[hsl(var(--text-muted))]">Donut Chart (Phase M)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Row: Table & AI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-premium p-0 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[hsl(var(--border))]">
            <h3 className="font-medium text-[hsl(var(--text-primary))]">Top Services by Volume</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--surface-hover))]">
                <tr className="text-[hsl(var(--text-secondary))]">
                  <th className="text-left py-3 px-6 font-medium">Service</th>
                  <th className="text-right py-3 px-6 font-medium">Events</th>
                  <th className="text-right py-3 px-6 font-medium">Error Rate</th>
                  <th className="text-right py-3 px-6 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {topProjects.map((p) => (
                  <tr key={p.name} className="hover:bg-[hsl(var(--surface-hover))] transition-colors">
                    <td className="py-3 px-6 font-medium text-[hsl(var(--text-primary))]">{p.name}</td>
                    <td className="py-3 px-6 text-right font-mono text-[hsl(var(--text-secondary))]">{p.logs.toLocaleString()}</td>
                    <td className="py-3 px-6 text-right font-mono">
                      <span className={parseFloat(p.errorRate) > 0.1 ? 'text-[hsl(var(--error))]' : 'text-[hsl(var(--text-secondary))]'}>
                        {p.errorRate}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      {p.trend === 'up' && <StatusBadge status="error" label="↑ Rising" />}
                      {p.trend === 'down' && <StatusBadge status="success" label="↓ Falling" />}
                      {p.trend === 'stable' && <StatusBadge status="neutral" label="→ Stable" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              LogLens AI is analyzing your telemetry data. Currently establishing baselines for 4 services.
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
