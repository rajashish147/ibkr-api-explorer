'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JsonNodeProps {
  data: unknown;
  depth?: number;
  keyName?: string;
  isLast?: boolean;
}

function JsonNode({ data, depth = 0, keyName, isLast = true }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 3);

  const renderKey = keyName !== undefined ? (
    <span className="text-blue-300 mr-1">&quot;{keyName}&quot;<span className="text-gray-600">: </span></span>
  ) : null;

  if (data === null) {
    return (
      <div style={{ marginLeft: depth * 16 }} className="py-0.5">
        {renderKey}<span className="text-gray-500">null</span>
        {!isLast && <span className="text-gray-700">,</span>}
      </div>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <div style={{ marginLeft: depth * 16 }} className="py-0.5">
        {renderKey}<span className="text-purple-400">{String(data)}</span>
        {!isLast && <span className="text-gray-700">,</span>}
      </div>
    );
  }

  if (typeof data === 'number') {
    return (
      <div style={{ marginLeft: depth * 16 }} className="py-0.5">
        {renderKey}<span className="text-amber-400">{data}</span>
        {!isLast && <span className="text-gray-700">,</span>}
      </div>
    );
  }

  if (typeof data === 'string') {
    const isUrl = data.startsWith('http');
    return (
      <div style={{ marginLeft: depth * 16 }} className="py-0.5 break-all">
        {renderKey}
        {isUrl ? (
          <a href={data} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
            &quot;{data}&quot;
          </a>
        ) : (
          <span className="text-emerald-400">&quot;{data}&quot;</span>
        )}
        {!isLast && <span className="text-gray-700">,</span>}
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div style={{ marginLeft: depth * 16 }} className="py-0.5">
          {renderKey}<span className="text-gray-500">[]</span>
          {!isLast && <span className="text-gray-700">,</span>}
        </div>
      );
    }

    return (
      <div style={{ marginLeft: depth * 16 }}>
        <div
          className="flex items-center py-0.5 cursor-pointer hover:bg-[#1a1a2e] rounded -mx-1 px-1"
          onClick={() => setIsExpanded((e) => !e)}
        >
          {renderKey}
          <span className="text-gray-600 mr-1">
            {isExpanded ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronRight className="w-3 h-3 inline" />}
          </span>
          <span className="text-gray-600">[{!isExpanded && `${data.length} items`}</span>
          {!isExpanded && <><span className="text-gray-600">]</span>{!isLast && <span className="text-gray-700">,</span>}</>}
        </div>
        {isExpanded && (
          <>
            {data.map((item, i) => (
              <JsonNode key={i} data={item} depth={depth + 1} isLast={i === data.length - 1} />
            ))}
            <div style={{ marginLeft: depth * 16 }} className="py-0.5">
              <span className="text-gray-600">]</span>
              {!isLast && <span className="text-gray-700">,</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data as Record<string, unknown>);
    if (keys.length === 0) {
      return (
        <div style={{ marginLeft: depth * 16 }} className="py-0.5">
          {renderKey}<span className="text-gray-500">{'{}'}</span>
          {!isLast && <span className="text-gray-700">,</span>}
        </div>
      );
    }

    return (
      <div style={{ marginLeft: depth * 16 }}>
        <div
          className="flex items-center py-0.5 cursor-pointer hover:bg-[#1a1a2e] rounded -mx-1 px-1"
          onClick={() => setIsExpanded((e) => !e)}
        >
          {renderKey}
          <span className="text-gray-600 mr-1">
            {isExpanded ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronRight className="w-3 h-3 inline" />}
          </span>
          <span className="text-gray-600">{'{'}</span>
          {!isExpanded && <><span className="text-gray-700 text-[11px] ml-1">{keys.length} props</span><span className="text-gray-600">{'}'}</span>{!isLast && <span className="text-gray-700">,</span>}</>}
        </div>
        {isExpanded && (
          <>
            {keys.map((key, i) => (
              <JsonNode
                key={key}
                keyName={key}
                data={(data as Record<string, unknown>)[key]}
                depth={depth + 1}
                isLast={i === keys.length - 1}
              />
            ))}
            <div style={{ marginLeft: depth * 16 }} className="py-0.5">
              <span className="text-gray-600">{'}'}</span>
              {!isLast && <span className="text-gray-700">,</span>}
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}

interface JsonViewerProps {
  data: unknown;
  rawText: string;
}

export function JsonViewer({ data, rawText }: JsonViewerProps) {
  const isJson = data !== null && typeof data === 'object';

  return (
    <ScrollArea className="h-full">
      <div className="p-3 font-mono text-xs">
        {isJson ? (
          <JsonNode data={data} />
        ) : (
          <pre className="text-gray-400 whitespace-pre-wrap break-all">{rawText || '(empty)'}</pre>
        )}
      </div>
    </ScrollArea>
  );
}
