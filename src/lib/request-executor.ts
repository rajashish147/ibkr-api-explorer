import { RequestConfig, RequestParam } from '@/types/endpoint';
import { ApiResponse } from '@/types/response';
import { EnvironmentVariable } from '@/types/environment';
import { resolveVariables } from './variable-resolver';
import { generateId } from './utils';

export interface ExecuteRequestOptions {
  config: RequestConfig;
  variables: EnvironmentVariable[];
  signal?: AbortSignal;
  onLog?: (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: unknown) => void;
}

function buildHeaders(
  params: RequestParam[],
  variables: EnvironmentVariable[],
  auth: RequestConfig['auth']
): Record<string, string> {
  const headers: Record<string, string> = {};

  // From param list
  for (const p of params.filter((p) => p.enabled)) {
    const key = resolveVariables(p.name, variables);
    const value = resolveVariables(p.value, variables);
    if (key) headers[key] = value;
  }

  // Auth headers
  switch (auth.type) {
    case 'bearer':
      if (auth.bearerToken) {
        headers['Authorization'] = `Bearer ${resolveVariables(auth.bearerToken, variables)}`;
      }
      break;
    case 'basic':
      if (auth.basicUsername && auth.basicPassword) {
        const credentials = btoa(
          `${resolveVariables(auth.basicUsername, variables)}:${resolveVariables(auth.basicPassword, variables)}`
        );
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
    case 'apikey':
      if (auth.apiKeyName && auth.apiKeyValue && auth.apiKeyLocation === 'header') {
        headers[resolveVariables(auth.apiKeyName, variables)] = resolveVariables(auth.apiKeyValue, variables);
      }
      break;
    case 'cookie':
    case 'session':
      if (auth.cookieValue) {
        headers['Cookie'] = resolveVariables(auth.cookieValue, variables);
      }
      break;
  }

  return headers;
}

function buildQueryString(
  params: RequestParam[],
  variables: EnvironmentVariable[],
  auth: RequestConfig['auth']
): Record<string, string> {
  const query: Record<string, string> = {};

  for (const p of params.filter((p) => p.enabled)) {
    const key = resolveVariables(p.name, variables);
    const value = resolveVariables(p.value, variables);
    if (key) query[key] = value;
  }

  if (auth.type === 'apikey' && auth.apiKeyLocation === 'query' && auth.apiKeyName && auth.apiKeyValue) {
    query[resolveVariables(auth.apiKeyName, variables)] = resolveVariables(auth.apiKeyValue, variables);
  }

  return query;
}

function resolvePathParams(path: string, params: RequestParam[], variables: EnvironmentVariable[]): string {
  let resolved = path;
  for (const p of params.filter((p) => p.enabled)) {
    const value = resolveVariables(p.value, variables);
    resolved = resolved.replace(`{${p.name}}`, encodeURIComponent(value));
    resolved = resolved.replace(`{{${p.name}}}`, encodeURIComponent(value));
  }
  return resolved;
}

function shouldUseIbkrProxy(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.port === '5000';
  } catch {
    return false;
  }
}

interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  error?: string;
  detail?: string;
}

export async function executeRequest(options: ExecuteRequestOptions): Promise<ApiResponse> {
  const { config, variables, signal, onLog } = options;
  const startTime = Date.now();

  onLog?.('info', `Executing ${config.method} ${config.url}`);

  // Resolve URL
  let resolvedUrl = resolveVariables(config.url, variables);

  // Resolve path params
  resolvedUrl = resolvePathParams(resolvedUrl, config.pathParams, variables);

  // Build query string
  const queryParams = buildQueryString(config.queryParams, variables, config.auth);
  const urlObj = new URL(resolvedUrl);
  for (const [key, value] of Object.entries(queryParams)) {
    urlObj.searchParams.set(key, value);
  }
  const finalUrl = urlObj.toString();

  // Build headers
  const headers = buildHeaders(config.headers, variables, config.auth);

  // Build body
  let body: BodyInit | null = null;
  if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.bodyType !== 'none' && config.body) {
    const resolvedBody = resolveVariables(config.body, variables);
    body = resolvedBody;
    if (config.bodyType === 'json' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  onLog?.('debug', 'Request headers:', headers);
  onLog?.('debug', 'Final URL:', finalUrl);
  if (body) onLog?.('debug', 'Request body:', body);

  try {
    const fetchOptions: RequestInit = {
      method: config.method,
      headers,
      body: body,
      credentials: 'include',
      signal,
    };

    const useProxy = shouldUseIbkrProxy(finalUrl);
    if (useProxy) {
      onLog?.('info', 'Routing request through local IBKR proxy');
    }

    const response = useProxy
      ? await fetch('/api/ibkr-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: finalUrl,
            method: config.method,
            headers,
            body,
          }),
          signal,
        })
      : await fetch(finalUrl, fetchOptions);
    const duration = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let rawBody = await response.text();
    let status = response.status;
    let statusText = response.statusText;
    let headersForResult = responseHeaders;

    if (useProxy) {
      let proxyBody: ProxyResponse;

      try {
        proxyBody = JSON.parse(rawBody) as ProxyResponse;
      } catch {
        throw new Error(`Invalid proxy response: ${rawBody}`);
      }

      if (!response.ok || proxyBody.error) {
        throw new Error(proxyBody.detail || proxyBody.error || `Proxy failed with HTTP ${response.status}`);
      }

      rawBody = proxyBody.body;
      status = proxyBody.status;
      statusText = proxyBody.statusText;
      headersForResult = proxyBody.headers;
    }

    let parsedBody: unknown = rawBody;

    const contentType = Object.entries(headersForResult).find(([key]) => key.toLowerCase() === 'content-type')?.[1] ?? '';
    if (contentType.includes('application/json')) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        // keep rawBody as string
      }
    }

    const size = new TextEncoder().encode(rawBody).length;

    onLog?.('info', `Response: ${status} ${statusText} (${duration}ms)`);

    return {
      id: generateId(),
      status,
      statusText,
      headers: headersForResult,
      body: parsedBody,
      rawBody,
      size,
      duration,
      timestamp: Date.now(),
      requestConfig: config,
      url: finalUrl,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    const error = err as Error;

    const message = error.name === 'AbortError' ? 'Request cancelled' : error.message;

    onLog?.('error', `Request failed: ${message}`);

    return {
      id: generateId(),
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: null,
      rawBody: '',
      size: 0,
      duration,
      timestamp: Date.now(),
      requestConfig: config,
      url: finalUrl,
      error: message,
    };
  }
}

export function extractVariablesFromResponse(
  body: unknown,
  paths: Array<{ key: string; path: string }>
): Record<string, string> {
  const extracted: Record<string, string> = {};

  for (const { key, path } of paths) {
    try {
      const parts = path.split('.');
      let current: unknown = body;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current !== undefined && current !== null) {
        extracted[key] = String(current);
      }
    } catch {
      // skip failed extractions
    }
  }

  return extracted;
}
