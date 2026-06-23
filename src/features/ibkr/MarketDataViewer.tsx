'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// Simulated market data for demonstration
function generateMockData(base: number, points = 20): Array<{ time: string; price: number }> {
  const data = [];
  let price = base;
  for (let i = 0; i < points; i++) {
    price += (Math.random() - 0.5) * base * 0.002;
    data.push({ time: `${i}`, price: parseFloat(price.toFixed(2)) });
  }
  return data;
}

const DEFAULT_WATCHLIST = [
  { conid: 265598, symbol: 'AAPL', last: 193.22, bid: 193.18, ask: 193.26, change: 2.14, changePct: 1.12, volume: 45234123 },
  { conid: 272093, symbol: 'TSLA', last: 248.50, bid: 248.42, ask: 248.58, change: -5.30, changePct: -2.09, volume: 78234567 },
  { conid: 107113386, symbol: 'MNQ', last: 19842.50, bid: 19842.25, ask: 19842.75, change: 125.25, changePct: 0.64, volume: 234567 },
  { conid: 495512572, symbol: 'MES', last: 5421.25, bid: 5421.00, ask: 5421.50, change: -12.50, changePct: -0.23, volume: 187654 },
];

interface MarketCard {
  conid: number;
  symbol: string;
  last: number;
  bid: number;
  ask: number;
  change: number;
  changePct: number;
  volume: number;
}

function MarketCard({ data }: { data: MarketCard }) {
  const isPositive = data.change >= 0;
  const chartData = generateMockData(data.last);

  return (
    <div className="bg-[#0d0d1a] border border-[#1e1e2e] rounded-xl overflow-hidden hover:border-[#2a2a3e] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between p-3 pb-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-100">{data.symbol}</span>
            <span className="text-[10px] text-gray-600 bg-[#1a1a2e] px-1.5 py-0.5 rounded">{data.conid}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={cn('text-xs font-mono', isPositive ? 'text-emerald-400' : 'text-red-400')}>
              {isPositive ? '+' : ''}{data.change.toFixed(2)} ({isPositive ? '+' : ''}{data.changePct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold font-mono text-gray-100">{data.last.toLocaleString()}</p>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-16 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${data.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#22c55e' : '#ef4444'}
              strokeWidth={1.5}
              fill={`url(#grad-${data.symbol})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bid/Ask/Volume */}
      <div className="grid grid-cols-3 gap-1 px-3 pb-3 border-t border-[#1e1e2e] pt-2">
        <div className="text-center">
          <p className="text-[10px] text-gray-600">Bid</p>
          <p className="text-xs font-mono text-blue-400">{data.bid.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-600">Ask</p>
          <p className="text-xs font-mono text-red-400">{data.ask.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-600">Volume</p>
          <p className="text-xs font-mono text-gray-400">{(data.volume / 1000).toFixed(0)}K</p>
        </div>
      </div>
    </div>
  );
}

export function MarketDataViewer() {
  const [watchlist, setWatchlist] = useState<MarketCard[]>(DEFAULT_WATCHLIST);
  const [newSymbol, setNewSymbol] = useState('');

  const handleAdd = () => {
    if (!newSymbol.trim()) return;
    const base = 100 + Math.random() * 500;
    setWatchlist((prev) => [
      ...prev,
      {
        conid: Math.floor(Math.random() * 1000000),
        symbol: newSymbol.toUpperCase(),
        last: parseFloat(base.toFixed(2)),
        bid: parseFloat((base - 0.05).toFixed(2)),
        ask: parseFloat((base + 0.05).toFixed(2)),
        change: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
        changePct: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
        volume: Math.floor(Math.random() * 10000000),
      },
    ]);
    setNewSymbol('');
  };

  const handleRemove = (conid: number) => {
    setWatchlist((prev) => prev.filter((d) => d.conid !== conid));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-3">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h2 className="text-sm font-semibold text-gray-200">Market Data Viewer</h2>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add symbol..."
            className="w-32 h-7 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300"
          />
          <Button onClick={handleAdd} size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-500 gap-1">
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        <p className="text-[10px] text-gray-600 hidden lg:block">
          Real data requires IBKR Gateway subscription. Showing simulated prices for demo.
        </p>
      </div>

      {/* Cards grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {watchlist.map((data) => (
            <div key={data.conid} className="relative group">
              <button
                onClick={() => handleRemove(data.conid)}
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <MarketCard data={data} />
            </div>
          ))}
        </div>
        {watchlist.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Activity className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-sm text-gray-600">Add symbols to your watchlist</p>
          </div>
        )}
      </div>
    </div>
  );
}
