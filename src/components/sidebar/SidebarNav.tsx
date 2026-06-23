'use client';

import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { Globe, FolderOpen, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'endpoints' | 'collections' | 'history' | 'favorites' | 'environments';

interface NavItem {
  tab: Tab;
  icon: React.ElementType;
  label: string;
  count?: number;
}

interface SidebarNavProps {
  endpointCount: number;
  specCount: number;
}

export function SidebarNav({ endpointCount }: SidebarNavProps) {
  const { sidebarTab, setSidebarTab } = useAppStore();
  const { endpoints } = useEndpointStore();
  const { collections } = useCollectionStore();
  const { entries } = useHistoryStore();
  const favorites = endpoints.filter((e) => e.isFavorite);

  const navItems: NavItem[] = [
    { tab: 'endpoints', icon: Globe, label: 'Endpoints', count: endpointCount },
    { tab: 'collections', icon: FolderOpen, label: 'Collections', count: collections.length },
    { tab: 'history', icon: Clock, label: 'History', count: entries.length },
    { tab: 'favorites', icon: Star, label: 'Favorites', count: favorites.length },
  ];

  return (
    <div className="flex border-b border-[#1e1e2e]">
      {navItems.map(({ tab, icon: Icon, label, count }) => (
        <button
          key={tab}
          onClick={() => setSidebarTab(tab)}
          title={label}
          className={cn(
            'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors relative',
            sidebarTab === tab
              ? 'text-blue-400 bg-[#1a1a2e]'
              : 'text-gray-600 hover:text-gray-400 hover:bg-[#141420]'
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden">{label}</span>
          {sidebarTab === tab && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
          )}
          {typeof count === 'number' && count > 0 && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600/70 flex items-center justify-center text-[9px] text-white font-medium">
              {count > 99 ? '99+' : count}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
