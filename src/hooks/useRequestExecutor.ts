'use client';

import { useCallback } from 'react';
import { executeRequest, ExecuteRequestOptions } from '@/lib/request-executor';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useResponseStore } from '@/stores/useResponseStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { RequestConfig } from '@/types/endpoint';

export function useRequestExecutor() {
  const { getActiveVariables } = useEnvironmentStore();
  const { setResponse, setStatus, addLog, clearLogs, setAbortController } = useResponseStore();
  const { addEntry } = useHistoryStore();
  const { currentRequest, selectedEndpointId } = useEndpointStore();

  const execute = useCallback(
    async (overrideConfig?: Partial<RequestConfig>) => {
      const config = { ...currentRequest, ...overrideConfig };
      const variables = getActiveVariables();

      clearLogs();
      setStatus('loading');

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const options: ExecuteRequestOptions = {
          config,
          variables,
          onLog: addLog,
        };

        const response = await executeRequest(options);

        if (response.error && response.status === 0) {
          setStatus('error');
        } else {
          setStatus('success');
        }

        setResponse(response);
        setAbortController(null);

        // Add to history
        addEntry({
          method: config.method,
          url: response.url,
          status: response.status,
          duration: response.duration,
          timestamp: response.timestamp,
          requestConfig: config,
          response,
          endpointId: selectedEndpointId ?? undefined,
        });

        return response;
      } catch (err) {
        setStatus('error');
        setAbortController(null);
        addLog('error', `Unexpected error: ${(err as Error).message}`);
        return null;
      }
    },
    [currentRequest, getActiveVariables, setResponse, setStatus, addLog, clearLogs, setAbortController, addEntry, selectedEndpointId]
  );

  return { execute };
}
