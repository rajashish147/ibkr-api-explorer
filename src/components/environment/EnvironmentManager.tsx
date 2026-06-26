'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { EnvironmentVariable } from '@/types/environment';
import { EnvironmentInspector } from './EnvironmentInspector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Eye, EyeOff, X, Settings } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { toast } from 'sonner';

function VariableRow({
  variable,
  onUpdate,
  onRemove,
}: {
  variable: EnvironmentVariable;
  onUpdate: (updates: Partial<EnvironmentVariable>) => void;
  onRemove: () => void;
}) {
  const [showValue, setShowValue] = useState(false);

  return (
    <div className="grid grid-cols-[16px_1fr_1fr_16px_16px] gap-1.5 items-center">
      <input
        type="checkbox"
        checked={variable.enabled}
        onChange={(e) => onUpdate({ enabled: e.target.checked })}
        className="w-3.5 h-3.5 accent-blue-500"
      />
      <input
        type="text"
        value={variable.key}
        onChange={(e) => onUpdate({ key: e.target.value })}
        placeholder="Variable name"
        className="bg-[#111120] border border-[#1e1e2e] rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500/50"
      />
      <div className="relative">
        <input
          type={variable.sensitive && !showValue ? 'password' : 'text'}
          value={variable.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder="value"
          className="w-full bg-[#111120] border border-[#1e1e2e] rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500/50 pr-6"
        />
        {variable.sensitive && (
          <button
            onClick={() => setShowValue((s) => !s)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
          >
            {showValue ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
      </div>
      <button
        onClick={() => onUpdate({ sensitive: !variable.sensitive })}
        className={cn('transition-colors', variable.sensitive ? 'text-amber-400' : 'text-gray-700 hover:text-gray-400')}
        title={variable.sensitive ? 'Mark as public' : 'Mark as sensitive'}
      >
        <Eye className="w-3.5 h-3.5" />
      </button>
      <button onClick={onRemove} className="text-gray-700 hover:text-red-400 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function EnvironmentManager() {
  const { isEnvironmentOpen, setEnvironmentOpen } = useAppStore();
  const {
    environments, activeEnvironmentId,
    addEnvironment, removeEnvironment, updateEnvironment,
    setActiveEnvironment,
    addVariable, updateVariable, removeVariable,
  } = useEnvironmentStore();

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(activeEnvironmentId ?? environments[0]?.id ?? null);
  const selectedEnv = environments.find((e) => e.id === selectedEnvId);

  const handleAddEnv = () => {
    const id = addEnvironment({
      name: 'New Environment',
      description: '',
      isActive: false,
      color: '#6366f1',
      variables: [
        {
          id: generateId(),
          key: 'baseUrl',
          value: 'https://localhost:5000/v1/api',
          description: 'Base URL',
          enabled: true,
          sensitive: false,
        },
      ],
    });
    setSelectedEnvId(id);
  };

  return (
    <Dialog open={isEnvironmentOpen} onOpenChange={setEnvironmentOpen}>
      <DialogContent className="bg-[#0d0d1a] border-[#1e1e2e] text-gray-200 max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-purple-400" />
            Environment Manager
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {/* Env list */}
          <div className="w-48 flex-shrink-0 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Environments</span>
              <Button size="sm" variant="ghost" onClick={handleAddEnv} className="h-5 w-5 p-0 text-gray-600 hover:text-gray-300">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-0.5">
                {environments.map((env) => (
                  <button
                    key={env.id}
                    onClick={() => setSelectedEnvId(env.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left',
                      selectedEnvId === env.id
                        ? 'bg-[#1e1e3e] text-white'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#141420]'
                    )}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: env.color }} />
                    <span className="truncate flex-1">{env.name}</span>
                    {activeEnvironmentId === env.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Env editor */}
          {selectedEnv ? (
            <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">
              {/* Env name + color */}
              <div className="flex gap-2 flex-shrink-0">
                <input
                  type="color"
                  value={selectedEnv.color}
                  onChange={(e) => updateEnvironment(selectedEnv.id, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-[#2a2a3e] bg-transparent"
                />
                <Input
                  value={selectedEnv.name}
                  onChange={(e) => updateEnvironment(selectedEnv.id, { name: e.target.value })}
                  className="flex-1 bg-[#111120] border-[#2a2a3e] text-sm text-gray-200 focus-visible:ring-blue-500/50"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setActiveEnvironment(selectedEnv.id); toast.success(`${selectedEnv.name} is now active`); }}
                  className={cn(
                    'text-xs border-[#2a2a3e] px-3',
                    activeEnvironmentId === selectedEnv.id
                      ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                      : 'text-gray-500 bg-[#111120] hover:text-gray-200'
                  )}
                >
                  {activeEnvironmentId === selectedEnv.id ? '✓ Active' : 'Set Active'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    removeEnvironment(selectedEnv.id);
                    setSelectedEnvId(environments.find((e) => e.id !== selectedEnv.id)?.id ?? null);
                  }}
                  className="text-gray-600 hover:text-red-400 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col min-h-0 border border-[#1e1e2e] rounded-lg">
                <EnvironmentInspector envId={selectedEnv.id} />
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => addVariable(selectedEnv.id, { key: '', value: '', description: '', enabled: true, sensitive: false })}
                className="flex-shrink-0 text-xs text-gray-600 hover:text-blue-400 gap-1.5 justify-start"
              >
                <Plus className="w-3 h-3" />
                Add variable
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-600">
              Select or create an environment
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
