'use client';

import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useOpenApiStore } from '@/stores/useOpenApiStore';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { SearchBar } from '@/components/sidebar/SearchBar';
import { EndpointTree } from '@/components/sidebar/EndpointTree';
import { CollectionTree } from '@/components/sidebar/CollectionTree';
import { HistoryList } from '@/components/sidebar/HistoryList';
import { FavoritesList } from '@/components/sidebar/FavoritesList';
import { EnvironmentSelector } from '@/components/sidebar/EnvironmentSelector';

export function LeftSidebar() {
  const { sidebarTab } = useAppStore();
  const { specs } = useOpenApiStore();
  const { endpoints } = useEndpointStore();

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a]">
      {/* Env selector always visible at top */}
      <EnvironmentSelector />

      {/* Nav tabs */}
      <SidebarNav endpointCount={endpoints.length} specCount={specs.length} />

      {/* Search (always visible) */}
      <div className="px-3 pb-2">
        <SearchBar />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {sidebarTab === 'endpoints' && <EndpointTree />}
        {sidebarTab === 'collections' && <CollectionTree />}
        {sidebarTab === 'history' && <HistoryList />}
        {sidebarTab === 'favorites' && <FavoritesList />}
      </div>
    </div>
  );
}
