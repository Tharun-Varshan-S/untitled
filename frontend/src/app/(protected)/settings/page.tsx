'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { useThemeStore } from '@/store';

export default function SettingsPage() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Settings" 
        description="Manage your account, workspaces, API keys, and preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation Sidebar */}
        <div className="col-span-1 space-y-1">
           <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-primary))] rounded-md">
              Profile
           </button>
           <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))] rounded-md transition-colors">
              Workspace
           </button>
           <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))] rounded-md transition-colors">
              API Keys
           </button>
           <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))] rounded-md transition-colors">
              Billing
           </button>
        </div>

        {/* Settings Content Area */}
        <div className="col-span-1 lg:col-span-3 space-y-6">
          <div className="card-premium overflow-hidden">
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <h3 className="text-lg font-medium text-[hsl(var(--text-primary))]">Profile Details</h3>
              <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">Update your personal information and email address.</p>
            </div>
            <div className="p-6 space-y-6">
               <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--chart-2))] flex items-center justify-center text-2xl font-bold shadow-inner">
                     E
                  </div>
                  <button className="btn-secondary">Upload Avatar</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-[hsl(var(--text-primary))]">Full Name</label>
                     <input type="text" defaultValue="Engineer" className="input-premium" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-[hsl(var(--text-primary))]">Email Address</label>
                     <input type="email" defaultValue="engineer@acmecorp.com" className="input-premium" />
                  </div>
               </div>
            </div>
            <div className="p-4 bg-[hsl(var(--surface-hover))] border-t border-[hsl(var(--border))] flex justify-end">
               <button className="btn-primary">Save Changes</button>
            </div>
          </div>

          <div className="card-premium overflow-hidden">
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <h3 className="text-lg font-medium text-[hsl(var(--text-primary))]">Preferences</h3>
              <p className="text-sm text-[hsl(var(--text-secondary))] mt-1">Manage UI settings and theme.</p>
            </div>
            <div className="p-6 space-y-6">
               <div className="space-y-3">
                  <label className="text-sm font-medium text-[hsl(var(--text-primary))]">Theme</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                        theme === 'light'
                          ? 'bg-[hsl(var(--accent)/0.1)] border-[hsl(var(--accent))] text-[hsl(var(--accent))]'
                          : 'bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))]'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                        theme === 'dark'
                          ? 'bg-[hsl(var(--accent)/0.1)] border-[hsl(var(--accent))] text-[hsl(var(--accent))]'
                          : 'bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))]'
                      }`}
                    >
                      Dark
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
