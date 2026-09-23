'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { Activity, Shield, Zap, BarChart3, ChevronRight, Code2 } from 'lucide-react';
import { WordRotate } from '@/components/ui/word-rotate';
import { LogLensLogo } from '@/components/LogLensLogo';

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] selection:bg-[hsl(var(--accent))] selection:text-[hsl(var(--accent-foreground))] overflow-x-clip flex flex-col relative">

      {/* Hero Larger Distinct Blue Oval Shaped Background */}
      <div 
        className="absolute top-[260px] sm:top-[300px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98vw] max-w-[1200px] h-[420px] sm:h-[560px] md:h-[650px] rounded-[50%] pointer-events-none z-0 transition-all duration-500 blur-[50px] sm:blur-[75px]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.58) 0%, rgba(37, 99, 235, 0.38) 45%, rgba(29, 78, 216, 0.14) 75%, transparent 100%)'
        }}
      ></div>

      {/* Bright Core Oval Highlight */}
      <div 
        className="absolute top-[260px] sm:top-[300px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82vw] max-w-[850px] h-[260px] sm:h-[350px] rounded-[50%] pointer-events-none z-0 blur-[35px] opacity-80"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(96, 165, 250, 0.65) 0%, rgba(59, 130, 246, 0.38) 55%, transparent 90%)'
        }}
      ></div>

      {/* Sticky Fixed Floating Navbar */}
      <header className="fixed top-4 left-0 right-0 z-50 w-full max-w-6xl mx-auto px-4 sm:px-6 pointer-events-auto">
        <nav className="w-full h-14 rounded-2xl border border-blue-400/35 bg-blue-950/40 backdrop-blur-2xl shadow-lg shadow-blue-950/40 flex items-center justify-between px-6 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <LogLensLogo size="sm" />
            <span className="text-lg font-bold tracking-tight text-white">Loglens</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href={ROUTES.LOGIN} className="text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors">
              Sign In
            </Link>
            <Link href={ROUTES.REGISTER} className="btn-primary rounded-xl px-5 h-9 text-xs font-semibold uppercase tracking-wider shadow-md shadow-blue-500/20">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-24 sm:py-32 text-center">
        
        <h1 className="text-display max-w-5xl mx-auto mb-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight pb-1">
          <span className="inline-block w-[170px] sm:w-[215px] md:w-[255px] text-left align-bottom">
            <WordRotate 
              words={["Monitor", "Analyze", "Resolve"]} 
              duration={2500}
              className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500"
            />
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--text-primary))] via-white to-[hsl(var(--text-muted))]">
            your logs with absolute clarity
          </span>
        </h1>
        
        <p className="text-body text-[hsl(var(--text-secondary))] max-w-2xl mx-auto mb-10 text-lg sm:text-xl font-normal leading-relaxed">
          The ultimate unified logging and analytics platform. Monitor services in real-time, detect anomalies instantly, and resolve issues faster than ever before.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href={ROUTES.REGISTER} className="btn-primary w-full sm:w-auto rounded-full h-12 px-8 text-base font-semibold group shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
            Start Monitoring Now
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href={ROUTES.LOGIN} className="btn-secondary w-full sm:w-auto rounded-full h-12 px-8 text-base font-semibold border-[hsl(var(--border-subtle))] bg-[hsl(var(--background))]/50 backdrop-blur-sm hover:bg-[hsl(var(--surface-hover))]">
            View Dashboard
          </Link>
        </div>

        {/* Dashboard Preview Graphic */}
        <div className="mt-16 w-full max-w-5xl relative rounded-xl border border-blue-500/30 bg-[#090d16]/90 backdrop-blur-xl p-2 shadow-2xl shadow-blue-500/15">
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent z-10 pointer-events-none translate-y-2 rounded-xl"></div>
          
          <div className="w-full rounded-lg bg-[#0d1322] border border-blue-900/40 overflow-hidden flex flex-col relative text-left">
            {/* Console Window Top Header */}
            <div className="h-10 border-b border-blue-900/40 flex items-center justify-between px-4 bg-[#090d16]/90">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-xs font-mono text-slate-400 font-medium">LogLens Console &bull; live-stream</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE STREAM &bull; 1,420 logs/sec
                </span>
              </div>
            </div>

            {/* Quick Metrics Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-blue-900/30 bg-[#0b101c]/60">
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/20">
                <div className="text-[11px] text-slate-400 font-medium">Total Logs</div>
                <div className="text-base font-bold text-slate-100 font-mono">1,842,910</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/20">
                <div className="text-[11px] text-slate-400 font-medium">Ingest Latency</div>
                <div className="text-base font-bold text-emerald-400 font-mono">3.4 ms</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/20">
                <div className="text-[11px] text-slate-400 font-medium">Error Rate</div>
                <div className="text-base font-bold text-amber-400 font-mono">0.02%</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/20">
                <div className="text-[11px] text-slate-400 font-medium">Active Workers</div>
                <div className="text-base font-bold text-blue-400 font-mono">12 Nodes</div>
              </div>
            </div>

            {/* Live Log Stream Entries */}
            <div className="p-4 sm:p-5 font-mono text-xs space-y-2.5 bg-[#090d16] text-slate-300 overflow-x-auto">
              {/* Row 1 */}
              <div className="flex items-center gap-3 py-1.5 px-3 rounded bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/40 transition-colors">
                <span className="text-slate-500 shrink-0">22:05:14</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">INFO</span>
                <span className="text-slate-400 font-medium shrink-0">api-gateway</span>
                <span className="text-slate-200 truncate">POST /api/v1/logs/ingest 202 Accepted</span>
                <span className="ml-auto text-emerald-400 shrink-0">3.4ms</span>
              </div>
              
              {/* Row 2 */}
              <div className="flex items-center gap-3 py-1.5 px-3 rounded bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 transition-colors">
                <span className="text-slate-500 shrink-0">22:05:15</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">WARN</span>
                <span className="text-slate-400 font-medium shrink-0">payment-svc</span>
                <span className="text-amber-200 truncate">Stripe API connection timeout. Retrying request (1/3)</span>
                <span className="ml-auto text-amber-400 shrink-0">142ms</span>
              </div>

              {/* Row 3 */}
              <div className="flex items-center gap-3 py-1.5 px-3 rounded bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 transition-colors">
                <span className="text-slate-500 shrink-0">22:05:16</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">ERROR</span>
                <span className="text-slate-400 font-medium shrink-0">checkout-worker</span>
                <span className="text-red-200 truncate">Unhandled exception: PaymentFailedException (Cart #992)</span>
                <span className="ml-auto text-red-400 shrink-0">88ms</span>
              </div>

              {/* Row 4 */}
              <div className="flex items-center gap-3 py-1.5 px-3 rounded bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 transition-colors">
                <span className="text-slate-500 shrink-0">22:05:17</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">AI-DIAGNOSTIC</span>
                <span className="text-purple-400 font-medium shrink-0">loglens-ai</span>
                <span className="text-purple-200 font-semibold truncate">Root cause detected: Stripe Payment Gateway Latency Spike</span>
                <span className="ml-auto text-purple-400 font-semibold shrink-0">AI 98%</span>
              </div>

              {/* Row 5 */}
              <div className="flex items-center gap-3 py-1.5 px-3 rounded bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/40 transition-colors">
                <span className="text-slate-500 shrink-0">22:05:18</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">INFO</span>
                <span className="text-slate-400 font-medium shrink-0">socket-broadcaster</span>
                <span className="text-slate-200 truncate">Broadcasting live metrics event to 42 WebSocket clients</span>
                <span className="ml-auto text-emerald-400 shrink-0">1.2ms</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 bg-[hsl(var(--surface))]/50 border-t border-[hsl(var(--border-subtle))]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-heading mb-4">Everything you need to observe your stack</h2>
            <p className="text-[hsl(var(--text-secondary))] max-w-2xl mx-auto text-lg">
              Powerful tools built for modern engineering teams. No complex query languages required.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div 
                key={idx} 
                className="relative overflow-hidden rounded-xl border border-blue-900/30 bg-[#090d16] p-6 group cursor-pointer shadow-md transition-all duration-500"
              >
                {/* Expanding Blue Sphere Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 group-hover:scale-[65] transition-all duration-700 ease-out pointer-events-none z-0"></div>

                {/* Card Content Layer */}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 group-hover:bg-slate-950 group-hover:border-slate-950 group-hover:scale-105 transition-all duration-500">
                    <feature.icon className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white group-hover:text-slate-950 transition-colors duration-500">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-900 font-semibold transition-colors duration-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-blue-500/50 bg-[hsl(var(--background))]">
        <div className="w-full h-[1.5px] bg-gradient-to-r from-blue-600/30 via-blue-500 to-blue-600/30 shadow-[0_0_15px_rgba(59,130,246,0.7)]"></div>
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-[hsl(var(--text-secondary))]">
            <LogLensLogo size="sm" />
            <span className="font-semibold text-white">Loglens</span>
            <span className="text-sm ml-2">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-[hsl(var(--text-secondary))]">
            <Link href="#" className="hover:text-blue-400 transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-blue-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-blue-400 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: 'Real-time Streaming',
    description: 'Watch your logs stream in real-time via WebSockets. No need to refresh the page to see the latest events.',
    icon: Activity
  },
  {
    title: 'Advanced Filtering',
    description: 'Filter logs by service, severity, or date. Find exactly what you are looking for in seconds.',
    icon: BarChart3
  },
  {
    title: 'Secure & Compliant',
    description: 'Built with security from the ground up. Your operational data is encrypted in transit and at rest.',
    icon: Shield
  },
  {
    title: 'Lightning Fast',
    description: 'Optimized for speed. Process thousands of log entries per second without slowing down your browser.',
    icon: Zap
  },
  {
    title: 'Developer Friendly',
    description: 'Simple API integration. Start sending logs from your applications with just a few lines of code.',
    icon: Code2
  }
];
