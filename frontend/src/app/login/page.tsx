'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/lib/constants';

/**
 * Isolated component that reads useSearchParams().
 * Must be wrapped in <Suspense> at the page level — Next.js requirement
 * for any component that calls useSearchParams() during static generation.
 */
function RegisteredBanner() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';

  if (!justRegistered) return null;

  return (
    <div className="p-3 bg-[hsl(var(--success-bg))] border border-[hsl(var(--success))/0.2] text-[hsl(var(--success))] text-sm rounded-md flex items-start gap-2">
      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
      Account created! Sign in below to continue.
    </div>
  );
}

/**
 * Handles the ?token= query parameter after successful OAuth login.
 */
function OAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      authService.setToken(token);
      router.push(ROUTES.DASHBOARD);
    }
  }, [searchParams, router]);

  const error = searchParams.get('error');
  if (!error) return null;

  return (
    <div className="p-3 bg-[hsl(var(--error-bg))] border border-[hsl(var(--error))/0.2] text-[hsl(var(--error))] text-sm rounded-md flex items-start gap-2 mb-4">
      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Authentication with provider failed. Please try again.
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] overflow-hidden">
      {/* ── Left Side: Brand & Value Prop ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-12 relative overflow-hidden">
        {/* Subtle background gradient / grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-8 h-8 bg-[hsl(var(--accent))] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 6h16v2H4v-2zm0 4h16v2H4v-2z"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">LogLens</span>
          </div>

          <h1 className="text-display mb-6">
            Intelligent <br />
            <span className="text-[hsl(var(--text-secondary))]">Observability</span>
          </h1>
          <p className="text-body text-[hsl(var(--text-secondary))] max-w-md text-lg">
            Production-grade logging, real-time analytics, and AI-powered insights for modern engineering teams.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center border border-[hsl(var(--border))]">
                <svg className="w-5 h-5 text-[hsl(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <p className="font-medium text-[hsl(var(--text-primary))]">Real-time Ingestion</p>
                <p className="text-sm text-[hsl(var(--text-secondary))]">Process millions of events per second.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center border border-[hsl(var(--border))]">
                <svg className="w-5 h-5 text-[hsl(var(--chart-2))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <div>
                <p className="font-medium text-[hsl(var(--text-primary))]">Advanced Analytics</p>
                <p className="text-sm text-[hsl(var(--text-secondary))]">Interactive dashboards and trend analysis.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center border border-[hsl(var(--border))]">
                <svg className="w-5 h-5 text-[hsl(var(--chart-3))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <div>
                <p className="font-medium text-[hsl(var(--text-primary))]">AI Root Cause (Phase Q)</p>
                <p className="text-sm text-[hsl(var(--text-secondary))]">Automated anomaly detection and summaries.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract code/dashboard mockup snippet */}
        <div className="relative z-10 w-full mt-12 bg-[#0C0C0C] rounded-xl border border-[hsl(var(--border))] p-4 shadow-2xl opacity-80 transform rotate-1 hover:rotate-0 transition-transform duration-500">
            <div className="flex gap-2 mb-3">
               <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="font-mono text-xs text-[hsl(var(--text-muted))] space-y-1">
                <p><span className="text-[hsl(var(--accent))]">INFO</span> [api-gateway] Request processed in 24ms</p>
                <p><span className="text-[hsl(var(--warning))]">WARN</span> [auth-svc] Rate limit approaching for tenant-492</p>
                <p><span className="text-[hsl(var(--error))]">ERRO</span> [db-cluster] Connection pool exhausted</p>
                <p><span className="text-[hsl(var(--accent))]">INFO</span> [db-cluster] Auto-scaling initiated...</p>
            </div>
        </div>
      </div>

      {/* ── Right Side: Login Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-8 h-8 bg-[hsl(var(--accent))] rounded-lg flex items-center justify-center">
               <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 6h16v2H4v-2zm0 4h16v2H4v-2z"/>
              </svg>
            </div>
            <span className="text-xl font-bold">LogLens</span>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Sign in to LogLens</h2>
            <p className="text-sm text-[hsl(var(--text-secondary))]">
              Enter your email below to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Suspense required — useSearchParams is read inside RegisteredBanner */}
            <Suspense fallback={null}>
              <RegisteredBanner />
              <OAuthCallbackHandler />
            </Suspense>
            {error && (
              <div className="p-3 bg-[hsl(var(--error-bg))] border border-[hsl(var(--error))/0.2] text-[hsl(var(--error))] text-sm rounded-md flex items-start gap-2">
                 <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Password
                  </label>
                  <Link href="#" className="text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium pr-10"
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* SSO / Social Placeholders */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[hsl(var(--border))]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[hsl(var(--background))] px-2 text-[hsl(var(--text-muted))]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button 
                 type="button" 
                 className="btn-secondary w-full"
                 onClick={() => {
                   const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';
                   window.location.href = `${baseUrl}/auth/google`;
                 }}
               >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
                  </svg>
                  Google
               </button>
               <button 
                 type="button" 
                 className="btn-secondary w-full"
                 onClick={() => {
                   const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api/v1';
                   window.location.href = `${baseUrl}/auth/github`;
                 }}
               >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
               </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-[hsl(var(--text-secondary))]">
            Don&apos;t have an account?{' '}
            <Link href={ROUTES.REGISTER} className="font-medium text-[hsl(var(--text-primary))] hover:underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
