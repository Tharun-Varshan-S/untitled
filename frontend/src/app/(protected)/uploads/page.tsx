'use client';

import { useState, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

interface UploadRecord {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  size: string;
}

export default function UploadsPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock upload history
  const [history] = useState<UploadRecord[]>([
    { id: '1', filename: 'server-logs-2026-06-14.log', status: 'completed', uploadedAt: '2026-06-14T10:00:00Z', size: '2.3 MB' },
    { id: '2', filename: 'api-access-logs.json', status: 'completed', uploadedAt: '2026-06-13T18:30:00Z', size: '850 KB' },
    { id: '3', filename: 'crash-report.txt', status: 'failed', uploadedAt: '2026-06-12T09:15:00Z', size: '12 KB' },
  ]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    // Mock delay
    await new Promise((r) => setTimeout(r, 1500)); 
    setIsUploading(false);
    setSelectedFile(null);
  };

  const statusMap: Record<UploadRecord['status'], { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
    completed: { status: 'success', label: 'Completed' },
    processing: { status: 'info', label: 'Processing' },
    pending: { status: 'neutral', label: 'Pending' },
    failed: { status: 'error', label: 'Failed' },
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ingestion"
        description="Manually upload log files for processing and indexing."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Upload Zone ── */}
        <div className="card-premium p-6 xl:col-span-1 flex flex-col h-full">
          <h3 className="font-medium text-[hsl(var(--text-primary))] mb-6">File Upload</h3>
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
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
                <p className="text-[hsl(var(--text-secondary))] text-sm">or click to browse from your computer</p>
                <div className="flex gap-2 justify-center mt-4 pt-4 border-t border-[hsl(var(--border))]">
                   <span className="text-[10px] font-mono bg-[hsl(var(--surface-elevated))] px-2 py-0.5 rounded text-[hsl(var(--text-muted))]">.log</span>
                   <span className="text-[10px] font-mono bg-[hsl(var(--surface-elevated))] px-2 py-0.5 rounded text-[hsl(var(--text-muted))]">.json</span>
                   <span className="text-[10px] font-mono bg-[hsl(var(--surface-elevated))] px-2 py-0.5 rounded text-[hsl(var(--text-muted))]">.txt</span>
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-6 flex items-center justify-between bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-md p-3">
              <div className="flex items-center gap-3">
                 <svg className="w-5 h-5 text-[hsl(var(--text-muted))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 <span className="text-[hsl(var(--text-primary))] text-sm font-medium">Ready to upload</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="btn-ghost !h-8 !px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="btn-primary !h-8 !px-4 text-xs"
                >
                  {isUploading ? 'Processing...' : 'Upload File'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Upload History ── */}
        <div className="card-premium p-0 xl:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between">
            <h3 className="font-medium text-[hsl(var(--text-primary))]">Ingestion History</h3>
            <button className="btn-secondary !h-8 !px-3 text-xs gap-2">
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
               Filter
            </button>
          </div>
          
          {history.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No uploads yet"
                description="Upload your first log file to start ingestion."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--surface-hover))]">
                  <tr className="text-[hsl(var(--text-secondary))]">
                    <th className="text-left py-3 px-6 font-medium">Filename</th>
                    <th className="text-right py-3 px-6 font-medium">Size</th>
                    <th className="text-right py-3 px-6 font-medium">Date</th>
                    <th className="text-right py-3 px-6 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {history.map((upload) => (
                    <tr key={upload.id} className="hover:bg-[hsl(var(--surface-hover))] transition-colors group">
                      <td className="py-3 px-6 text-[hsl(var(--text-primary))] font-mono text-xs flex items-center gap-3">
                        <svg className="w-4 h-4 text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {upload.filename}
                      </td>
                      <td className="py-3 px-6 text-right text-[hsl(var(--text-secondary))]">{upload.size}</td>
                      <td className="py-3 px-6 text-right text-[hsl(var(--text-secondary))]">
                        {new Date(upload.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <StatusBadge
                          status={statusMap[upload.status].status}
                          label={statusMap[upload.status].label}
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
