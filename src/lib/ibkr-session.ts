import { EnvironmentVariable } from '@/types/environment';

export function parseCookiePairs(cookieHeader: string): Map<string, string> {
  const pairs = new Map<string, string>();

  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    pairs.set(trimmed.slice(0, separator), trimmed.slice(separator + 1));
  }

  return pairs;
}

export function mergeCookieHeaders(existing: string | undefined, setCookies: string[]): string {
  const pairs = parseCookiePairs(existing ?? '');

  for (const setCookie of setCookies) {
    const firstPair = setCookie.split(';')[0]?.trim();
    if (!firstPair) continue;

    const separator = firstPair.indexOf('=');
    if (separator <= 0) continue;

    pairs.set(firstPair.slice(0, separator), firstPair.slice(separator + 1));
  }

  return Array.from(pairs.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

export function getSessionCookieFromVariables(variables: EnvironmentVariable[]): string | undefined {
  const entry = variables.find((variable) => variable.key === 'sessionCookie' && variable.enabled && variable.value);
  return entry?.value;
}
