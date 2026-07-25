'use client';

import React, { useState } from 'react';
import { useCreateWorkspaceProject } from '@/hooks/useWorkspaces';

interface CreateProjectModalProps {
  workspaceId: string;
  workspaceName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ workspaceId, workspaceName, isOpen, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createProjectMutation = useCreateWorkspaceProject();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createProjectMutation.mutate(
      { workspaceId, name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-premium w-full max-w-md p-6 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
          <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))]"></span>
            New Project in {workspaceName}
          </h3>
          <button
            onClick={onClose}
            className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider mb-1">
              Project Name
            </label>
            <input
              type="text"
              placeholder="e.g. Payment API, Inventory Service, Mobile App"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-md text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:border-[hsl(var(--accent))]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--text-secondary))] uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Brief description of this project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-md text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:border-[hsl(var(--accent))] h-20 resize-none"
            />
          </div>

          {createProjectMutation.isError && (
            <p className="text-xs text-[hsl(var(--error))]">
              {createProjectMutation.error?.message || 'Failed to create project'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProjectMutation.isPending || !name.trim()}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
