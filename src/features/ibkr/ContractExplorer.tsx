'use client';

import React, { useState } from 'react';
import { IBKRContract } from '@/types/ibkr';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { FileText, Search, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

const SAMPLE_CONTRACTS: IBKRContract[] = [
  { conid: 265598, symbol: 'AAPL', secType: 'STK', exchange: 'NASDAQ', currency: 'USD', description: 'Apple Inc.' },
  { conid: 272093, symbol: 'TSLA', secType: 'STK', exchange: 'NASDAQ', currency: 'USD', description: 'Tesla Inc.' },
  { conid: 8314, symbol: 'IBM', secType: 'STK', exchange: 'NYSE', currency: 'USD', description: 'International Business Machines' },
  { conid: 4815747, symbol: 'SPY', secType: 'ETF', exchange: 'ARCA', currency: 'USD', description: 'SPDR S&P 500 ETF Trust' },
  { conid: 107113386, symbol: 'MNQ', secType: 'FUT', exchange: 'CME', currency: 'USD', description: 'Micro E-mini NASDAQ-100', multiplier: 2 },
  { conid: 495512572, symbol: 'MES', secType: 'FUT', exchange: 'CME', currency: 'USD', description: 'Micro E-mini S&P 500', multiplier: 5 },
  { conid: 12087792, symbol: 'ES', secType: 'FUT', exchange: 'CME', currency: 'USD', description: 'E-mini S&P 500', multiplier: 50 },
  { conid: 371455931, symbol: 'NQ', secType: 'FUT', exchange: 'CME', currency: 'USD', description: 'E-mini NASDAQ-100', multiplier: 20 },
  { conid: 76792991, symbol: 'GC', secType: 'FUT', exchange: 'COMEX', currency: 'USD', description: 'Gold Futures', multiplier: 100 },
  { conid: 55928698, symbol: 'CL', secType: 'FUT', exchange: 'NYMEX', currency: 'USD', description: 'Crude Oil WTI', multiplier: 1000 },
];

const SEC_TYPE_COLORS: Record<string, string> = {
  STK: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  ETF: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  FUT: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  OPT: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  CASH: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
};

export function ContractExplorer() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<IBKRContract | null>(null);
  const { setVariableValue } = useEnvironmentStore();

  const filtered = SAMPLE_CONTRACTS.filter(
    (c) =>
      c.symbol.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      String(c.conid).includes(search) ||
      c.secType.toLowerCase().includes(search.toLowerCase())
  );

  const handleSetConid = (contract: IBKRContract) => {
    setVariableValue('conid', String(contract.conid));
    toast.success(`Set {{conid}} = ${contract.conid} (${contract.symbol})`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-3">
        <FileText className="w-5 h-5 text-purple-400" />
        <h2 className="text-sm font-semibold text-gray-200">Contract Explorer</h2>
        <div className="flex-1 max-w-xs ml-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, conid, type..."
              className="pl-8 h-7 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300"
            />
          </div>
        </div>
        <p className="text-[10px] text-gray-600 ml-auto">Sample contracts. Import spec for live data.</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contract list */}
        <div className="w-80 flex-shrink-0 border-r border-[#1e1e2e]">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {filtered.map((contract) => (
                <div
                  key={contract.conid}
                  onClick={() => setSelected(contract)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                    selected?.conid === contract.conid
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'hover:bg-[#1a1a2e] border border-transparent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-200">{contract.symbol}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-mono', SEC_TYPE_COLORS[contract.secType] ?? 'bg-gray-400/10 text-gray-400')}>
                        {contract.secType}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 truncate mt-0.5">{contract.description}</p>
                    <p className="text-[10px] text-gray-700 font-mono">{contract.exchange} · {contract.currency}</p>
                  </div>
                  <span className="text-[10px] text-gray-700 font-mono flex-shrink-0">{contract.conid}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Contract detail */}
        <div className="flex-1 overflow-auto p-4">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-100">{selected.symbol}</h2>
                    <span className={cn('text-xs px-2 py-1 rounded border font-mono', SEC_TYPE_COLORS[selected.secType] ?? '')}>
                      {selected.secType}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">{selected.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { copyToClipboard(String(selected.conid)); toast.success('Conid copied'); }}
                    className="h-7 text-xs gap-1.5 border-[#2a2a3e] text-gray-400"
                  >
                    <Copy className="w-3 h-3" /> Copy conid
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSetConid(selected)}
                    className="h-7 text-xs gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    {'Set {{conid}}'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Contract ID (conid)', value: selected.conid },
                  { label: 'Security Type', value: selected.secType },
                  { label: 'Exchange', value: selected.exchange },
                  { label: 'Currency', value: selected.currency },
                  { label: 'Description', value: selected.description },
                  ...(selected.multiplier ? [{ label: 'Multiplier', value: selected.multiplier }] : []),
                  ...(selected.expiry ? [{ label: 'Expiry', value: selected.expiry }] : []),
                  ...(selected.localSymbol ? [{ label: 'Local Symbol', value: selected.localSymbol }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg p-3">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-mono text-gray-200 mt-1">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-sm text-gray-600">Select a contract to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
