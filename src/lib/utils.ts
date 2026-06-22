import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { HttpMethod } from '@/types/openapi';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'text-emerald-400',
    POST: 'text-blue-400',
    PUT: 'text-amber-400',
    PATCH: 'text-orange-400',
    DELETE: 'text-red-400',
    HEAD: 'text-purple-400',
    OPTIONS: 'text-pink-400',
    TRACE: 'text-gray-400',
  };
  return colors[method.toUpperCase()] ?? 'text-gray-400';
}

export function getMethodBg(method: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    POST: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    PUT: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    PATCH: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
    DELETE: 'bg-red-400/10 text-red-400 border-red-400/20',
    HEAD: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
    OPTIONS: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
    TRACE: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
  };
  return colors[method.toUpperCase()] ?? 'bg-gray-400/10 text-gray-400 border-gray-400/20';
}

export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-emerald-400';
  if (status >= 300 && status < 400) return 'text-blue-400';
  if (status >= 400 && status < 500) return 'text-amber-400';
  if (status >= 500) return 'text-red-400';
  return 'text-gray-400';
}

export function getStatusBg(status: number): string {
  if (status >= 200 && status < 300) return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20';
  if (status >= 300 && status < 400) return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
  if (status >= 400 && status < 500) return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
  if (status >= 500) return 'bg-red-400/10 text-red-400 border-red-400/20';
  return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
}

export function tryParseJson(str: string): { success: true; data: unknown } | { success: false; error: string } {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function prettyJson(data: unknown, indent = 2): string {
  try {
    return JSON.stringify(data, null, indent);
  } catch {
    return String(data);
  }
}

export function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
}

export function buildUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>
): string {
  let resolvedPath = path;
  for (const [key, value] of Object.entries(pathParams)) {
    resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
  }
  const url = new URL(resolvedPath, baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
  for (const [key, value] of Object.entries(queryParams)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export function getContentType(headers: Record<string, string>): string {
  const ct = Object.entries(headers).find(([k]) => k.toLowerCase() === 'content-type');
  return ct ? ct[1] : '';
}

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([prettyJson(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
