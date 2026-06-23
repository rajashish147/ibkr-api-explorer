'use client';

import React from 'react';
import { RequestParam } from '@/types/endpoint';
import { ParsedParameter } from '@/types/endpoint';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParamEditorProps {
  params: RequestParam[];
  onChange: (params: RequestParam[]) => void;
  allowAdd: boolean;
  paramDefs?: ParsedParameter[];
}

export function ParamEditor({ params, onChange, allowAdd, paramDefs = [] }: ParamEditorProps) {
  const update = (id: string, field: keyof RequestParam, value: string | boolean) => {
    onChange(params.map((p) => (p.name === id ? { ...p, [field]: value } : p)));
  };

  const remove = (name: string) => {
    onChange(params.filter((p) => p.name !== name));
  };

  const add = () => {
    onChange([...params, { name: '', value: '', enabled: true }]);
  };

  const getDef = (name: string) => paramDefs.find((d) => d.name === name);

  return (
    <div className="space-y-1">
      {params.length > 0 && (
        <div className="grid grid-cols-[16px_1fr_1fr_16px] gap-1 mb-1 px-1">
          <div />
          <span className="text-[10px] text-gray-700 uppercase tracking-wider">Key</span>
          <span className="text-[10px] text-gray-700 uppercase tracking-wider">Value</span>
          <div />
        </div>
      )}

      {params.map((param) => {
        const def = getDef(param.name);
        return (
          <div key={param.name} className="grid grid-cols-[16px_1fr_1fr_16px] gap-1 items-center">
            <input
              type="checkbox"
              checked={param.enabled}
              onChange={(e) => update(param.name, 'enabled', e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-blue-500"
            />
            <div className="relative">
              <input
                type="text"
                value={param.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  onChange(params.map((p) => (p.name === param.name ? { ...p, name: newName } : p)));
                }}
                readOnly={!allowAdd || !!def}
                placeholder="key"
                className={cn(
                  'w-full bg-[#111120] border border-[#1e1e2e] rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500/50',
                  def?.required && 'border-blue-500/30',
                  (!param.enabled) && 'opacity-50'
                )}
              />
              {def?.required && (
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-blue-400">*</span>
              )}
            </div>
            <input
              type="text"
              value={param.value}
              onChange={(e) => update(param.name, 'value', e.target.value)}
              placeholder={def ? (String(def.example ?? def.defaultValue ?? '')) || 'value' : 'value'}
              className={cn(
                'w-full bg-[#111120] border border-[#1e1e2e] rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500/50',
                (!param.enabled) && 'opacity-50'
              )}
            />
            {allowAdd ? (
              <button onClick={() => remove(param.name)} className="text-gray-700 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="w-3.5" />
            )}
          </div>
        );
      })}

      {allowAdd && (
        <button
          onClick={add}
          className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-400 transition-colors mt-2 px-1"
        >
          <Plus className="w-3 h-3" />
          Add parameter
        </button>
      )}

      {params.length === 0 && !allowAdd && (
        <p className="text-xs text-gray-700 px-1">No path parameters defined.</p>
      )}
    </div>
  );
}
