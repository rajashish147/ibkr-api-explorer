'use client';

import React from 'react';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { ParsedEndpoint } from '@/types/endpoint';
import { getMethodBg, cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function FavoritesList() {
  const { endpoints, selectedEndpointId, toggleFavorite, setRequestFromEndpoint, selectEndpoint } = useEndpointStore();
  const { getActiveEnvironment } = useEnvironmentStore();
  const favorites = endpoints.filter((e) => e.isFavorite);

  const handleSelect = (endpoint: ParsedEndpoint) => {
    const env = getActiveEnvironment();
    const baseUrl = env?.variables.find((v) => v.key === 'baseUrl')?.value ?? 'https://localhost:5000/v1/api';
    selectEndpoint(endpoint.id);
    setRequestFromEndpoint(endpoint, baseUrl);
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center px-4">
        <Star className="w-8 h-8 text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-600">No favorites yet.</p>
        <p className="text-[11px] text-gray-700 mt-0.5">Star endpoints to add them here.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-1">
        <div className="px-3 py-1 text-[10px] text-gray-600 uppercase tracking-wider">
          {favorites.length} favorites
        </div>
        {favorites.map((ep) => (
          <div
            key={ep.id}
            onClick={() => handleSelect(ep)}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
              selectedEndpointId === ep.id ? 'bg-blue-600/20' : 'hover:bg-[#1a1a2e]'
            )}
          >
            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono flex-shrink-0', getMethodBg(ep.method))}>
              {ep.method}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate font-mono">{ep.path}</p>
              {ep.summary && <p className="text-[10px] text-gray-600 truncate">{ep.summary}</p>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(ep.id); }}
              className="text-amber-400 flex-shrink-0"
            >
              <Star className="w-3 h-3" fill="currentColor" />
            </button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
