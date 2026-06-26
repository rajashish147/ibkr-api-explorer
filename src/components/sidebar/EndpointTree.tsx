'use client';

import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useSearch } from '@/hooks/useSearch';
import { ParsedEndpoint, IBKRCategory } from '@/types/endpoint';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/parsers/ibkr-classifier';
import { getMethodBg, cn } from '@/lib/utils';
import {
  ChevronRight, ChevronDown, Briefcase, User, ShoppingCart, TrendingUp,
  FileText, ArrowLeftRight, BarChart2, Zap, Lock, Search, Bell, Circle, Star,
  Users, Server, Activity, LineChart
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase, User, ShoppingCart, TrendingUp, FileText,
  ArrowLeftRight, BarChart2, Zap, Lock, Search, Bell, Circle, Star,
  Users, Server, Activity, LineChart
};

interface EndpointRowProps {
  endpoint: ParsedEndpoint;
  isSelected: boolean;
  onSelect: (endpoint: ParsedEndpoint) => void;
}

const EndpointRow = React.memo(function EndpointRow({ endpoint, isSelected, onSelect }: EndpointRowProps) {
  const { toggleFavorite } = useEndpointStore();

  return (
    <div
      onClick={() => onSelect(endpoint)}
      className={cn(
        'group flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer transition-colors relative',
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
});

interface CategoryGroupProps {
  category: IBKRCategory;
  endpointCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const CategoryGroup = React.memo(function CategoryGroup({ category, endpointCount, isExpanded, onToggle }: CategoryGroupProps) {
  const IconComp = ICON_MAP[CATEGORY_ICONS[category]] ?? Circle;
  const color = CATEGORY_COLORS[category];

  return (
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
        {endpointCount}
      </span>
    </button>
  );
});


type VirtualRowData = 
  | { type: 'category'; category: IBKRCategory; endpoints: ParsedEndpoint[]; isExpanded: boolean }
  | { type: 'endpoint'; endpoint: ParsedEndpoint };

export const EndpointTree = React.memo(function EndpointTree() {
  const { selectedEndpointId, expandedTags, toggleTag, setRequestFromEndpoint } = useEndpointStore();
  const { getActiveEnvironment } = useEnvironmentStore();
  const { groupedResults, resultCount, totalCount, hasQuery } = useSearch();

  const activeEnv = getActiveEnvironment();
  const baseUrl = activeEnv?.variables.find((v) => v.key === 'baseUrl')?.value ?? 'https://localhost:5000/v1/api';

  const handleSelect = React.useCallback((endpoint: ParsedEndpoint) => {
    useEndpointStore.getState().selectEndpoint(endpoint.id);
    setRequestFromEndpoint(endpoint, baseUrl);
  }, [baseUrl, setRequestFromEndpoint]);

  const categories = useMemo(() => {
    const CATEGORY_ORDER = [
      '⭐ Favorites',
      '📊 Portfolio',
      '💹 Trading',
      '📈 Market',
      '📜 History',
      '🔍 Contracts',
      '🔐 Session',
      '⚙ Utilities',
      '🧪 Advanced'
    ];
    return Array.from(groupedResults.entries()).sort(([a], [b]) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      // If a category isn't in the list, it goes to the bottom
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedResults]);

  const flatRows = useMemo(() => {
    const rows: VirtualRowData[] = [];
    categories.forEach(([category, endpoints]) => {
      const isExpanded = expandedTags.has(category);
      rows.push({ type: 'category', category: category as IBKRCategory, endpoints, isExpanded });
      if (isExpanded) {
        endpoints.forEach((ep) => {
          rows.push({ type: 'endpoint', endpoint: ep });
        });
      }
    });
    return rows;
  }, [categories, expandedTags]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: React.useCallback((i: number) => (flatRows[i].type === 'category' ? 32 : 44), [flatRows]),
    overscan: 10,
  });

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center px-4">
        <p className="text-xs text-gray-600">No endpoints loaded.</p>
        <p className="text-[11px] text-gray-700 mt-1">Import an OpenAPI spec to begin.</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="py-1">
        {hasQuery && (
          <div className="px-3 py-1 text-[10px] text-gray-600">
            {resultCount} of {totalCount} endpoints
          </div>
        )}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = flatRows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.type === 'category' ? (
                  <CategoryGroup
                    category={row.category}
                    endpointCount={row.endpoints.length}
                    isExpanded={row.isExpanded}
                    onToggle={() => toggleTag(row.category)}
                  />
                ) : (
                  <EndpointRow
                    endpoint={row.endpoint}
                    isSelected={selectedEndpointId === row.endpoint.id}
                    onSelect={handleSelect}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
