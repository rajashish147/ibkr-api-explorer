'use client';

import React from 'react';
import { Briefcase, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { useEnvironmentStore } from '@/stores/useEnvironmentStore';

const DEMO_POSITIONS = [
  { symbol: '{{futureSymbol}}', description: 'Micro E-mini NASDAQ-100', position: 2, mktValue: 39685, unrealizedPnl: 1250.50, pct: 31.6 },
  { symbol: '{{etfSymbol}}', description: 'Micro E-mini S&P 500', position: 3, mktValue: 27106.25, unrealizedPnl: -375.25, pct: 21.6 },
  { symbol: '{{stockSymbol}}', description: 'Apple Inc.', position: 50, mktValue: 9661, unrealizedPnl: 850.00, pct: 7.7 },
  { symbol: 'SPY', description: 'SPDR S&P 500 ETF', position: 10, mktValue: 5421.25, unrealizedPnl: 421.25, pct: 4.3 },
  { symbol: 'TSLA', description: 'Tesla Inc.', position: -5, mktValue: -1242.50, unrealizedPnl: -265.50, pct: -1.0 },
];

export function PortfolioMonitor() {
  const { getActiveVariables } = useEnvironmentStore();
  const variables = getActiveVariables();
  const accountId = variables.find(v => v.key === 'accountId')?.value || '{{accountId}}';

  const accounts = [
    { id: accountId, type: 'Active', currency: 'USD', netliq: 125430.50, buyingPower: 80000, cash: 45430.50 }
  ];

  const resolveSymbol = (sym: string) => {
    return variables.find(v => v.key === sym)?.value || `{{${sym}}}`;
  };

  const positions = [
    { symbol: resolveSymbol('futureSymbol'), description: 'Micro E-mini NASDAQ-100', position: 2, mktValue: 39685, unrealizedPnl: 1250.50, pct: 31.6 },
    { symbol: resolveSymbol('etfSymbol'), description: 'Micro E-mini S&P 500', position: 3, mktValue: 27106.25, unrealizedPnl: -375.25, pct: 21.6 },
    { symbol: resolveSymbol('stockSymbol'), description: 'Apple Inc.', position: 50, mktValue: 9661, unrealizedPnl: 850.00, pct: 7.7 },
    { symbol: 'SPY', description: 'SPDR S&P 500 ETF', position: 10, mktValue: 5421.25, unrealizedPnl: 421.25, pct: 4.3 },
    { symbol: 'TSLA', description: 'Tesla Inc.', position: -5, mktValue: -1242.50, unrealizedPnl: -265.50, pct: -1.0 },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-3">
        <Briefcase className="w-5 h-5 text-emerald-400" />
        <h2 className="text-sm font-semibold text-gray-200">Portfolio Monitor</h2>
        <p className="text-[10px] text-gray-600 ml-auto">Demo data. Connect IBKR Gateway for live portfolio.</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Account cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((account) => (
            <div key={account.id} className="bg-[#0d0d1a] border border-[#1e1e2e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-gray-400">{account.id}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium mt-1 inline-block ${
                    account.type === 'Live' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  }`}>
                    {account.type}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Net Liquidation</span>
                  <span className="text-sm font-bold font-mono text-gray-100">${account.netliq.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Buying Power</span>
                  <span className="text-xs font-mono text-blue-400">${account.buyingPower.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Cash Balance</span>
                  <span className="text-xs font-mono text-gray-400">${account.cash.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Positions */}
        <div className="bg-[#0d0d1a] border border-[#1e1e2e] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Positions</span>
            <span className="text-xs text-gray-600">{DEMO_POSITIONS.length} positions</span>
          </div>

          <div className="divide-y divide-[#1e1e2e]">
            {DEMO_POSITIONS.map((pos) => {
              const isPos = pos.unrealizedPnl >= 0;
              const isShort = pos.position < 0;
              return (
                <div key={pos.symbol} className="flex items-center gap-4 px-4 py-3 hover:bg-[#111120] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-200">{pos.symbol}</span>
                      <span className={`text-[10px] px-1 rounded font-mono ${isShort ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {isShort ? 'SHORT' : 'LONG'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 truncate">{pos.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-gray-300">{Math.abs(pos.position)} contracts/shares</p>
                    <p className="text-[10px] text-gray-600">${Math.abs(pos.mktValue).toLocaleString()}</p>
                  </div>
                  <div className="text-right w-24">
                    <div className={`flex items-center gap-1 justify-end ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="text-xs font-mono font-bold">
                        {isPos ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 text-right">{pos.pct}% of portfolio</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exposure chart */}
        <div className="bg-[#0d0d1a] border border-[#1e1e2e] rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-3.5 h-3.5" /> Position Exposure
          </h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={DEMO_POSITIONS.filter((p) => p.position > 0)} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="symbol" tick={{ fontSize: 11, fill: '#9ca3af' }} width={40} />
              <Tooltip
                contentStyle={{ background: '#1e1e2e', border: '1px solid #2a2a3e', borderRadius: '8px', fontSize: '11px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {DEMO_POSITIONS.filter((p) => p.position > 0).map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
