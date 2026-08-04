import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { Activity, Shield, Zap, BarChart3, ChevronRight, Eye, Code2 } from 'lucide-react';

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] selection:bg-[hsl(var(--accent))] selection:text-[hsl(var(--accent-foreground))] overflow-hidden flex flex-col relative">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[hsl(var(--accent))] rounded-full blur-[120px] opacity-15 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[hsl(var(--chart-2))] rounded-full blur-[100px] opacity-15 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="w-full relative z-10 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--background))]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--chart-2))] flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Loglens</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.LOGIN} className="text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors">
              Sign In
            </Link>
            <Link href={ROUTES.REGISTER} className="btn-primary rounded-full px-5 h-9">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-24 sm:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] text-sm font-medium text-[hsl(var(--text-secondary))] mb-8 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]"></span>
          </span>
          Loglens v2.0 is now live
        </div>
        
        <h1 className="text-display max-w-4xl mx-auto mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--text-primary))] to-[hsl(var(--text-muted))] pb-1">
          See Through Your Logs with Absolute Clarity
        </h1>
        
        <p className="text-body text-[hsl(var(--text-secondary))] max-w-2xl mx-auto mb-10 text-lg sm:text-xl">
          The ultimate unified logging and analytics platform. Monitor services in real-time, detect anomalies instantly, and resolve issues faster than ever before.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href={ROUTES.REGISTER} className="btn-primary w-full sm:w-auto rounded-full h-12 px-8 text-base group">
            Start Monitoring Now
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href={ROUTES.LOGIN} className="btn-secondary w-full sm:w-auto rounded-full h-12 px-8 text-base border-[hsl(var(--border-subtle))]">
            View Dashboard
          </Link>
        </div>

        {/* Dashboard Preview Graphic */}
        <div className="mt-20 w-full max-w-5xl relative rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]/50 backdrop-blur-sm p-2 shadow-2xl shadow-[hsl(var(--accent))]/10">
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-transparent z-10 pointer-events-none translate-y-2 rounded-xl"></div>
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border-subtle))] overflow-hidden flex flex-col relative">
            {/* Mock Header */}
            <div className="h-10 border-b border-[hsl(var(--border-subtle))] flex items-center px-4 gap-2 bg-[hsl(var(--surface))]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--error))]"></div>
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--warning))]"></div>
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--success))]"></div>
              </div>
            </div>
            {/* Mock Content */}
            <div className="flex-1 p-6 relative">
               <div className="flex flex-col gap-3">
                 {[75, 45, 90, 30].map((width, i) => (
                   <div key={i} className="flex gap-4 items-center">
                     <div className="w-24 h-4 rounded bg-[hsl(var(--border-subtle))]"></div>
                     <div className="flex-1 h-4 rounded bg-[hsl(var(--surface-hover))] overflow-hidden">
                       <div 
                         className="h-full rounded bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--chart-2))] opacity-80" 
                         style={{ width: `${width}%` }}
                       ></div>
                     </div>
                   </div>
                 ))}
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
              <div key={idx} className="card-premium card-premium-hover p-6 group">
                <div className="w-12 h-12 rounded-lg bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border-subtle))] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-[hsl(var(--accent))]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--background))]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-[hsl(var(--text-secondary))]">
            <Eye className="w-5 h-5" />
            <span className="font-semibold">Loglens</span>
            <span className="text-sm ml-2">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-[hsl(var(--text-secondary))]">
            <Link href="#" className="hover:text-[hsl(var(--text-primary))] transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-[hsl(var(--text-primary))] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[hsl(var(--text-primary))] transition-colors">Terms</Link>
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
