'use client';

import React from 'react';
import { ConsoleLog } from '@/types/response';
import { formatTimestamp, cn } from '@/lib/utils';
import { Info, AlertTriangle, XCircle, Bug, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useResponseStore } from '@/stores/useResponseStore';

interface ResponseConsoleProps {
  logs: ConsoleLog[];
}

const LOG_ICONS: Record<ConsoleLog['level'], React.ElementType> = {
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
  debug: Bug,
};

const LOG_COLORS: Record<ConsoleLog['level'], string> = {
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
  debug: 'text-gray-500',
};

export function ResponseConsole({ logs }: ResponseConsoleProps) {
  const { clearLogs } = useResponseStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1 border-b border-[#1e1e2e]">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Console</span>
        {logs.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearLogs}
            className="h-5 text-[10px] text-gray-600 hover:text-gray-300 gap-1 px-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {logs.length === 0 ? (
            <p className="text-xs text-gray-700 px-1 py-2">No console output</p>
          ) : (
            logs.map((log) => {
              const Icon = LOG_ICONS[log.level];
              return (
                <div key={log.id} className="flex items-start gap-2 py-0.5 px-1 rounded hover:bg-[#1a1a2e] font-mono">
                  <Icon className={cn('w-3 h-3 mt-0.5 flex-shrink-0', LOG_COLORS[log.level])} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-gray-400 break-all">{log.message}</span>
                    {log.data !== undefined && (
                      <pre className="text-[10px] text-gray-600 mt-0.5 whitespace-pre-wrap break-all">
                        {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                      </pre>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-700 flex-shrink-0">{formatTimestamp(log.timestamp)}</span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
