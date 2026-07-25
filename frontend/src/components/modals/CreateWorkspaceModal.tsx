'use client';

import React, { useState } from 'react';
import { useCreateWorkspace } from '@/hooks/useWorkspaces';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');
  const createWorkspaceMutation = useCreateWorkspace();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createWorkspaceMutation.mutate(name.trim(), {
      onSuccess: () => {
        setName('');
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card-premium w-full max-w-md p-6 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
          <h3 className="text-lg font-bold text-[hsl(var(--text-primary))] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--accent))]"></span>
            Create New Workspace
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
              Workspace Name
            </label>
            <input
              type="text"
              placeholder="e.g. dfs, payment-team, staging-env"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-md text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-muted))] focus:outline-none focus:border-[hsl(var(--accent))]"
              required
            />
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">
              Creates an isolated workspace and automatically initializes a default project with the same name.
            </p>
          </div>

          {createWorkspaceMutation.isError && (
            <p className="text-xs text-[hsl(var(--error))]">
              {createWorkspaceMutation.error?.message || 'Failed to create workspace'}
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
              disabled={createWorkspaceMutation.isPending || !name.trim()}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              {createWorkspaceMutation.isPending ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
