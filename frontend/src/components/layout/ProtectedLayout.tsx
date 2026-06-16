'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useHealthCheck } from '@/lib/useHealthCheck';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const healthStatus = useHealthCheck();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const showBanner =
    !bannerDismissed &&
    (healthStatus === 'db_disconnected' || healthStatus === 'backend_offline');

  const isDbIssue = healthStatus === 'db_disconnected';

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--text-primary))] font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Connectivity Warning Banner ── */}
        {showBanner && (
          <div
            className={`flex items-start gap-3 px-5 py-3 text-sm border-b ${
              isDbIssue
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : 'bg-red-950/40 border-red-800/60 text-red-300'
            }`}
          >
            {/* Icon */}
            <svg
              className={`w-5 h-5 shrink-0 mt-0.5 ${isDbIssue ? 'text-amber-400' : 'text-red-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>

            {/* Message */}
            <div className="flex-1">
              {isDbIssue ? (
                <>
                  <span className="font-semibold text-amber-200">Database offline — firewall suspected.</span>{' '}
                  MongoDB Atlas (port 27017) is unreachable. If you are on{' '}
                  <strong>college Wi-Fi (GCLG)</strong>, the firewall likely blocks outbound connections
                  to port 27017. Switch to a <strong>mobile hotspot</strong> or use a{' '}
                  <strong>VPN</strong>, then the app will reconnect automatically.
                </>
              ) : (
                <>
                  <span className="font-semibold text-red-200">Backend server is offline.</span>{' '}
                  Cannot reach the Node.js server on port 5000. Run{' '}
                  <code className="font-mono bg-red-900/40 px-1 rounded text-xs">npm run dev</code>{' '}
                  inside the <code className="font-mono bg-red-900/40 px-1 rounded text-xs">backend/</code>{' '}
                  directory to start it.
                </>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss warning"
              className={`shrink-0 rounded p-1 transition-colors ${
                isDbIssue
                  ? 'hover:bg-amber-800/40 text-amber-400'
                  : 'hover:bg-red-800/40 text-red-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[hsl(var(--background))]">
          <div className="max-w-[1600px] mx-auto w-full p-6 md:p-8 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
