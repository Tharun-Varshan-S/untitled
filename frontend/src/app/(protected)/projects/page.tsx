'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROUTES } from '@/lib/constants';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/store';

/**
 * Projects page — Client Component.
 * Fetches projects via React Query.
 */
export default function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjects();
  const setSelectedProject = useProjectStore((state) => state.setSelectedProject);
  const fetchError = error instanceof Error ? error.message : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your monitored applications and services."
      >
        <button className="btn-primary gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Project
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-[hsl(var(--surface-hover))] rounded-lg"></div>
          <div className="h-24 bg-[hsl(var(--surface-hover))] rounded-lg"></div>
          <div className="h-24 bg-[hsl(var(--surface-hover))] rounded-lg"></div>
        </div>
      ) : fetchError ? (
        <ErrorState message={fetchError} />
      ) : (
        <div className="card-premium overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-[hsl(var(--border))] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[hsl(var(--surface-hover))]">
            <div className="relative w-full max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--text-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Find a project..."
                readOnly
                className="input-premium pl-9 h-9 cursor-default"
                title="Search coming in Phase O"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary !h-9 text-xs">
                Sort: Newest
              </button>
            </div>
          </div>

          {/* Project List */}
          {projects.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No projects yet"
                description="Create your first project to start ingesting and monitoring logs."
              />
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 hover:bg-[hsl(var(--surface-hover))] transition-colors group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link
                        href={`${ROUTES.PROJECTS}/${project.id}`}
                        onClick={() => setSelectedProject(project.id, project.name)}
                        className="text-lg font-semibold text-[hsl(var(--text-primary))] hover:text-[hsl(var(--accent))] hover:underline transition-colors truncate"
                      >
                        {project.name}
                      </Link>
                      <StatusBadge status="success" label="Active" />
                    </div>
                    {project.description && (
                      <p className="text-sm text-[hsl(var(--text-muted))] mt-1 truncate">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-[hsl(var(--text-muted))] mt-2">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`${ROUTES.PROJECTS}/${project.id}`}
                      onClick={() => setSelectedProject(project.id, project.name)}
                      className="btn-secondary !h-8 !px-3 text-xs"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
