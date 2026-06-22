'use client';

import React from 'react';
import { copyToClipboard } from '@/lib/utils';
import { Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ResponseHeadersProps {
  headers: Record<string, string>;
}

export function ResponseHeaders({ headers }: ResponseHeadersProps) {
  const entries = Object.entries(headers);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {entries.length === 0 ? (
          <p className="text-xs text-gray-600">No response headers</p>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="group flex items-start gap-3 py-1.5 hover:bg-[#1a1a2e] rounded px-2 -mx-2">
              <span className="text-blue-300 text-xs font-mono flex-shrink-0 min-w-[180px]">{key}</span>
              <span className="text-gray-400 text-xs font-mono break-all flex-1">{value}</span>
              <button
                onClick={async () => { await copyToClipboard(value); toast.success('Copied'); }}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 flex-shrink-0 mt-0.5 transition-opacity"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
