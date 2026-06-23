'use client';

import React from 'react';
import { useResponseStore } from '@/stores/useResponseStore';
import { useAutoExtract } from '@/hooks/useAutoExtract';
import { JsonViewer } from './JsonViewer';
import { ResponseHeaders } from './ResponseHeaders';
import { ResponseConsole } from './ResponseConsole';
import { StatusBadge } from './StatusBadge';
import { formatDuration, formatBytes, formatTimestamp, copyToClipboard, downloadJson } from '@/lib/utils';
import { Copy, Download, Loader2, Clock, AlertCircle, Zap, Database, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { SchemaViewer } from '@/components/endpoint/SchemaViewer';
import { useEndpointStore } from '@/stores/useEndpointStore';

export function ResponseViewer() {
  const { response, status, consoleLogs, activeTab, setActiveTab } = useResponseStore();
  const { extractFromResponse } = useAutoExtract();
  const { endpoints, selectedEndpointId } = useEndpointStore();
  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId);

  const handleCopy = async () => {
    if (!response) return;
    await copyToClipboard(response.rawBody);
    toast.success('Response copied to clipboard');
  };

  const handleDownload = () => {
    if (!response) return;
    downloadJson(response.body, `response-${Date.now()}.json`);
    toast.success('Response downloaded');
  };

  const handleExtract = () => {
    const extracted = extractFromResponse();
    const count = Object.keys(extracted).length;
    if (count > 0) {
      toast.success(`Extracted ${count} variable${count > 1 ? 's' : ''}: ${Object.keys(extracted).join(', ')}`);
    } else {
      toast.info('No extractable variables found in response');
    }
  };

  if (status === 'idle' && !response) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-[#1a1a2e] border border-[#2a2a3e] flex items-center justify-center">
          <Zap className="w-7 h-7 text-gray-700" />
        </div>
        <div>
          <p className="text-sm text-gray-600">No response yet</p>
          <p className="text-xs text-gray-700 mt-0.5">Send a request to see the response</p>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-sm text-gray-500">Sending request...</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => useResponseStore.getState().abort()}
          className="text-xs border-[#2a2a3e] text-gray-500 hover:text-red-400"
        >
          Cancel
        </Button>
      </div>
    );
  }

  if (!response) return null;

  const isError = response.error || response.status === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Response meta bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 py-2 border-b border-[#1e1e2e] bg-[#0d0d1a]">
        {isError ? (
          <div className="flex items-center gap-1.5 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Network Error</span>
          </div>
        ) : (
          <StatusBadge status={response.status} statusText={response.statusText} />
        )}

        {response.duration > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{formatDuration(response.duration)}</span>
          </div>
        )}

        {response.size > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
            <Database className="w-3 h-3" />
            <span className="text-xs">{formatBytes(response.size)}</span>
          </div>
        )}

        {response.timestamp > 0 && (
          <span className="text-[10px] text-gray-700 ml-auto">{formatTimestamp(response.timestamp)}</span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExtract}
            className="h-6 text-[10px] text-gray-600 hover:text-emerald-400 px-1.5 gap-1"
            title="Auto-extract variables (accountId, conid, orderId)"
          >
            <CheckCircle2 className="w-3 h-3" />
            Extract
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-6 text-[10px] text-gray-600 hover:text-gray-300 px-1.5"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-6 text-[10px] text-gray-600 hover:text-gray-300 px-1.5"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {isError && response.error && (
        <div className="flex-shrink-0 mx-3 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{response.error}</p>
          <p className="text-[11px] text-gray-600 mt-1">
            Make sure the IBKR Gateway is running and CORS is configured.
          </p>
        </div>
      )}

      {/* Response Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-shrink-0 bg-[#0d0d1a] border-b border-[#1e1e2e] rounded-none justify-start h-8 px-3 gap-0">
          {[
            { value: 'pretty', label: 'Pretty' },
            { value: 'raw', label: 'Raw' },
            { value: 'headers', label: `Headers (${Object.keys(response.headers).length})` },
            { value: 'schema', label: 'Schema' },
            { value: 'console', label: `Console (${consoleLogs.length})` },
          ].map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="text-[11px] h-7 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 px-3"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pretty" className="flex-1 overflow-hidden mt-0">
          <JsonViewer data={response.body} rawText={response.rawBody} />
        </TabsContent>

        <TabsContent value="raw" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <pre className="p-3 text-[11px] text-gray-400 font-mono whitespace-pre-wrap break-all">
              {response.rawBody || '(empty body)'}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 overflow-hidden mt-0">
          <ResponseHeaders headers={response.headers} />
        </TabsContent>

        <TabsContent value="schema" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {selectedEndpoint?.responses.find((r) => r.statusCode === String(response.status))?.schema ? (
                <SchemaViewer
                  schema={selectedEndpoint.responses.find((r) => r.statusCode === String(response.status))!.schema!}
                />
              ) : (
                <p className="text-xs text-gray-600">No schema defined for this response status.</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="console" className="flex-1 overflow-hidden mt-0">
          <ResponseConsole logs={consoleLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
