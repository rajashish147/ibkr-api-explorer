'use client';

import { useCallback } from 'react';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useResponseStore } from '@/stores/useResponseStore';

const AUTO_EXTRACT_KEYS = [
  'accountId', 'acctId', 'account_id',
  'conid', 'conId', 'contractId',
  'orderId', 'order_id', 'id',
  'sessionToken', 'token', 'accessToken',
  'userId',
];

function deepSearch(obj: unknown, keys: string[]): Record<string, string> {
  const found: Record<string, string> = {};
  if (!obj || typeof obj !== 'object') return found;

  const search = (current: unknown, depth = 0): void => {
    if (depth > 5 || !current || typeof current !== 'object') return;
    for (const [k, v] of Object.entries(current as Record<string, unknown>)) {
      if (keys.includes(k) && (typeof v === 'string' || typeof v === 'number') && !found[k]) {
        found[k] = String(v);
      }
      if (typeof v === 'object') search(v, depth + 1);
    }
  };

  search(obj);
  return found;
}

export function useAutoExtract() {
  const { setVariableValue } = useEnvironmentStore();
  const { response } = useResponseStore();

  const extractFromResponse = useCallback(
    (customKeys?: string[]) => {
      if (!response?.body) return {};
      const keys = [...AUTO_EXTRACT_KEYS, ...(customKeys ?? [])];
      const extracted = deepSearch(response.body, keys);

      for (const [key, value] of Object.entries(extracted)) {
        // Normalize key name
        const normalizedKey = key === 'acctId' || key === 'account_id' ? 'accountId'
          : key === 'conId' || key === 'contractId' ? 'conid'
          : key === 'order_id' ? 'orderId'
          : key === 'accessToken' ? 'token'
          : key;
        setVariableValue(normalizedKey, value);
      }

      return extracted;
    },
    [response, setVariableValue]
  );

  const extractSpecificPath = useCallback(
    (path: string, variableKey: string) => {
      if (!response?.body) return null;
      const parts = path.split('.');
      let current: unknown = response.body;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return null;
        }
      }
      if (current !== undefined && current !== null) {
        const value = String(current);
        setVariableValue(variableKey, value);
        return value;
      }
      return null;
    },
    [response, setVariableValue]
  );

  return { extractFromResponse, extractSpecificPath };
}
