'use client';

import { useState, useEffect } from 'react';

export type HealthStatus = 'checking' | 'normal' | 'db_disconnected' | 'backend_offline';

const BACKEND_HEALTH_URL = 'http://localhost:5000/api/health';
const POLL_INTERVAL_MS = 8000;

/**
 * Polls the backend health endpoint and returns a live connection status.
 * - 'checking'        → initial state, first request not yet resolved
 * - 'normal'          → backend reachable and DB connected
 * - 'db_disconnected' → backend reachable but MongoDB offline (firewall suspected)
 * - 'backend_offline' → backend server unreachable (not running on port 5000)
 */
export function useHealthCheck(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(BACKEND_HEALTH_URL, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          // Short timeout so we don't hang the UI
          signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
        });

        if (cancelled) return;

        if (!res.ok) {
          // 503 = server up but DB down
          setStatus(res.status === 503 ? 'db_disconnected' : 'backend_offline');
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        setStatus(data?.database?.connected === true ? 'normal' : 'db_disconnected');
      } catch {
        if (!cancelled) setStatus('backend_offline');
      }
    };

    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return status;
}
