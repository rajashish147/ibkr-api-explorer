'use client';

import React, { useCallback } from 'react';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { Search, X } from 'lucide-react';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useEndpointStore();

  const handleClear = useCallback(() => setSearchQuery(''), [setSearchQuery]);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search endpoints, paths, tags..."
        className="w-full bg-[#141420] border border-[#2a2a3e] rounded-md pl-8 pr-7 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:bg-[#16162a] transition-colors"
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
