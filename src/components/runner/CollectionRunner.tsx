'use client';

import React, { useState } from 'react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { executeRequest } from '@/lib/request-executor';
import { CollectionItem, RequestRunResult } from '@/types/collection';
import { getMethodBg, getStatusBg, formatDuration, cn } from '@/lib/utils';
import { Play, Square, CheckCircle2, XCircle, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

function flattenRequests(items: CollectionItem[]): CollectionItem[] {
  return items.flatMap((item) => {
    if (item.type === 'request') return [item];
    return item.children ? flattenRequests(item.children) : [];
  });
}

export function CollectionRunner() {
  const { collections, selectedCollectionId } = useCollectionStore();
  const { getActiveVariables } = useEnvironmentStore();
  const { addEntry } = useHistoryStore();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RequestRunResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [aborted, setAborted] = useState(false);
  const abortRef = React.useRef(false);

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId) ?? collections[0];

  if (!selectedCollection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-2">
        <Play className="w-10 h-10 text-gray-700" />
        <p className="text-sm text-gray-500">No collection selected</p>
        <p className="text-xs text-gray-700">Create a collection and save requests to run them sequentially</p>
      </div>
    );
  }

  const requests = flattenRequests(selectedCollection.items);
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const progress = results.length > 0 ? (results.filter((r) => r.status !== 'running').length / requests.length) * 100 : 0;

  const handleRun = async () => {
    if (requests.length === 0) return;

    setIsRunning(true);
    setAborted(false);
    abortRef.current = false;
    setResults(requests.map((r) => ({ requestId: r.id, requestName: r.name, status: 'skipped' })));

    const variables = getActiveVariables();

    for (let i = 0; i < requests.length; i++) {
      if (abortRef.current) break;

      const requestItem = requests[i];
      if (!requestItem.request) continue;

      setCurrentIndex(i);
      setResults((prev) =>
        prev.map((r, idx) => idx === i ? { ...r, status: 'running' } : r)
      );

      const startTime = Date.now();
      try {
        const response = await executeRequest({ config: requestItem.request.config, variables });
        const duration = Date.now() - startTime;
        const isSuccess = response.status >= 200 && response.status < 300 && !response.error;

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: isSuccess ? 'passed' : 'failed', statusCode: response.status, duration, response: response.body }
              : r
          )
        );

        addEntry({
          method: requestItem.request.config.method,
          url: response.url,
          status: response.status,
          duration,
          timestamp: response.timestamp,
          requestConfig: requestItem.request.config,
          response,
        });
      } catch (err) {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: 'failed', error: (err as Error).message } : r
          )
        );
      }

      // Small delay between requests
      if (!abortRef.current && i < requests.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setIsRunning(false);
    setCurrentIndex(-1);
  };

  const handleAbort = () => {
    abortRef.current = true;
    setAborted(true);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">{selectedCollection.name}</h2>
          <p className="text-xs text-gray-600">{requests.length} requests</p>
        </div>
        <div className="flex-1" />
        {isRunning ? (
          <Button onClick={handleAbort} variant="outline" className="h-8 text-xs gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
            <Square className="w-3.5 h-3.5" />
            Stop
          </Button>
        ) : (
          <Button onClick={handleRun} className="h-8 text-xs gap-2 bg-blue-600 hover:bg-blue-500 text-white">
            <Play className="w-3.5 h-3.5" />
            Run All
          </Button>
        )}
      </div>

      {/* Progress */}
      {(isRunning || results.length > 0) && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs">{passed} passed</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              <span className="text-xs">{failed} failed</span>
            </div>
          </div>
          <Progress value={progress} className="h-1.5 bg-[#1e1e2e]" />
        </div>
      )}

      {/* Request list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {requests.map((req, i) => {
            const result = results[i];
            const isActive = currentIndex === i;

            return (
              <div
                key={req.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors',
                  isActive ? 'border-blue-500/30 bg-blue-500/5' : 'border-[#1e1e2e] bg-[#0d0d1a]'
                )}
              >
                {/* Status icon */}
                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  {result?.status === 'running' || isActive ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  ) : result?.status === 'passed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : result?.status === 'failed' ? (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-700" />
                  )}
                </div>

                {req.request && (
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono flex-shrink-0', getMethodBg(req.request.config.method))}>
                    {req.request.config.method}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 truncate">{req.name}</p>
                  {req.request && (
                    <p className="text-[10px] text-gray-600 truncate font-mono">{req.request.config.url}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {result?.statusCode && (
                    <span className={cn('text-[10px] font-mono px-1 rounded', getStatusBg(result.statusCode))}>
                      {result.statusCode}
                    </span>
                  )}
                  {result?.duration && (
                    <span className="text-[10px] text-gray-600">{formatDuration(result.duration)}</span>
                  )}
                </div>
              </div>
            );
          })}

          {requests.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-gray-600">No requests in this collection.</p>
              <p className="text-[11px] text-gray-700 mt-1">Save requests using the endpoint explorer.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
