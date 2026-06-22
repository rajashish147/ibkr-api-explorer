import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ParsedEndpoint, RequestConfig, AuthConfig } from '@/types/endpoint';
import { generateId } from '@/lib/utils';
import { idbStorage } from '@/lib/idb-storage';

interface EndpointState {
  endpoints: ParsedEndpoint[];
  selectedEndpointId: string | null;
  searchQuery: string;
  expandedTags: Set<string>;
  favoriteIds: Set<string>;
  currentRequest: RequestConfig;

  setEndpoints: (endpoints: ParsedEndpoint[]) => void;
  addEndpoints: (endpoints: ParsedEndpoint[]) => void;
  clearEndpoints: () => void;
  selectEndpoint: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleTag: (tag: string) => void;
  expandAllTags: () => void;
  collapseAllTags: () => void;
  toggleFavorite: (id: string) => void;
  updateRequest: (updates: Partial<RequestConfig>) => void;
  resetRequest: () => void;
  setRequestFromEndpoint: (endpoint: ParsedEndpoint, baseUrl: string) => void;
}

const DEFAULT_AUTH: AuthConfig = {
  type: 'none',
};

const DEFAULT_REQUEST: RequestConfig = {
  method: 'GET',
  url: '',
  headers: [],
  queryParams: [],
  pathParams: [],
  body: '',
  bodyType: 'json',
  auth: DEFAULT_AUTH,
};

export const useEndpointStore = create<EndpointState>()(
  persist(
    (set, get) => ({
      endpoints: [],
      selectedEndpointId: null,
      searchQuery: '',
      expandedTags: new Set<string>(),
      favoriteIds: new Set<string>(),
      currentRequest: DEFAULT_REQUEST,

      setEndpoints: (endpoints) =>
        set({
          endpoints,
          selectedEndpointId: null,
          expandedTags: new Set(endpoints.flatMap((e) => e.tags)),
        }),

      addEndpoints: (endpoints) =>
        set((state) => ({
          endpoints: [...state.endpoints, ...endpoints],
        })),

      clearEndpoints: () =>
        set({ endpoints: [], selectedEndpointId: null, currentRequest: DEFAULT_REQUEST }),

      selectEndpoint: (id) => {
        set({ selectedEndpointId: id });
        if (id) {
          const endpoint = get().endpoints.find((e) => e.id === id);
          if (endpoint) {
            // Don't auto-set request here — done via setRequestFromEndpoint
          }
        }
      },

      setSearchQuery: (q) => set({ searchQuery: q }),

      toggleTag: (tag) =>
        set((state) => {
          const next = new Set(state.expandedTags);
          if (next.has(tag)) next.delete(tag);
          else next.add(tag);
          return { expandedTags: next };
        }),

      expandAllTags: () =>
        set((state) => ({
          expandedTags: new Set(state.endpoints.flatMap((e) => e.tags).concat(state.endpoints.map((e) => e.ibkrCategory))),
        })),

      collapseAllTags: () => set({ expandedTags: new Set() }),

      toggleFavorite: (id) =>
        set((state) => {
          const next = new Set(state.favoriteIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return {
            favoriteIds: next,
            endpoints: state.endpoints.map((e) =>
              e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
            ),
          };
        }),

      updateRequest: (updates) =>
        set((state) => ({ currentRequest: { ...state.currentRequest, ...updates } })),

      resetRequest: () => set({ currentRequest: DEFAULT_REQUEST }),

      setRequestFromEndpoint: (endpoint, baseUrl) => {
        const pathParams = endpoint.parameters
          .filter((p) => p.in === 'path')
          .map((p) => ({
            name: p.name,
            value: String(p.example ?? p.defaultValue ?? ''),
            enabled: true,
            description: p.description,
          }));

        const queryParams = endpoint.parameters
          .filter((p) => p.in === 'query')
          .map((p) => ({
            name: p.name,
            value: String(p.example ?? p.defaultValue ?? ''),
            enabled: p.required,
            description: p.description,
          }));

        const headers = endpoint.parameters
          .filter((p) => p.in === 'header')
          .map((p) => ({
            name: p.name,
            value: String(p.example ?? p.defaultValue ?? ''),
            enabled: p.required,
            description: p.description,
          }));

        let body = '';
        if (endpoint.requestBody?.example) {
          try {
            body = JSON.stringify(endpoint.requestBody.example, null, 2);
          } catch {
            body = String(endpoint.requestBody.example);
          }
        } else if (endpoint.requestBody?.schema) {
          body = generateExampleFromSchema(endpoint.requestBody.schema);
        }

        const url = `${baseUrl.replace(/\/$/, '')}${endpoint.path}`;

        set({
          currentRequest: {
            method: endpoint.method,
            url,
            headers,
            queryParams,
            pathParams,
            body,
            bodyType: endpoint.requestBody ? 'json' : 'none',
            auth: DEFAULT_AUTH,
          },
        });
      },
    }),
    {
      name: 'ibkr-endpoint-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        endpoints: state.endpoints,
        selectedEndpointId: state.selectedEndpointId,
        favoriteIds: Array.from(state.favoriteIds),
        currentRequest: state.currentRequest,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<EndpointState> & { favoriteIds?: string[] };
        return {
          ...current,
          ...p,
          favoriteIds: new Set(p.favoriteIds ?? []),
          expandedTags: new Set(p.endpoints?.flatMap((e) => e.tags) ?? []),
        };
      },
    }
  )
);

function generateExampleFromSchema(schema: import('@/types/openapi').OpenApiSchema): string {
  try {
    const example = buildExample(schema, 0);
    return JSON.stringify(example, null, 2);
  } catch {
    return '{}';
  }
}

function buildExample(schema: import('@/types/openapi').OpenApiSchema, depth: number): unknown {
  if (depth > 5) return null;
  if (!schema) return null;

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum && schema.enum.length > 0) return schema.enum[0];

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case 'object': {
      const obj: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(schema.properties ?? {})) {
        obj[key] = buildExample(prop, depth + 1);
      }
      return obj;
    }
    case 'array':
      return schema.items && !Array.isArray(schema.items) ? [buildExample(schema.items, depth + 1)] : [];
    case 'string':
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date') return new Date().toISOString().split('T')[0];
      return schema.pattern ? '' : 'string';
    case 'integer':
    case 'number':
      return schema.minimum ?? 0;
    case 'boolean':
      return false;
    default:
      return null;
  }
}
