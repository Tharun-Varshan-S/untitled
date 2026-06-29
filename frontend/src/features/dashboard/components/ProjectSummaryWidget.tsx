import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/lib/constants';

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

interface ProjectSummaryWidgetProps {
  projects: Project[];
}

export function ProjectSummaryWidget({ projects }: ProjectSummaryWidgetProps) {
  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-[hsl(var(--text-primary))]">Your Projects</h3>
        <Link href={ROUTES.PROJECTS} className="text-sm text-[hsl(var(--accent))] hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {projects.slice(0, 5).map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border-subtle))] hover:border-[hsl(var(--border))] transition-colors"
          >
            <div className="flex items-center gap-3">
              <StatusBadge status="success" label="Active" />
              <Link
                href={`${ROUTES.PROJECTS}/${project.id}`}
                className="text-sm font-medium text-[hsl(var(--text-primary))] hover:text-[hsl(var(--accent))] transition-colors"
              >
                {project.name}
              </Link>
            </div>
            <span className="text-xs text-[hsl(var(--text-muted))]">
              {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
