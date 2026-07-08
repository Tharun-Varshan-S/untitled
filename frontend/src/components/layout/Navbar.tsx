'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { authService } from '@/services/auth.service';
import { useHealthCheck } from '@/lib/useHealthCheck';
import { useThemeStore, useUIStore } from '@/store';

export default function Navbar() {
  const router = useRouter();
  const healthStatus = useHealthCheck();
  
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const notifications = useUIStore((state) => state.notifications);
  const unreadCount = notifications.length;

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const handleLogout = () => {
    authService.logout();
    router.push(ROUTES.LOGIN);
  };

  return (
    <header className="h-16 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-6 flex-1">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="md:hidden text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        {/* Environment Selector */}
        <div className="hidden md:flex items-center gap-2">
           <span className="flex items-center justify-center w-5 h-5 rounded bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] text-[10px] font-mono text-[hsl(var(--text-secondary))]">PR</span>
           <span className="text-sm font-medium text-[hsl(var(--text-primary))]">production</span>
           <svg className="w-4 h-4 text-[hsl(var(--text-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
        </div>

        {/* Search Bar */}
        <div 
          className="hidden sm:flex flex-1 max-w-md relative group cursor-text"
          onClick={() => router.push(ROUTES.SEARCH)}
        >
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--accent))] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <div className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-md h-9 pl-10 pr-12 text-sm text-[hsl(var(--text-muted))] flex items-center hover:ring-1 hover:ring-[hsl(var(--border-focus))] transition-shadow">
            Search logs, metrics, or projects...
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-elevated))] px-1.5 font-mono text-[10px] font-medium text-[hsl(var(--text-muted))] opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto pl-4">
        {/* Live system status indicator */}
        <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-[hsl(var(--border))]">
          {healthStatus === 'normal' && (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--text-secondary))]" title="Database is connected and healthy">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--success))]" />
              </span>
              System Normal
            </div>
          )}
          {healthStatus === 'db_disconnected' && (
            <div
              className="flex items-center gap-2 text-sm text-amber-400 font-medium"
              title="MongoDB is offline. On college Wi-Fi, port 27017 is likely blocked by the firewall. Switch to a mobile hotspot or VPN."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              DB Offline — Firewall?
            </div>
          )}
          {healthStatus === 'backend_offline' && (
            <div
              className="flex items-center gap-2 text-sm text-red-500 font-medium"
              title="Backend is unreachable. Check that the Node server is running on port 5000."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              Backend Offline
            </div>
          )}
          {healthStatus === 'checking' && (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--text-muted))]">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500 animate-pulse" />
              </span>
              Checking...
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        {/* Notifications */}
        <button className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--error))] text-[10px] text-white font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-ghost !px-2 !text-[hsl(var(--text-muted))] hover:!text-[hsl(var(--error))]"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </div>
    </header>
  );
}
