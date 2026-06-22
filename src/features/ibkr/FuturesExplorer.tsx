'use client';

import React, { useState } from 'react';
import { FUTURES_SYMBOLS } from '@/types/ibkr';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { Zap, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const FUTURES_DATA = Object.entries(FUTURES_SYMBOLS).map(([symbol, data]) => ({
  symbol,
  ...data,
  // Simulated market data
  last: parseFloat((1000 + Math.random() * 20000).toFixed(2)),
  change: parseFloat(((Math.random() - 0.5) * 100).toFixed(2)),
  expiry: getNextExpiry(),
  conid: Math.floor(Math.random() * 1000000000),
}));

function getNextExpiry(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + (Math.floor(Math.random() * 3) + 1));
  // Third Friday of the month
  d.setDate(1);
  const day = d.getDay();
  const firstFriday = day <= 5 ? 5 - day + 1 : 13 - day;
  d.setDate(firstFriday + 14);
  return d.toISOString().split('T')[0];
}

export function FuturesExplorer() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<(typeof FUTURES_DATA)[0] | null>(null);
  const { setVariableValue } = useEnvironmentStore();

  const filtered = FUTURES_DATA.filter(
    (f) =>
      f.symbol.toLowerCase().includes(search.toLowerCase()) ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.exchange.toLowerCase().includes(search.toLowerCase())
  );

  const handleSetSymbol = (f: typeof FUTURES_DATA[0]) => {
    setVariableValue('futureSymbol', f.symbol);
    setVariableValue('conid', String(f.conid));
    toast.success(`Set {{futureSymbol}} = ${f.symbol}, {{conid}} = ${f.conid}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-3">
        <Zap className="w-5 h-5 text-green-400" />
        <h2 className="text-sm font-semibold text-gray-200">Futures Explorer</h2>
        <div className="relative ml-4 flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="MNQ, ES, NQ, MES..."
            className="pl-8 h-7 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Futures list */}
        <div className="w-72 flex-shrink-0 border-r border-[#1e1e2e] overflow-auto">
          <div className="p-2 space-y-1">
            {filtered.map((f) => {
              const isPos = f.change >= 0;
              return (
                <div
                  key={f.symbol}
                  onClick={() => setSelected(f)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border',
                    selected?.symbol === f.symbol
                      ? 'bg-blue-600/20 border-blue-500/30'
                      : 'hover:bg-[#1a1a2e] border-transparent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-100">{f.symbol}</span>
                      <span className="text-[10px] text-gray-600">{f.exchange}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 truncate">{f.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-gray-200">{f.last.toLocaleString()}</p>
                    <p className={cn('text-[10px] font-mono', isPos ? 'text-emerald-400' : 'text-red-400')}>
                      {isPos ? '+' : ''}{f.change.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-auto p-4">
          {selected ? (
            <div className="space-y-4 max-w-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-100">{selected.symbol}</h2>
                  <p className="text-gray-500 mt-1">{selected.name}</p>
                </div>
                <Button
                  onClick={() => handleSetSymbol(selected)}
                  className="bg-green-600 hover:bg-green-500 text-white text-xs gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Use Contract
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Contract ID (conid)', value: selected.conid },
                  { label: 'Exchange', value: selected.exchange },
                  { label: 'Currency', value: selected.currency },
                  { label: 'Multiplier', value: `$${selected.multiplier.toLocaleString()} per point` },
                  { label: 'Tick Size', value: selected.tickSize },
                  { label: 'Tick Value', value: `$${(selected.multiplier * selected.tickSize).toFixed(2)}` },
                  { label: 'Expiration', value: selected.expiry },
                  { label: 'Last Price', value: selected.last.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg p-3">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-mono text-gray-200 mt-1">{String(value)}</p>
                  </div>
                ))}
              </div>

              {/* Margin calculator */}
              <div className="bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Quick Info</h3>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>• Each point = ${selected.multiplier.toLocaleString()}</p>
                  <p>• Minimum tick = {selected.tickSize} points = ${(selected.multiplier * selected.tickSize).toFixed(2)}</p>
                  <p>• For MNQ/MES: Micro contracts require ~90% less margin than full contracts</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Zap className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-sm text-gray-600">Select a futures contract to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
