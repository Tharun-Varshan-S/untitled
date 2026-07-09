import React, { useState } from 'react';
import { useCreateProject } from '@/hooks/useProjects';
import { useProjectStore } from '@/store';

interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createProject, isPending } = useCreateProject();
  const setSelectedProject = useProjectStore((state) => state.setSelectedProject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setError(null);
      const newProject = await createProject({ 
        name: name.trim(), 
        description: description.trim() || undefined 
      });
      
      // Auto-select the newly created project
      setSelectedProject(newProject.id, newProject.name);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[hsl(var(--surface))] rounded-lg shadow-2xl border border-[hsl(var(--border))] w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-6 border-b border-[hsl(var(--border))]">
          <h3 className="text-xl font-semibold text-[hsl(var(--text-primary))]">Create New Project</h3>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-1">
            Projects help you organize logs from different applications or environments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-[hsl(var(--text-primary))]">
              Project Name <span className="text-[hsl(var(--error))]">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-premium w-full"
              placeholder="e.g. Production API"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-[hsl(var(--text-primary))]">
              Description <span className="text-[hsl(var(--text-muted))]">(optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-premium w-full min-h-[100px] resize-y"
              placeholder="e.g. Logs for the main production backend"
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="p-3 bg-[hsl(var(--error))/0.1] border border-[hsl(var(--error))/0.2] rounded-md text-sm text-[hsl(var(--error))]">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
            >
              {isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
