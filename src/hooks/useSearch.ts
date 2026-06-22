'use client';

import { useMemo } from 'react';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { ParsedEndpoint } from '@/types/endpoint';

interface SearchResult {
  endpoint: ParsedEndpoint;
  score: number;
  matchType: 'path' | 'summary' | 'tag' | 'description' | 'operationId' | 'parameter';
}

function scoreMatch(endpoint: ParsedEndpoint, query: string): SearchResult | null {
  if (!query.trim()) return null;

  const q = query.toLowerCase().trim();
  let score = 0;
  let matchType: SearchResult['matchType'] = 'path';

  // Path match (highest priority)
  if (endpoint.path.toLowerCase().includes(q)) {
    score += endpoint.path.toLowerCase() === q ? 100 : endpoint.path.toLowerCase().startsWith(q) ? 80 : 60;
    matchType = 'path';
  }

  // Method + path match
  const methodPath = `${endpoint.method.toLowerCase()} ${endpoint.path.toLowerCase()}`;
  if (methodPath.includes(q)) {
    score += 50;
    matchType = 'path';
  }

  // Summary match
  if (endpoint.summary.toLowerCase().includes(q)) {
    score += 40;
    matchType = 'summary';
  }

  // OperationId match
  if (endpoint.operationId.toLowerCase().includes(q)) {
    score += 35;
    matchType = 'operationId';
  }

  // Tag match
  if (endpoint.tags.some((t) => t.toLowerCase().includes(q))) {
    score += 30;
    matchType = 'tag';
  }

  // Description match
  if (endpoint.description.toLowerCase().includes(q)) {
    score += 20;
    matchType = 'description';
  }

  // Parameter match
  if (endpoint.parameters.some((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))) {
    score += 15;
    matchType = 'parameter';
  }

  // Category match
  if (endpoint.ibkrCategory.toLowerCase().includes(q)) {
    score += 25;
    matchType = 'tag';
  }

  return score > 0 ? { endpoint, score, matchType } : null;
}

export function useSearch() {
  const { endpoints, searchQuery } = useEndpointStore();

  const results = useMemo(() => {
    if (!searchQuery.trim()) return endpoints;

    const scored = endpoints
      .map((e) => scoreMatch(e, searchQuery))
      .filter((r): r is SearchResult => r !== null)
      .sort((a, b) => b.score - a.score);

    return scored.map((r) => r.endpoint);
  }, [endpoints, searchQuery]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, ParsedEndpoint[]>();
    for (const endpoint of results) {
      const key = endpoint.ibkrCategory;
      const group = groups.get(key) ?? [];
      group.push(endpoint);
      groups.set(key, group);
    }
    return groups;
  }, [results]);

  return {
    results,
    groupedResults,
    totalCount: endpoints.length,
    resultCount: results.length,
    hasQuery: !!searchQuery.trim(),
  };
}
