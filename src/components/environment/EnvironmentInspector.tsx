'use client';

import React, { useState } from 'react';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { EnvironmentVariable } from '@/types/environment';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Trash2, Edit2, RotateCcw, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';

export function EnvironmentInspector({ envId }: { envId: string }) {
  const { environments, updateVariable, removeVariable } = useEnvironmentStore();
  const env = environments.find(e => e.id === envId);
  
  if (!env) return null;

  return (
    <div className="flex flex-col h-full bg-[#0d0d1a]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          Variable Inspector
        </h3>
        <span className="text-xs text-gray-500">{env.variables.length} Variables</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {env.variables.map(variable => (
            <InspectorCard 
              key={variable.id}
              envId={envId}
              variable={variable}
              onUpdate={(updates) => updateVariable(envId, variable.id, updates)}
              onRemove={() => removeVariable(envId, variable.id)}
            />
          ))}
          {env.variables.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-xs">
              No variables found in this environment.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function InspectorCard({ 
  envId, 
  variable, 
  onUpdate, 
  onRemove 
}: { 
  envId: string;
  variable: EnvironmentVariable;
  onUpdate: (updates: Partial<EnvironmentVariable>) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(variable.value);

  const handleCopy = () => {
    navigator.clipboard.writeText(`{{${variable.key}}}`);
    toast.success(`Copied {{${variable.key}}} to clipboard`);
  };

  const handleSave = () => {
    onUpdate({ value: editValue, source: 'Manual edit', updatedAt: Date.now() });
    setIsEditing(false);
    toast.success('Variable updated');
  };

  const handleReset = () => {
    onUpdate({ value: '', source: 'Reset', updatedAt: Date.now() });
    toast.success('Variable reset');
  };

  const timeAgo = variable.updatedAt 
    ? new Date(variable.updatedAt).toLocaleTimeString() 
    : 'Never';

  return (
    <div className="bg-[#111120] border border-[#1e1e2e] rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-mono font-bold text-blue-400">{variable.key}</span>
          <div className="text-[10px] text-gray-500 mt-0.5 flex gap-3">
            <span>Source: <span className="text-gray-300">{variable.source || 'Manual'}</span></span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-200" onClick={handleCopy}>
            <Copy className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-blue-400" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-amber-400" onClick={handleReset}>
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-red-400" onClick={onRemove}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="mt-1">
        {isEditing ? (
          <div className="flex gap-2">
            <Input 
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-7 text-xs font-mono bg-[#0a0a0f] border-[#2a2a3e]"
              placeholder="Value"
            />
            <Button size="sm" onClick={handleSave} className="h-7 px-3 bg-blue-600 hover:bg-blue-500 text-xs">Save</Button>
          </div>
        ) : (
          <div className="text-xs font-mono text-gray-300 truncate bg-[#0a0a0f] px-2 py-1.5 rounded border border-[#1e1e2e]">
            {variable.sensitive ? '••••••••' : (variable.value || <span className="text-gray-600 italic">empty</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
