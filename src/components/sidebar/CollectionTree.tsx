'use client';

import React, { useState } from 'react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { CollectionItem, SavedRequest } from '@/types/collection';
import { getMethodBg, cn, downloadJson } from '@/lib/utils';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen, Plus, MoreHorizontal,
  Trash2, Copy, Download, Play, FileJson
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CollectionItemRowProps {
  item: CollectionItem;
  collectionId: string;
  depth: number;
}

function CollectionItemRow({ item, collectionId, depth }: CollectionItemRowProps) {
  const { removeItem, duplicateRequest, selectedItemId, setSelectedItem } = useCollectionStore();
  const { setRequestFromEndpoint, updateRequest } = useEndpointStore();
  const { getActiveEnvironment } = useEnvironmentStore();
  const [isExpanded, setIsExpanded] = useState(item.isExpanded ?? true);
  const isSelected = selectedItemId === item.id;

  const handleClick = () => {
    setSelectedItem(item.id);
    if (item.type === 'folder') {
      setIsExpanded((e) => !e);
    } else if (item.request) {
      // Load request into builder
      const env = getActiveEnvironment();
      const baseUrl = env?.variables.find((v) => v.key === 'baseUrl')?.value ?? '';
      updateRequest(item.request.config);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={cn(
          'group flex items-center gap-2 py-1.5 pr-2 cursor-pointer transition-colors rounded-md',
          isSelected ? 'bg-blue-600/20' : 'hover:bg-[#1a1a2e]'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {item.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-600 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}
            <span className="text-xs text-gray-400 flex-1 truncate">{item.name}</span>
          </>
        ) : (
          <>
            <div className="w-3 flex-shrink-0" />
            {item.request && (
              <span className={cn('text-[9px] font-bold px-1 rounded border font-mono flex-shrink-0', getMethodBg(item.request.config.method))}>
                {item.request.config.method}
              </span>
            )}
            <span className="text-xs text-gray-400 flex-1 truncate">{item.name}</span>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-600 hover:text-gray-300"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1e1e2e] border-[#2a2a3e] text-gray-300 text-xs">
            {item.type === 'request' && (
              <DropdownMenuItem onClick={() => duplicateRequest(collectionId, item.id)}>
                <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-[#2a2a3e]" />
            <DropdownMenuItem
              onClick={() => removeItem(collectionId, item.id)}
              className="text-red-400 focus:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <CollectionItemRow key={child.id} item={child} collectionId={collectionId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CollectionTree() {
  const { collections, addCollection, removeCollection, duplicateCollection, exportCollection, selectedCollectionId, setSelectedCollection } = useCollectionStore();
  const [newColName, setNewColName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newColName.trim()) {
      addCollection(newColName.trim());
      setNewColName('');
      setIsAdding(false);
    }
  };

  const handleExport = (id: string, name: string) => {
    const json = exportCollection(id);
    downloadJson(JSON.parse(json), `${name}.json`);
    toast.success('Collection exported');
  };

  return (
    <ScrollArea className="h-full">
      <div className="py-1">
        <div className="flex items-center justify-between px-3 py-1 mb-1">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Collections</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAdding(true)}
            className="h-5 w-5 p-0 text-gray-600 hover:text-gray-300"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {isAdding && (
          <div className="px-3 pb-2">
            <input
              autoFocus
              type="text"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder="Collection name..."
              className="w-full bg-[#141420] border border-blue-500/50 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none"
            />
          </div>
        )}

        {collections.length === 0 && !isAdding && (
          <div className="px-3 py-4 text-center">
            <FileJson className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600">No collections yet.</p>
            <p className="text-[11px] text-gray-700 mt-0.5">Save requests to organize them.</p>
          </div>
        )}

        {collections.map((col) => (
          <div key={col.id}>
            <div
              className={cn(
                'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                selectedCollectionId === col.id ? 'bg-[#1a1a2e]' : 'hover:bg-[#141420]'
              )}
              onClick={() => setSelectedCollection(selectedCollectionId === col.id ? null : col.id)}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-medium text-gray-300 flex-1 truncate">{col.name}</span>
              <span className="text-[10px] text-gray-600">{col.items.length}</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-600 hover:text-gray-300"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1e1e2e] border-[#2a2a3e] text-gray-300 text-xs">
                  <DropdownMenuItem onClick={() => { duplicateCollection(col.id); toast.success('Collection duplicated'); }}>
                    <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport(col.id, col.name)}>
                    <Download className="w-3.5 h-3.5 mr-2" /> Export
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2a2a3e]" />
                  <DropdownMenuItem
                    onClick={() => removeCollection(col.id)}
                    className="text-red-400 focus:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {selectedCollectionId === col.id && (
              <div className="ml-2 border-l border-[#2a2a3e]">
                {col.items.map((item) => (
                  <CollectionItemRow key={item.id} item={item} collectionId={col.id} depth={0} />
                ))}
                {col.items.length === 0 && (
                  <p className="text-[11px] text-gray-700 px-3 py-2">No requests saved yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
