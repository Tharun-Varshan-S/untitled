import { useState } from 'react';
import { useSearchStore } from '@/store';
import { Filter, Save, Bookmark, Trash2 } from 'lucide-react';

export function SearchFilters() {
  const store = useSearchStore();
  const [filterName, setFilterName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveFilter = () => {
    if (!filterName.trim()) return;
    store.saveFilter({
      name: filterName,
      config: {
        query: store.query,
        level: store.level,
        service: store.service,
        environment: store.environment,
        source: store.source,
      }
    });
    setFilterName('');
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Active Filters */}
      <div className="card-premium p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 font-medium text-[hsl(var(--text-primary))]">
          <Filter className="w-4 h-4 text-[hsl(var(--accent))]" />
          Advanced Filters
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">Level</label>
            <select
              value={store.level}
              onChange={(e) => store.setFilters({ level: e.target.value })}
              className="w-full bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border))] rounded-md text-sm p-2 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--border-focus))]"
            >
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">Service</label>
            <input
              type="text"
              value={store.service}
              onChange={(e) => store.setFilters({ service: e.target.value })}
              placeholder="e.g. auth-service"
              className="w-full bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border))] rounded-md text-sm p-2 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--border-focus))]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">Environment</label>
            <select
              value={store.environment}
              onChange={(e) => store.setFilters({ environment: e.target.value })}
              className="w-full bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border))] rounded-md text-sm p-2 text-[hsl(var(--text-primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--border-focus))]"
            >
              <option value="">All Environments</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
          
          <div className="pt-2">
            {isSaving ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Filter name..."
                  autoFocus
                  className="w-full bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-md text-xs p-1.5 focus:outline-none"
                />
                <button onClick={handleSaveFilter} className="btn-primary !h-7 !px-2 text-xs">Save</button>
                <button onClick={() => setIsSaving(false)} className="btn-secondary !h-7 !px-2 text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsSaving(true)}
                  className="btn-secondary w-full gap-2 !h-8 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save as Preset
                </button>
                <button 
                  onClick={store.clearFilters}
                  className="btn-secondary !h-8 px-2 text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))]"
                  title="Clear all filters"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Filters */}
      {store.savedFilters.length > 0 && (
        <div className="card-premium p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 font-medium text-[hsl(var(--text-primary))]">
            <Bookmark className="w-4 h-4 text-[hsl(var(--accent))]" />
            Saved Presets
          </div>
          <ul className="space-y-1">
            {store.savedFilters.map((f) => (
              <li key={f.id} className="group flex justify-between items-center rounded-md hover:bg-[hsl(var(--surface-hover))] p-1.5 transition-colors cursor-pointer">
                <button 
                  onClick={() => store.applySavedFilter(f)}
                  className="text-sm text-[hsl(var(--text-secondary))] group-hover:text-[hsl(var(--text-primary))] truncate text-left flex-1"
                >
                  {f.name}
                </button>
                <button 
                  onClick={() => store.removeSavedFilter(f.id)}
                  className="opacity-0 group-hover:opacity-100 text-[hsl(var(--error))] hover:text-red-400 p-1 rounded-md transition-opacity"
                  title="Delete preset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
