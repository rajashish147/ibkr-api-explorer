import { RequestConfig } from './endpoint';

export interface ApiResponse {
  id: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  rawBody: string;
  size: number;
  duration: number;
  timestamp: number;
  requestConfig: RequestConfig;
  url: string;
  error?: string;
  capturedSetCookies?: string[];
}

export type ResponseStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ConsoleLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
  data?: unknown;
}

export interface HistoryEntry {
  id: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  timestamp: number;
  requestConfig: RequestConfig;
  response?: ApiResponse;
  endpointId?: string;
}
