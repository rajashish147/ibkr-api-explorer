'use client';

import React, { useState } from 'react';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { RequestBuilder } from './RequestBuilder';
import { SchemaViewer } from './SchemaViewer';
import { getMethodBg, cn } from '@/lib/utils';
import { Tag, AlertTriangle, Code2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export function EndpointExplorer() {
  const { endpoints, selectedEndpointId } = useEndpointStore();
  const selectedEndpoint = endpoints.find((e) => e.id === selectedEndpointId);
  const [activeTab, setActiveTab] = useState('request');

  if (!selectedEndpoint) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Code2 className="w-12 h-12 text-gray-700 mb-3" />
        <p className="text-sm text-gray-500">Select an endpoint from the sidebar</p>
        <p className="text-xs text-gray-700 mt-1">to start building and executing requests</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Endpoint header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1e1e2e] bg-[#0d0d1a]">
        <div className="flex items-start gap-3">
          <span className={cn('text-[11px] font-bold px-2 py-1 rounded border font-mono flex-shrink-0 mt-0.5', getMethodBg(selectedEndpoint.method))}>
            {selectedEndpoint.method}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-mono text-gray-200 break-all">{selectedEndpoint.path}</h1>
            {selectedEndpoint.summary && (
              <p className="text-xs text-gray-500 mt-0.5">{selectedEndpoint.summary}</p>
            )}
          </div>
          {selectedEndpoint.deprecated && (
            <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs">Deprecated</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {selectedEndpoint.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Tag className="w-3 h-3 text-gray-600" />
            {selectedEndpoint.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] h-4 px-1.5 border-[#2a2a3e] text-gray-500"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {selectedEndpoint.description && (
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">{selectedEndpoint.description}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-shrink-0 bg-[#0d0d1a] border-b border-[#1e1e2e] rounded-none justify-start h-9 px-4 gap-0">
          <TabsTrigger value="request" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400">
            Request
          </TabsTrigger>
          <TabsTrigger value="schema" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400">
            Schema
          </TabsTrigger>
          <TabsTrigger value="responses" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400">
            Responses ({selectedEndpoint.responses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="flex-1 overflow-hidden mt-0">
          <RequestBuilder endpoint={selectedEndpoint} />
        </TabsContent>

        <TabsContent value="schema" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {selectedEndpoint.requestBody?.schema && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Request Body</h3>
                  <SchemaViewer schema={selectedEndpoint.requestBody.schema} />
                </div>
              )}
              {selectedEndpoint.responses.map((resp) => (
                resp.schema && (
                  <div key={resp.statusCode}>
                    <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Response {resp.statusCode}
                    </h3>
                    <SchemaViewer schema={resp.schema} />
                  </div>
                )
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="responses" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {selectedEndpoint.responses.map((resp) => (
                <div key={resp.statusCode} className="border border-[#1e1e2e] rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2 bg-[#111120]">
                    <span className={cn('text-xs font-mono font-bold px-1.5 py-0.5 rounded', getStatusBadge(parseInt(resp.statusCode)))}>
                      {resp.statusCode}
                    </span>
                    <span className="text-xs text-gray-400">{resp.description}</span>
                    {resp.contentType && (
                      <span className="text-[10px] text-gray-600 ml-auto">{resp.contentType}</span>
                    )}
                  </div>
                  {resp.schema && (
                    <div className="px-3 py-2">
                      <SchemaViewer schema={resp.schema} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getStatusBadge(code: number): string {
  if (code >= 200 && code < 300) return 'bg-emerald-400/10 text-emerald-400';
  if (code >= 300 && code < 400) return 'bg-blue-400/10 text-blue-400';
  if (code >= 400 && code < 500) return 'bg-amber-400/10 text-amber-400';
  if (code >= 500) return 'bg-red-400/10 text-red-400';
  return 'bg-gray-400/10 text-gray-400';
}
