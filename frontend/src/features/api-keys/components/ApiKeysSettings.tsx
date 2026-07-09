import React, { useState } from 'react';
import { useApiKeys, useCreateApiKey } from '@/hooks/useApiKeys';
import { useProjectStore } from '@/store';
import { format } from 'date-fns';

export function ApiKeysSettings() {
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const { data: apiKeys = [], isLoading } = useApiKeys(selectedProjectId || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!selectedProjectId) {
    return (
      <div className="card-premium overflow-hidden p-8 text-center">
        <h3 className="text-lg font-medium text-[hsl(var(--text-primary))]">No Project Selected</h3>
        <p className="text-sm text-[hsl(var(--text-secondary))] mt-2">
          Please select a project from the sidebar to manage its API keys.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-[hsl(var(--text-primary))]">API Keys</h3>
            <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">Manage API keys for sending logs to this project.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            Generate New Key
          </button>
        </div>
        <div className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-[hsl(var(--text-muted))]">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="p-6 text-center text-sm text-[hsl(var(--text-muted))]">
              No API keys found. Generate one to get started.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[hsl(var(--surface-hover))] border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-3 font-medium text-[hsl(var(--text-secondary))]">Name</th>
                  <th className="px-6 py-3 font-medium text-[hsl(var(--text-secondary))]">Prefix</th>
                  <th className="px-6 py-3 font-medium text-[hsl(var(--text-secondary))]">Created</th>
                  <th className="px-6 py-3 font-medium text-[hsl(var(--text-secondary))]">Last Used</th>
                  <th className="px-6 py-3 font-medium text-[hsl(var(--text-secondary))]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-[hsl(var(--surface-hover)/0.5)] transition-colors">
                    <td className="px-6 py-4 font-medium text-[hsl(var(--text-primary))]">{key.name}</td>
                    <td className="px-6 py-4 font-mono text-[hsl(var(--text-secondary))]">{key.prefix}••••••••</td>
                    <td className="px-6 py-4 text-[hsl(var(--text-muted))]">
                      {format(new Date(key.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--text-muted))]">
                      {key.lastUsedAt ? format(new Date(key.lastUsedAt), 'MMM d, yyyy') : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      {key.revoked ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[hsl(var(--error)/0.1)] text-[hsl(var(--error))]">
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && <CreateApiKeyModal onClose={() => setIsModalOpen(false)} projectId={selectedProjectId} />}
    </div>
  );
}

function CreateApiKeyModal({ onClose, projectId }: { onClose: () => void, projectId: string }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const { mutateAsync: createApiKey, isPending } = useCreateApiKey(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Key name is required');
      return;
    }

    try {
      setError(null);
      const res = await createApiKey({ name: name.trim() });
      if (res.key) {
        setNewKey(res.key);
      } else {
        onClose(); // Fallback if API doesn't return key for some reason
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  };

  const copyToClipboard = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      // Could show a toast here
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={newKey ? undefined : onClose} />
      
      <div className="relative bg-[hsl(var(--surface))] rounded-lg shadow-2xl border border-[hsl(var(--border))] w-full max-w-md overflow-hidden transform transition-all">
        {newKey ? (
          <div className="p-6">
             <h3 className="text-xl font-semibold text-[hsl(var(--text-primary))] mb-2">API Key Created</h3>
             <div className="p-4 bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.2)] rounded-md mb-4">
                <p className="text-sm text-[hsl(var(--warning))] font-medium">
                  Please copy this key now. You will not be able to see it again!
                </p>
             </div>
             <div className="flex items-center gap-2 mb-6">
                <input 
                  type="text" 
                  readOnly 
                  value={newKey} 
                  className="input-premium flex-1 font-mono text-sm" 
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button onClick={copyToClipboard} className="btn-secondary" title="Copy to clipboard">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
             </div>
             <div className="flex justify-end">
                <button onClick={onClose} className="btn-primary">Done</button>
             </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <h3 className="text-xl font-semibold text-[hsl(var(--text-primary))]">Generate New API Key</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-[hsl(var(--text-primary))]">
                  Key Name <span className="text-[hsl(var(--error))]">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium w-full"
                  placeholder="e.g. Production Backend"
                  disabled={isPending}
                />
              </div>

              {error && (
                <div className="p-3 bg-[hsl(var(--error)/0.1)] border border-[hsl(var(--error)/0.2)] rounded-md text-sm text-[hsl(var(--error))]">
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
                  {isPending ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
