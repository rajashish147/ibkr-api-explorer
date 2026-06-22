'use client';

import React, { useMemo } from 'react';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useSearch } from '@/hooks/useSearch';
import { ParsedEndpoint, IBKRCategory } from '@/types/endpoint';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/parsers/ibkr-classifier';
import { getMethodBg, cn } from '@/lib/utils';
import {
  ChevronRight, ChevronDown, Briefcase, User, ShoppingCart, TrendingUp,
  FileText, ArrowLeftRight, BarChart2, Zap, Lock, Search, Bell, Circle, Star
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase, User, ShoppingCart, TrendingUp, FileText,
  ArrowLeftRight, BarChart2, Zap, Lock, Search, Bell, Circle, Star,
};

interface EndpointRowProps {
  endpoint: ParsedEndpoint;
  isSelected: boolean;
  onSelect: (endpoint: ParsedEndpoint) => void;
}

function EndpointRow({ endpoint, isSelected, onSelect }: EndpointRowProps) {
  const { toggleFavorite } = useEndpointStore();

  return (
    <div
      onClick={() => onSelect(endpoint)}
      className={cn(
        'group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors relative',
        isSelected
          ? 'bg-blue-600/20 border-l-2 border-blue-500'
          : 'hover:bg-[#1a1a2e] border-l-2 border-transparent'
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono',
          getMethodBg(endpoint.method)
        )}
      >
        {endpoint.method}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs font-mono truncate',
          isSelected ? 'text-blue-300' : 'text-gray-400 group-hover:text-gray-200'
        )}>
          {endpoint.path}
        </p>
        {endpoint.summary && (
          <p className="text-[10px] text-gray-600 truncate">{endpoint.summary}</p>
        )}
      </div>
      {endpoint.deprecated && (
        <span className="text-[9px] text-amber-600 flex-shrink-0">deprecated</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); toggleFavorite(endpoint.id); }}
        className={cn(
          'opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity',
          endpoint.isFavorite ? 'opacity-100 text-amber-400' : 'text-gray-600 hover:text-amber-400'
        )}
      >
        <Star className="w-3 h-3" fill={endpoint.isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

interface CategoryGroupProps {
  category: IBKRCategory;
  endpoints: ParsedEndpoint[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedId: string | null;
  onSelect: (endpoint: ParsedEndpoint) => void;
}

function CategoryGroup({ category, endpoints, isExpanded, onToggle, selectedId, onSelect }: CategoryGroupProps) {
  const IconComp = ICON_MAP[CATEGORY_ICONS[category]] ?? Circle;
  const color = CATEGORY_COLORS[category];

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#1a1a2e] transition-colors group"
      >
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          )}
        </div>
        <IconComp className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 flex-1 text-left">
          {category}
        </span>
        <span className="text-[10px] text-gray-600 bg-[#1e1e2e] px-1.5 py-0.5 rounded-full">
          {endpoints.length}
        </span>
      </button>

      {isExpanded && (
        <div className="ml-2">
          {endpoints.map((ep) => (
            <EndpointRow
              key={ep.id}
              endpoint={ep}
              isSelected={selectedId === ep.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EndpointTree() {
  const { selectedEndpointId, expandedTags, toggleTag, setRequestFromEndpoint } = useEndpointStore();
  const { getActiveEnvironment } = useEnvironmentStore();
  const { groupedResults, resultCount, totalCount, hasQuery } = useSearch();

  const activeEnv = getActiveEnvironment();
  const baseUrl = activeEnv?.variables.find((v) => v.key === 'baseUrl')?.value ?? 'https://localhost:5000/v1/api';

  const handleSelect = (endpoint: ParsedEndpoint) => {
    useEndpointStore.getState().selectEndpoint(endpoint.id);
    setRequestFromEndpoint(endpoint, baseUrl);
  };

  const categories = useMemo(
    () => Array.from(groupedResults.entries()).sort(([a], [b]) => a.localeCompare(b)),
    [groupedResults]
  );

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center px-4">
        <p className="text-xs text-gray-600">No endpoints loaded.</p>
        <p className="text-[11px] text-gray-700 mt-1">Import an OpenAPI spec to begin.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-1">
        {hasQuery && (
          <div className="px-3 py-1 text-[10px] text-gray-600">
            {resultCount} of {totalCount} endpoints
          </div>
        )}
        {categories.map(([category, endpoints]) => (
          <CategoryGroup
            key={category}
            category={category as IBKRCategory}
            endpoints={endpoints}
            isExpanded={expandedTags.has(category)}
            onToggle={() => toggleTag(category)}
            selectedId={selectedEndpointId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
