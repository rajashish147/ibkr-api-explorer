'use client';

import React, { useState } from 'react';
import { OpenApiSchema } from '@/types/openapi';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchemaNodeProps {
  name?: string;
  schema: OpenApiSchema;
  required?: boolean;
  depth?: number;
}

function getTypeDisplay(schema: OpenApiSchema): string {
  if (schema.$ref) {
    const parts = schema.$ref.split('/');
    return parts[parts.length - 1];
  }
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (schema.nullable) types.push('null');
  const base = types.join(' | ') || (schema.properties ? 'object' : schema.items ? 'array' : 'any');
  if (schema.format) return `${base}<${schema.format}>`;
  return base;
}

const SchemaNode = React.memo(function SchemaNode({ name, schema, required, depth = 0 }: SchemaNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);

  const hasChildren =
    (schema.properties && Object.keys(schema.properties).length > 0) ||
    schema.items ||
    schema.allOf ||
    schema.anyOf ||
    schema.oneOf;

  const typeDisplay = getTypeDisplay(schema);
  const isRequired = required;

  return (
    <div className={cn('text-xs', depth > 0 && 'ml-4 border-l border-[#1e1e2e] pl-2')}>
      <div
        className={cn(
          'flex items-start gap-1.5 py-0.5 rounded',
          hasChildren && 'cursor-pointer hover:bg-[#1a1a2e]'
        )}
        onClick={() => hasChildren && setIsExpanded((e) => !e)}
      >
        <div className="w-4 flex-shrink-0 flex items-center justify-center mt-0.5">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            )
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {name && (
              <span className={cn('font-mono', isRequired ? 'text-gray-200' : 'text-gray-400')}>
                {name}
              </span>
            )}
            {isRequired && <span className="text-red-400 text-[10px]">*</span>}
            <span className="text-blue-400 font-mono text-[11px]">{typeDisplay}</span>
            {schema.deprecated && (
              <span className="text-amber-600 text-[10px] bg-amber-600/10 px-1 rounded">deprecated</span>
            )}
            {schema.readOnly && (
              <span className="text-purple-400 text-[10px] bg-purple-400/10 px-1 rounded">readOnly</span>
            )}
            {schema.writeOnly && (
              <span className="text-pink-400 text-[10px] bg-pink-400/10 px-1 rounded">writeOnly</span>
            )}
          </div>

          {schema.description && (
            <p className="text-[11px] text-gray-600 mt-0.5">{schema.description}</p>
          )}

          {schema.enum && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {schema.enum.map((v, i) => (
                <span key={i} className="text-[10px] bg-[#1a1a2e] border border-[#2a2a3e] px-1 rounded font-mono text-emerald-400">
                  {JSON.stringify(v)}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap text-[10px] text-gray-700 mt-0.5">
            {schema.minimum !== undefined && <span>min: {schema.minimum}</span>}
            {schema.maximum !== undefined && <span>max: {schema.maximum}</span>}
            {schema.minLength !== undefined && <span>minLen: {schema.minLength}</span>}
            {schema.maxLength !== undefined && <span>maxLen: {schema.maxLength}</span>}
            {schema.default !== undefined && <span>default: <span className="text-gray-500 font-mono">{JSON.stringify(schema.default)}</span></span>}
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-0.5">
          {/* Object properties */}
          {schema.properties && Object.entries(schema.properties).map(([propName, propSchema]) => (
            <SchemaNode
              key={propName}
              name={propName}
              schema={propSchema}
              required={schema.required?.includes(propName)}
              depth={depth + 1}
            />
          ))}

          {/* Array items */}
          {schema.items && !Array.isArray(schema.items) && (
            <SchemaNode name="[items]" schema={schema.items} depth={depth + 1} />
          )}

          {/* Composition */}
          {schema.allOf?.map((s, i) => (
            <SchemaNode key={`allOf-${i}`} name={`allOf[${i}]`} schema={s} depth={depth + 1} />
          ))}
          {schema.anyOf?.map((s, i) => (
            <SchemaNode key={`anyOf-${i}`} name={`anyOf[${i}]`} schema={s} depth={depth + 1} />
          ))}
          {schema.oneOf?.map((s, i) => (
            <SchemaNode key={`oneOf-${i}`} name={`oneOf[${i}]`} schema={s} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
});

interface SchemaViewerProps {
  schema: OpenApiSchema;
  className?: string;
}

export function SchemaViewer({ schema, className }: SchemaViewerProps) {
  return (
    <div className={cn('bg-[#0d0d1a] border border-[#1e1e2e] rounded-lg p-3 font-mono', className)}>
      <SchemaNode schema={schema} />
    </div>
  );
}
