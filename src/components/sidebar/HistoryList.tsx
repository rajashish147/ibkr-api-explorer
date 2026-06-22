'use client';

import React from 'react';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { HistoryEntry } from '@/types/response';
import { getMethodBg, getStatusBg, formatDate, formatDuration, cn } from '@/lib/utils';
import { Trash2, Clock, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface HistoryRowProps {
  entry: HistoryEntry;
  onLoad: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
}

function HistoryRow({ entry, onLoad, onRemove }: HistoryRowProps) {
  return (
    <div
      onClick={() => onLoad(entry)}
      className="group flex items-center gap-2 px-3 py-2 hover:bg-[#1a1a2e] cursor-pointer transition-colors"
    >
      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono flex-shrink-0', getMethodBg(entry.method))}>
        {entry.method}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 truncate font-mono">{entry.url}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-600">{formatDate(entry.timestamp)}</span>
          {entry.duration && (
            <span className="text-[10px] text-gray-700">{formatDuration(entry.duration)}</span>
          )}
        </div>
      </div>
      {entry.status && (
        <span className={cn('text-[10px] font-mono flex-shrink-0', getStatusBg(entry.status), 'px-1 rounded')}>
          {entry.status}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function HistoryList() {
  const { entries, removeEntry, clearHistory } = useHistoryStore();
  const { updateRequest } = useEndpointStore();

  const handleLoad = (entry: HistoryEntry) => {
    updateRequest(entry.requestConfig);
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center px-4">
        <Clock className="w-8 h-8 text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-600">No history yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e1e2e]">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">{entries.length} requests</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={clearHistory}
          className="h-5 text-[10px] text-gray-600 hover:text-red-400 gap-1 px-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {entries.map((entry) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            onLoad={handleLoad}
            onRemove={removeEntry}
          />
        ))}
      </ScrollArea>
    </div>
  );
}
