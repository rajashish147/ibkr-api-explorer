'use client';

import { useCallback } from 'react';
import { executeRequest, ExecuteRequestOptions } from '@/lib/request-executor';
import { mergeCookieHeaders } from '@/lib/ibkr-session';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { useResponseStore } from '@/stores/useResponseStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useEndpointStore } from '@/stores/useEndpointStore';
import { RequestConfig } from '@/types/endpoint';

export function useRequestExecutor() {
  const { getActiveVariables, setVariableValue } = useEnvironmentStore();
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
          signal: controller.signal,
          onLog: addLog,
        };

        const response = await executeRequest(options);

        // Extract variables from response
        if (response.body) {
          import('@/lib/response-extractor').then(({ runExtractionEngine }) => {
            const extracted = runExtractionEngine(config.method, response.url, response.body);
            let hasExtractions = false;
            for (const [key, value] of Object.entries(extracted)) {
              setVariableValue(key, value);
              hasExtractions = true;
            }
            if (hasExtractions) {
              addLog('info', `Auto-extracted variables: ${Object.keys(extracted).join(', ')}`);
            }
          }).catch(err => {
            addLog('error', `Failed to run extraction engine: ${(err as Error).message}`);
          });
        }

        if (response.capturedSetCookies?.length) {
          const currentCookie = getActiveVariables().find((variable) => variable.key === 'sessionCookie')?.value;
          const mergedCookie = mergeCookieHeaders(currentCookie, response.capturedSetCookies);
          setVariableValue('sessionCookie', mergedCookie);
          addLog('info', 'IBKR session cookie saved to environment');
        }

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
    [currentRequest, getActiveVariables, setVariableValue, setResponse, setStatus, addLog, clearLogs, setAbortController, addEntry, selectedEndpointId]
  );

  return { execute };
}
