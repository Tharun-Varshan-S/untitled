'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/features/search/components/SearchBar';
import { SearchFilters } from '@/features/search/components/SearchFilters';
import { SearchResults } from '@/features/search/components/SearchResults';

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Explorer"
        description="Search, filter, and analyse your application logs in real-time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Filters */}
        <div className="lg:col-span-1 space-y-6">
          <SearchFilters />
        </div>

        {/* Main Content: Search & Results */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <SearchBar />
          <SearchResults />
        </div>
      </div>
    </div>
  );
}
