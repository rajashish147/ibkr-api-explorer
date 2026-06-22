'use client';

import React, { useState } from 'react';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { useResponseStore } from '@/stores/useResponseStore';
import { useRequestExecutor } from '@/hooks/useRequestExecutor';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { ParsedEndpoint, RequestParam } from '@/types/endpoint';
import { ParamEditor } from './ParamEditor';
import { HeaderEditor } from './HeaderEditor';
import { BodyEditor } from './BodyEditor';
import { AuthEditor } from './AuthEditor';
import { HTTP_METHODS, getMethodBg, cn } from '@/lib/utils';
import { Play, Square, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface RequestBuilderProps {
  endpoint: ParsedEndpoint;
}

export function RequestBuilder({ endpoint }: RequestBuilderProps) {
  const { currentRequest, updateRequest } = useEndpointStore();
  const { status, abort } = useResponseStore();
  const { execute } = useRequestExecutor();
  const { collections, addRequest } = useCollectionStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveCollectionId, setSaveCollectionId] = useState(collections[0]?.id ?? '');

  const isLoading = status === 'loading';

  const handleSend = async () => {
    if (isLoading) {
      abort();
      return;
    }
    if (!currentRequest.url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    await execute();
  };

  const handleSave = () => {
    if (!saveCollectionId && collections.length === 0) {
      toast.error('Create a collection first');
      return;
    }
    const colId = saveCollectionId || collections[0]?.id;
    if (!colId) return;

    addRequest(colId, {
      name: endpoint.summary || `${currentRequest.method} ${endpoint.path}`,
      description: endpoint.description,
      config: currentRequest,
      endpointId: endpoint.id,
      collectionId: colId,
      tags: endpoint.tags,
    });
    toast.success('Request saved to collection');
  };

  const queryCount = currentRequest.queryParams.filter((p) => p.enabled).length;
  const headerCount = currentRequest.headers.filter((p) => p.enabled).length;
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(currentRequest.method);

  return (
    <div className="flex flex-col h-full">
      {/* URL Bar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1e1e2e]">
        <div className="flex gap-2">
          <Select
            value={currentRequest.method}
            onValueChange={(v) => updateRequest({ method: v as typeof currentRequest.method })}
          >
            <SelectTrigger className={cn(
              'w-24 h-9 text-xs font-bold font-mono border border-[#2a2a3e] bg-[#111120]',
              getMethodBg(currentRequest.method)
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1e2e] border-[#2a2a3e]">
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m} value={m} className={cn('text-xs font-mono', getMethodBg(m))}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={currentRequest.url}
            onChange={(e) => updateRequest({ url: e.target.value })}
            placeholder="{{baseUrl}}/path/to/endpoint"
            className="flex-1 h-9 text-xs font-mono bg-[#111120] border-[#2a2a3e] text-gray-300 placeholder:text-gray-700 focus-visible:ring-blue-500/50"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />

          <Button
            onClick={handleSend}
            className={cn(
              'h-9 px-4 text-xs font-semibold gap-2 transition-colors',
              isLoading
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            )}
          >
            {isLoading ? (
              <>
                <Square className="w-3.5 h-3.5" />
                Cancel
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Send
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            variant="outline"
            className="h-9 px-3 text-xs gap-1.5 border-[#2a2a3e] bg-[#111120] text-gray-400 hover:text-gray-200 hover:bg-[#1a1a2e]"
          >
            <Save className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Request Tabs */}
      <Tabs defaultValue="params" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-shrink-0 bg-[#0a0a0f] border-b border-[#1e1e2e] rounded-none justify-start h-9 px-4 gap-0">
          <TabsTrigger value="params" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 gap-1">
            Params
            {queryCount > 0 && (
              <span className="bg-blue-600 text-white text-[9px] px-1 rounded-full">{queryCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 gap-1">
            Headers
            {headerCount > 0 && (
              <span className="bg-blue-600 text-white text-[9px] px-1 rounded-full">{headerCount}</span>
            )}
          </TabsTrigger>
          {hasBody && (
            <TabsTrigger value="body" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400">
              Body
            </TabsTrigger>
          )}
          <TabsTrigger value="auth" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400">
            Auth
          </TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {endpoint.parameters.filter((p) => p.in === 'path').length > 0 && (
                <div>
                  <h4 className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Path Parameters</h4>
                  <ParamEditor
                    params={currentRequest.pathParams}
                    onChange={(params) => updateRequest({ pathParams: params })}
                    allowAdd={false}
                    paramDefs={endpoint.parameters.filter((p) => p.in === 'path')}
                  />
                </div>
              )}
              <div>
                <h4 className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Query Parameters</h4>
                <ParamEditor
                  params={currentRequest.queryParams}
                  onChange={(params) => updateRequest({ queryParams: params })}
                  allowAdd
                  paramDefs={endpoint.parameters.filter((p) => p.in === 'query')}
                />
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <HeaderEditor
                headers={currentRequest.headers}
                onChange={(headers) => updateRequest({ headers })}
                paramDefs={endpoint.parameters.filter((p) => p.in === 'header')}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {hasBody && (
          <TabsContent value="body" className="flex-1 overflow-hidden mt-0">
            <BodyEditor
              body={currentRequest.body}
              bodyType={currentRequest.bodyType}
              schema={endpoint.requestBody?.schema ?? null}
              onChange={(body, bodyType) => updateRequest({ body, bodyType })}
            />
          </TabsContent>
        )}

        <TabsContent value="auth" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <AuthEditor
                auth={currentRequest.auth}
                onChange={(auth) => updateRequest({ auth })}
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
