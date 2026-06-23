'use client';

import { useCallback, useState } from 'react';
import * as YAML from 'js-yaml';
import { OpenApiSpec } from '@/types/openapi';
import { ParsedEndpoint } from '@/types/endpoint';
import { parseOpenApiSpec } from '@/lib/parsers/openapi-parser';
import { detectSpecVersion, convertSwaggerToOpenApi } from '@/lib/parsers/swagger-parser';
import { isIBKRSpec } from '@/lib/parsers/ibkr-classifier';
import { useOpenApiStore } from '@/stores/useOpenApiStore';
import { useEndpointStore } from '@/stores/useEndpointStore';

interface ParseResult {
  spec: OpenApiSpec;
  endpoints: ParsedEndpoint[];
  isIBKR: boolean;
  version: 'openapi3' | 'swagger2' | 'unknown';
  title: string;
  endpointCount: number;
}

interface UseOpenApiParserResult {
  isLoading: boolean;
  error: string | null;
  parseFromText: (text: string, source: 'file' | 'url' | 'paste', name?: string, sourceUrl?: string) => Promise<ParseResult | null>;
  parseFromUrl: (url: string) => Promise<ParseResult | null>;
  parseFromFile: (file: File) => Promise<ParseResult | null>;
}

export function useOpenApiParser(): UseOpenApiParserResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addSpec } = useOpenApiStore();
  const { setEndpoints } = useEndpointStore();

  const parseFromText = useCallback(
    async (
      text: string,
      source: 'file' | 'url' | 'paste',
      name?: string,
      sourceUrl?: string
    ): Promise<ParseResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        let raw: Record<string, unknown>;
        let spec: OpenApiSpec;

        try {
          raw = JSON.parse(text);
        } catch {
          raw = YAML.load(text) as Record<string, unknown>;
        }

        if (!raw || typeof raw !== 'object') {
          throw new Error('Invalid specification: not an object');
        }

        const version = detectSpecVersion(raw);

        let endpoints: ParsedEndpoint[];

        if (version === 'swagger2') {
          spec = convertSwaggerToOpenApi(raw as unknown as Parameters<typeof convertSwaggerToOpenApi>[0]);
          endpoints = parseOpenApiSpec(spec);
        } else {
          spec = raw as unknown as OpenApiSpec;
          if (!spec.paths) spec.paths = {};
          endpoints = parseOpenApiSpec(spec);
        }

        const paths = Object.keys(spec.paths ?? {});
        const ibkr = isIBKRSpec(paths);
        const title = name ?? spec.info?.title ?? 'Imported API';

        addSpec({
          name: title,
          source,
          sourceUrl,
          rawContent: text,
          spec,
          importedAt: Date.now(),
          endpointCount: endpoints.length,
          isActive: true,
        });

        setEndpoints(endpoints);

        return {
          spec,
          endpoints,
          isIBKR: ibkr,
          version,
          title,
          endpointCount: endpoints.length,
        };
      } catch (err) {
        const msg = (err as Error).message;
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addSpec, setEndpoints]
  );

  const parseFromUrl = useCallback(
    async (url: string): Promise<ParseResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();
        return await parseFromText(text, 'url', undefined, url);
      } catch (err) {
        const msg = (err as Error).message;
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [parseFromText]
  );

  const parseFromFile = useCallback(
    async (file: File): Promise<ParseResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const text = await file.text();
        return await parseFromText(text, 'file', file.name);
      } catch (err) {
        const msg = (err as Error).message;
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [parseFromText]
  );

  return { isLoading, error, parseFromText, parseFromUrl, parseFromFile };
}
