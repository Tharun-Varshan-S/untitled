'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import { useUIStore, useProjectStore } from '@/store';
import { useProjects } from '@/hooks/useProjects';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactElement;
  disabled?: boolean;
  badge?: string;
  external?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Platform',
    items: [
      {
        label: 'Dashboard',
        href: ROUTES.DASHBOARD,
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" /></svg>,
      },
      {
        label: 'Projects',
        href: ROUTES.PROJECTS,
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
      },
      {
        label: 'Log Explorer',
        href: ROUTES.SEARCH,
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
      },
      {
        label: 'Analytics',
        href: ROUTES.ANALYTICS,
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      },
      {
        label: 'Uploads',
        href: ROUTES.UPLOADS,
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
      },
      {
        label: 'Queue Monitor',
        href: 'http://localhost:5000/admin/queues',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
        external: true,
      },
    ]
  },
  {
    title: 'Insights',
    items: [
      {
        label: 'Alerts',
        href: '#',
        disabled: true,
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
        badge: 'Soon'
      },
      {
        label: 'AI Root Cause',
        href: '#',
        disabled: true,
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
        badge: 'Phase Q'
      }
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const closeSidebar = useUIStore((state) => state.closeSidebar);
  const { selectedProjectId, selectedProjectName, setSelectedProject } = useProjectStore();
  const { data: projects = [], isLoading } = useProjects();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={closeSidebar}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[hsl(var(--surface))] min-h-screen flex flex-col border-r border-[hsl(var(--border))] transition-transform transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 md:flex-shrink-0`}>
        {/* ── Workspace Selector ── */}
        <div className="relative h-16 px-4 flex items-center justify-between border-b border-[hsl(var(--border))]" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full p-2 rounded-md hover:bg-[hsl(var(--surface-hover))] transition-colors group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-6 h-6 bg-[hsl(var(--accent))] rounded flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 6h16v2H4v-2zm0 4h16v2H4v-2z"/>
                </svg>
              </div>
              <div className="truncate text-left">
                <p className="text-[hsl(var(--text-primary))] text-sm font-medium leading-none truncate">{selectedProjectName || 'Select a Project'}</p>
                <p className="text-[hsl(var(--text-muted))] text-xs mt-0.5 truncate">Production Workspace</p>
              </div>
            </div>
            <svg className={`w-4 h-4 text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--text-primary))] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-16 left-4 right-4 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-md shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">
                Your Projects
              </div>
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-[hsl(var(--text-muted))]">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[hsl(var(--text-muted))]">No projects found.</div>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProject(p.id, p.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-[hsl(var(--surface-hover))] transition-colors ${
                      p.id === selectedProjectId ? 'bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))]' : 'text-[hsl(var(--text-primary))]'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.id === selectedProjectId && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))
              )}
              <div className="border-t border-[hsl(var(--border))] mt-1 pt-1">
                <Link 
                  href={ROUTES.PROJECTS}
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  Manage Projects
                </Link>
              </div>
            </div>
          )}
          <button 
            className="md:hidden p-2 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
            onClick={closeSidebar}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-hide">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-2">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href) && !item.disabled;
                  return (
                    <li key={item.label}>
                      {item.disabled ? (
                        <div className="flex items-center justify-between px-3 py-2 text-sm text-[hsl(var(--text-muted))] cursor-not-allowed opacity-60">
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ) : item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => closeSidebar()}
                          className="group flex items-center justify-between px-3 py-2 rounded-md text-sm text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--text-primary))] transition-colors">
                              {item.icon}
                            </span>
                            {item.label}
                          </div>
                          <svg className="w-3.5 h-3.5 text-[hsl(var(--text-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => closeSidebar()}
                          className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                            isActive
                              ? 'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-primary))] font-medium shadow-sm'
                              : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={isActive ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--text-primary))] transition-colors'}>
                              {item.icon}
                            </span>
                            {item.label}
                          </div>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Bottom Section ── */}
        <div className="p-4 border-t border-[hsl(var(--border))] space-y-1">
           <Link
              href={ROUTES.SETTINGS}
              onClick={() => closeSidebar()}
              className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                pathname.startsWith(ROUTES.SETTINGS)
                  ? 'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-primary))] font-medium shadow-sm'
                  : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={pathname.startsWith(ROUTES.SETTINGS) ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--text-primary))] transition-colors'}>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                Settings
              </div>
            </Link>
            <div className="mt-2 pt-2 border-t border-[hsl(var(--border-subtle))] px-3 py-2 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--chart-2))] flex items-center justify-center text-xs font-bold shadow-inner">
                 E
               </div>
               <div className="flex-1 truncate">
                 <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">Engineer</p>
                 <p className="text-xs text-[hsl(var(--text-muted))] truncate">Free Tier</p>
               </div>
            </div>
        </div>
      </aside>
    </>
  );
}
