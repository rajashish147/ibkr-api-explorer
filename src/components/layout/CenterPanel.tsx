'use client';

import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { EndpointExplorer } from '@/components/endpoint/EndpointExplorer';
import { MarketDataViewer } from '@/features/ibkr/MarketDataViewer';
import { ContractExplorer } from '@/features/ibkr/ContractExplorer';
import { OrderBuilder } from '@/features/ibkr/OrderBuilder';
import { FuturesExplorer } from '@/features/ibkr/FuturesExplorer';
import { PortfolioMonitor } from '@/features/ibkr/PortfolioMonitor';
import { CollectionRunner } from '@/components/runner/CollectionRunner';
import { Upload, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CenterPanel() {
  const { activePanel, setImportOpen } = useAppStore();
  const { endpoints, selectedEndpointId } = useEndpointStore();

  const hasEndpoints = endpoints.length > 0;

  if (!hasEndpoints && activePanel === 'explorer') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0f] gap-6">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 flex items-center justify-center">
            <FileJson className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Import an OpenAPI Spec</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Upload a JSON or YAML file, paste a URL, or paste raw OpenAPI content to start exploring endpoints.
            </p>
          </div>
          <Button
            onClick={() => setImportOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Specification
          </Button>
          <p className="text-xs text-gray-600">
            Supports OpenAPI 3.x and Swagger 2.0
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0a0a0f] overflow-hidden">
      {activePanel === 'explorer' && <EndpointExplorer />}
      {activePanel === 'marketdata' && <MarketDataViewer />}
      {activePanel === 'contracts' && <ContractExplorer />}
      {activePanel === 'orders' && <OrderBuilder />}
      {activePanel === 'futures' && <FuturesExplorer />}
      {activePanel === 'portfolio' && <PortfolioMonitor />}
      {activePanel === 'runner' && <CollectionRunner />}
    </div>
  );
}
