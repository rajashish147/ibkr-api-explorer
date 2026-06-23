'use client';

import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useOpenApiStore } from '@/stores/useOpenApiStore';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import {
  Upload, Settings, TrendingUp, ShoppingCart, Zap, Briefcase,
  FileText, Play, ChevronDown, Activity, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ActivePanel = 'explorer' | 'runner' | 'marketdata' | 'contracts' | 'orders' | 'futures' | 'portfolio';

const PANEL_ITEMS: { panel: ActivePanel; label: string; icon: React.ElementType; color: string }[] = [
  { panel: 'explorer', label: 'Explorer', icon: Globe, color: 'text-blue-400' },
  { panel: 'marketdata', label: 'Market Data', icon: TrendingUp, color: 'text-cyan-400' },
  { panel: 'contracts', label: 'Contracts', icon: FileText, color: 'text-purple-400' },
  { panel: 'orders', label: 'Order Builder', icon: ShoppingCart, color: 'text-amber-400' },
  { panel: 'futures', label: 'Futures', icon: Zap, color: 'text-green-400' },
  { panel: 'portfolio', label: 'Portfolio', icon: Briefcase, color: 'text-emerald-400' },
  { panel: 'runner', label: 'Runner', icon: Play, color: 'text-pink-400' },
];

export function TopBar() {
  const { setImportOpen, setEnvironmentOpen, activePanel, setActivePanel } = useAppStore();
  const { specs, activeSpecId } = useOpenApiStore();
  const { getActiveEnvironment } = useEnvironmentStore();
  const activeSpec = specs.find((s) => s.id === activeSpecId);
  const activeEnv = getActiveEnvironment();

  return (
    <header className="h-12 flex-shrink-0 border-b border-[#1e1e2e] bg-[#0d0d1a] flex items-center px-4 gap-3 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-white tracking-tight hidden sm:block">IBKR API Explorer</span>
      </div>

      {/* Panel switcher */}
      <div className="flex items-center gap-1">
        {PANEL_ITEMS.map(({ panel, label, icon: Icon, color }) => (
          <button
            key={panel}
            onClick={() => setActivePanel(panel)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              activePanel === panel
                ? 'bg-[#1e1e3e] text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a2e]'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', activePanel === panel ? color : '')} />
            <span className="hidden lg:block">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Active spec */}
      {activeSpec && (
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1a1a2e] border border-[#2a2a3e]">
          <FileText className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-gray-400 max-w-[160px] truncate">{activeSpec.name}</span>
          <Badge variant="outline" className="text-[10px] h-4 px-1 border-purple-500/30 text-purple-400">
            {activeSpec.endpointCount}
          </Badge>
        </div>
      )}

      {/* Environment indicator */}
      {activeEnv && (
        <button
          onClick={() => setEnvironmentOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1a1a2e] border border-[#2a2a3e] hover:bg-[#1e1e3e] transition-colors"
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeEnv.color }} />
          <span className="text-xs text-gray-400 hidden md:block">{activeEnv.name}</span>
        </button>
      )}

      {/* Import */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setImportOpen(true)}
        className="h-7 text-xs gap-1.5 border-[#2a2a3e] bg-[#1a1a2e] text-gray-300 hover:bg-[#1e1e3e] hover:text-white"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:block">Import</span>
      </Button>

      {/* Settings */}
      <button
        onClick={() => setEnvironmentOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-[#1a1a2e] transition-colors"
      >
        <Settings className="w-4 h-4" />
      </button>
    </header>
  );
}
