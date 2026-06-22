'use client';

import React, { useEffect, useRef } from 'react';
import { OpenApiSchema } from '@/types/openapi';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';

interface BodyEditorProps {
  body: string;
  bodyType: 'json' | 'form' | 'raw' | 'none';
  schema: OpenApiSchema | null;
  onChange: (body: string, bodyType: 'json' | 'form' | 'raw' | 'none') => void;
}

export function BodyEditor({ body, bodyType, schema, onChange }: BodyEditorProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Type selector */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#1e1e2e] flex-shrink-0">
        <span className="text-[10px] text-gray-600 mr-2">Format:</span>
        {(['json', 'raw', 'none'] as const).map((type) => (
          <button
            key={type}
            onClick={() => onChange(body, type)}
            className={cn(
              'text-[11px] px-2 py-0.5 rounded transition-colors',
              bodyType === type
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-600 hover:text-gray-400'
            )}
          >
            {type === 'json' ? 'JSON' : type === 'raw' ? 'Text' : 'None'}
          </button>
        ))}
      </div>

      {bodyType !== 'none' ? (
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={bodyType === 'json' ? 'json' : 'plaintext'}
            value={body}
            onChange={(value) => onChange(value ?? '', bodyType)}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 8, bottom: 8 },
              renderLineHighlight: 'none',
              overviewRulerBorder: false,
              scrollbar: {
                verticalScrollbarSize: 4,
                horizontalScrollbarSize: 4,
              },
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-700">
          No request body
        </div>
      )}
    </div>
  );
}
