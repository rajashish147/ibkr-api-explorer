'use client';

import React, { useState } from 'react';
import { IBKROrder, OrderType, OrderSide, OrderTIF } from '@/types/ibkr';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { prettyJson, copyToClipboard } from '@/lib/utils';
import { ShoppingCart, Copy, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ORDER_TYPES: OrderType[] = ['MKT', 'LMT', 'STP', 'STP LMT', 'TRAIL', 'TRAIL LIMIT', 'MIDPRICE'];
const TIFS: OrderTIF[] = ['GTC', 'DAY', 'IOC', 'OPG'];

const TEMPLATES = {
  market: { orderType: 'MKT', price: undefined } as Partial<IBKROrder>,
  limit: { orderType: 'LMT', price: 0 } as Partial<IBKROrder>,
  stop: { orderType: 'STP', auxPrice: 0 } as Partial<IBKROrder>,
  stopLimit: { orderType: 'STP LMT', price: 0, auxPrice: 0 } as Partial<IBKROrder>,
};

function FieldRow({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
      <Label className="text-xs text-gray-500 text-right">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function OrderBuilder() {
  const { getActiveVariables } = useEnvironmentStore();
  const variables = getActiveVariables();

  const accountId = variables.find((v) => v.key === 'accountId')?.value ?? '';
  const conid = variables.find((v) => v.key === 'conid')?.value ?? '';

  const [order, setOrder] = useState<Partial<IBKROrder>>({
    acctId: accountId,
    conid: conid ? parseInt(conid) : undefined,
    orderType: 'LMT',
    side: 'BUY',
    quantity: 1,
    tif: 'DAY',
    price: 0,
    outsideRTH: false,
  });

  const updateOrder = (updates: Partial<IBKROrder>) => setOrder((prev) => ({ ...prev, ...updates }));

  const applyTemplate = (key: keyof typeof TEMPLATES) => {
    updateOrder(TEMPLATES[key]);
  };

  const generatedJson = prettyJson(order);

  const handleCopyJson = () => {
    copyToClipboard(generatedJson);
    toast.success('Order JSON copied');
  };

  const showPrice = ['LMT', 'STP LMT', 'TRAIL LIMIT', 'MIDPRICE'].includes(order.orderType ?? '');
  const showAuxPrice = ['STP', 'STP LMT', 'TRAIL', 'TRAIL LIMIT'].includes(order.orderType ?? '');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#1e1e2e] flex items-center gap-3">
        <ShoppingCart className="w-5 h-5 text-amber-400" />
        <h2 className="text-sm font-semibold text-gray-200">Order Builder</h2>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          {Object.entries(TEMPLATES).map(([key]) => (
            <Button
              key={key}
              size="sm"
              variant="outline"
              onClick={() => applyTemplate(key as keyof typeof TEMPLATES)}
              className="h-6 text-[10px] border-[#2a2a3e] text-gray-500 hover:text-gray-200 capitalize px-2"
            >
              {key}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Form */}
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-xl space-y-3">
            {/* Buy/Sell toggle */}
            <div className="flex gap-2">
              {(['BUY', 'SELL'] as OrderSide[]).map((side) => (
                <button
                  key={side}
                  onClick={() => updateOrder({ side })}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-bold border transition-colors',
                    order.side === side
                      ? side === 'BUY'
                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-red-600/20 border-red-500/50 text-red-400'
                      : 'border-[#2a2a3e] text-gray-600 hover:text-gray-400'
                  )}
                >
                  {side}
                </button>
              ))}
            </div>

            <FieldRow label="Account ID" required>
              <Input
                value={order.acctId ?? ''}
                onChange={(e) => updateOrder({ acctId: e.target.value })}
                placeholder="{{accountId}}"
                className="h-8 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300 font-mono"
              />
            </FieldRow>

            <FieldRow label="Conid" required>
              <Input
                type="number"
                value={order.conid ?? ''}
                onChange={(e) => updateOrder({ conid: parseInt(e.target.value) || undefined })}
                placeholder="Contract ID ({{conid}})"
                className="h-8 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300 font-mono"
              />
            </FieldRow>

            <FieldRow label="Order Type" required>
              <Select value={order.orderType} onValueChange={(v) => updateOrder({ orderType: v as OrderType })}>
                <SelectTrigger className="h-8 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e2e] border-[#2a2a3e] text-gray-300 text-xs">
                  {ORDER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Quantity" required>
              <Input
                type="number"
                value={order.quantity ?? ''}
                onChange={(e) => updateOrder({ quantity: parseFloat(e.target.value) || 0 })}
                placeholder="1"
                min="0"
                step="1"
                className="h-8 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300 font-mono"
              />
            </FieldRow>

            <FieldRow label="Time in Force">
              <Select value={order.tif} onValueChange={(v) => updateOrder({ tif: v as OrderTIF })}>
                <SelectTrigger className="h-8 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e2e] border-[#2a2a3e] text-gray-300 text-xs">
                  {TIFS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>

            {showPrice && (
              <FieldRow label="Limit Price" required>
                <Input
                  type="number"
                  value={order.price ?? ''}
                  onChange={(e) => updateOrder({ price: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  className="h-8 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300 font-mono"
                />
              </FieldRow>
            )}

            {showAuxPrice && (
              <FieldRow label={order.orderType?.includes('TRAIL') ? 'Trailing Amount' : 'Stop Price'} required>
                <Input
                  type="number"
                  value={order.auxPrice ?? ''}
                  onChange={(e) => updateOrder({ auxPrice: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  className="h-8 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300 font-mono"
                />
              </FieldRow>
            )}

            <FieldRow label="Outside RTH">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={order.outsideRTH ?? false}
                  onChange={(e) => updateOrder({ outsideRTH: e.target.checked })}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-xs text-gray-500">Allow trading outside regular hours</span>
              </div>
            </FieldRow>

            <FieldRow label="Client Order ID">
              <Input
                value={order.cOID ?? ''}
                onChange={(e) => updateOrder({ cOID: e.target.value || undefined })}
                placeholder="Optional client order ID"
                className="h-8 text-xs bg-[#111120] border-[#2a2a3e] text-gray-300 font-mono"
              />
            </FieldRow>
          </div>
        </div>

        {/* Generated JSON */}
        <div className="w-80 flex-shrink-0 border-l border-[#1e1e2e] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e2e]">
            <span className="text-[10px] text-gray-600 uppercase tracking-wider">Generated JSON</span>
            <Button size="sm" variant="ghost" onClick={handleCopyJson} className="h-5 text-[10px] text-gray-600 hover:text-gray-300 gap-1 px-1">
              <Copy className="w-3 h-3" /> Copy
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <pre className="p-3 text-[11px] text-gray-400 font-mono whitespace-pre-wrap">{generatedJson}</pre>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
