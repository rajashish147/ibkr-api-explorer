'use client';

import React from 'react';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useAppStore } from '@/stores/useAppStore';
import { ChevronDown, Settings } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function EnvironmentSelector() {
  const { environments, activeEnvironmentId, setActiveEnvironment } = useEnvironmentStore();
  const { setEnvironmentOpen } = useAppStore();
  const active = environments.find((e) => e.id === activeEnvironmentId);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e2e]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:bg-[#1a1a2e] rounded-md px-1.5 py-1 transition-colors flex-1 min-w-0">
            {active ? (
              <>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: active.color }} />
                <span className="text-xs text-gray-400 truncate">{active.name}</span>
              </>
            ) : (
              <span className="text-xs text-gray-600">No environment</span>
            )}
            <ChevronDown className="w-3 h-3 text-gray-600 flex-shrink-0 ml-auto" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="bg-[#1e1e2e] border-[#2a2a3e] text-gray-300 text-xs min-w-[180px]"
        >
          {environments.map((env) => (
            <DropdownMenuItem
              key={env.id}
              onClick={() => setActiveEnvironment(env.id)}
              className={activeEnvironmentId === env.id ? 'bg-blue-600/20' : ''}
            >
              <div className="w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: env.color }} />
              {env.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-[#2a2a3e]" />
          <DropdownMenuItem onClick={() => setEnvironmentOpen(true)}>
            <Settings className="w-3.5 h-3.5 mr-2" />
            Manage Environments
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
