'use client';

import React from 'react';
import { RequestParam } from '@/types/endpoint';
import { ParsedParameter } from '@/types/endpoint';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderEditorProps {
  headers: RequestParam[];
  onChange: (headers: RequestParam[]) => void;
  paramDefs?: ParsedParameter[];
}

const COMMON_HEADERS = [
  'Content-Type',
  'Accept',
  'Authorization',
  'X-Request-Id',
  'User-Agent',
];

export function HeaderEditor({ headers, onChange }: HeaderEditorProps) {
  const update = (index: number, field: keyof RequestParam, value: string | boolean) => {
    const next = headers.map((h, i) => (i === index ? { ...h, [field]: value } : h));
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(headers.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...headers, { name: '', value: '', enabled: true }]);
  };

  return (
    <div className="space-y-1">
      {headers.length > 0 && (
        <div className="grid grid-cols-[16px_1fr_1fr_16px] gap-1 mb-1 px-1">
          <div />
          <span className="text-[10px] text-gray-700 uppercase tracking-wider">Header</span>
          <span className="text-[10px] text-gray-700 uppercase tracking-wider">Value</span>
          <div />
        </div>
      )}

      {headers.map((header, index) => (
        <div key={index} className="grid grid-cols-[16px_1fr_1fr_16px] gap-1 items-center">
          <input
            type="checkbox"
            checked={header.enabled}
            onChange={(e) => update(index, 'enabled', e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-blue-500"
          />
          <input
            type="text"
            value={header.name}
            onChange={(e) => update(index, 'name', e.target.value)}
            placeholder="Header name"
            list="header-suggestions"
            className={cn(
              'w-full bg-[#111120] border border-[#1e1e2e] rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500/50',
              (!header.enabled) && 'opacity-50'
            )}
          />
          <input
            type="text"
            value={header.value}
            onChange={(e) => update(index, 'value', e.target.value)}
            placeholder="value"
            className={cn(
              'w-full bg-[#111120] border border-[#1e1e2e] rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500/50',
              (!header.enabled) && 'opacity-50'
            )}
          />
          <button onClick={() => remove(index)} className="text-gray-700 hover:text-red-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <datalist id="header-suggestions">
        {COMMON_HEADERS.map((h) => <option key={h} value={h} />)}
      </datalist>

      <button
        onClick={add}
        className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-400 transition-colors mt-2 px-1"
      >
        <Plus className="w-3 h-3" />
        Add header
      </button>
    </div>
  );
}
