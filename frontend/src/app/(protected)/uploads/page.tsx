'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import type { UploadResult } from '@/services/upload.service';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/store';

/**
 * Session-only upload record — persisted in component state for the current
 * session only. The backend has no history endpoint at Phase I.
 * Persistent history will require a future backend endpoint.
 */
interface UploadRecord {
  id: string;
  filename: string;
  uploadedAt: string;
  result: UploadResult;
}

export default function UploadsPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: projects = [] } = useProjects();
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const [projectId, setProjectId] = useState<string>('');

  const currentProjectId = projectId || selectedProjectId || (projects.length > 0 ? projects[0].id : '');

  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();

  // Session-only history — not persisted across page reloads
  const [history, setHistory] = useState<UploadRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (!currentProjectId.trim()) {
      setUploadError('Please select a Project before uploading.');
      return;
    }

    setUploadError(null);

    try {
      const result = await uploadFile({ file: selectedFile, projectId: currentProjectId.trim() });

      setHistory((prev) => [
        {
          id: `${Date.now()}`,
          filename: selectedFile.name,
          uploadedAt: new Date().toISOString(),
          result,
        },
        ...prev,
      ]);

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ingestion"
        description="Manually upload log files for processing and indexing."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Upload Zone ── */}
        <div className="card-premium p-6 xl:col-span-1 flex flex-col gap-4">
          <h3 className="font-medium text-[hsl(var(--text-primary))]">File Upload</h3>

          {/* Project ID dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[hsl(var(--text-primary))]">
              Project <span className="text-[hsl(var(--error))]">*</span>
            </label>
            {projects.length > 0 ? (
              <select
                value={currentProjectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="input-premium appearance-none"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-[hsl(var(--error))]">
                No projects found. Please create a project first.
              </div>
            )}
            <p className="text-xs text-[hsl(var(--text-muted))]">
              Select the project to upload logs to. You can manage projects on the{' '}
              <Link href="/projects" className="text-[hsl(var(--accent))] hover:underline">
                Projects
              </Link>{' '}
              page.
            </p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))/0.05] shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--text-muted))] bg-[hsl(var(--surface-hover))]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".log,.json,.txt,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? 'bg-[hsl(var(--accent))] text-white' : 'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-muted))]'
            }`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {selectedFile ? (
              <div className="space-y-2 w-full px-4">
                <p className="text-[hsl(var(--accent))] font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-[hsl(var(--text-secondary))]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[hsl(var(--text-primary))] font-medium">Drop your log file here</p>
                <p className="text-[hsl(var(--text-secondary))] text-sm">or click to browse</p>
                <div className="flex gap-2 justify-center mt-4 pt-4 border-t border-[hsl(var(--border))]">
                  {['.log', '.json', '.txt', '.csv'].map((ext) => (
                    <span key={ext} className="text-[10px] font-mono bg-[hsl(var(--surface-elevated))] px-2 py-0.5 rounded text-[hsl(var(--text-muted))]">{ext}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {uploadError && (
            <ErrorState message={uploadError} />
          )}

          {selectedFile && (
            <div className="flex items-center justify-between bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-md p-3">
              <span className="text-[hsl(var(--text-primary))] text-sm font-medium truncate">{selectedFile.name}</span>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setSelectedFile(null); setUploadError(null); }} className="btn-ghost !h-8 !px-3 text-xs">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="btn-primary !h-8 !px-4 text-xs"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Upload History (session only) ── */}
        <div className="card-premium p-0 xl:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[hsl(var(--text-primary))]">Ingestion History</h3>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
                Session only — history resets on page reload. Persistent history requires a future backend endpoint.
              </p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No uploads yet"
                description="Upload your first log file to start ingestion. History is shown here for the current session."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--surface-hover))]">
                  <tr className="text-[hsl(var(--text-secondary))]">
                    <th className="text-left py-3 px-6 font-medium">Filename</th>
                    <th className="text-right py-3 px-6 font-medium">Inserted</th>
                    <th className="text-right py-3 px-6 font-medium">Rejected</th>
                    <th className="text-right py-3 px-6 font-medium">Date</th>
                    <th className="text-right py-3 px-6 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-[hsl(var(--surface-hover))] transition-colors">
                      <td className="py-3 px-6 text-[hsl(var(--text-primary))] font-mono text-xs">{record.filename}</td>
                      <td className="py-3 px-6 text-right font-mono text-[hsl(var(--success))]">{record.result.totalInserted}</td>
                      <td className="py-3 px-6 text-right font-mono text-[hsl(var(--error))]">{record.result.totalRejected}</td>
                      <td className="py-3 px-6 text-right text-[hsl(var(--text-secondary))]">
                        {new Date(record.uploadedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <StatusBadge
                          status={record.result.totalRejected === 0 ? 'success' : record.result.totalInserted > 0 ? 'warning' : 'error'}
                          label={record.result.totalRejected === 0 ? 'Completed' : record.result.totalInserted > 0 ? 'Partial' : 'Failed'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
