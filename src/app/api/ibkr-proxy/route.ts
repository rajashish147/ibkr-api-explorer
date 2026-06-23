import http from 'node:http';
import https from 'node:https';
import { Buffer } from 'node:buffer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProxyPayload = {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string | null;
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const LOCAL_GATEWAY_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function getConfiguredGatewayOrigins(): Set<string> {
  const origins = new Set<string>();

  for (const origin of (process.env.IBKR_GATEWAY_ORIGIN ?? '').split(',')) {
    const trimmed = origin.trim();
    if (!trimmed) continue;
    origins.add(new URL(trimmed).origin);
  }

  return origins;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

function isAllowedGatewayHost(hostname: string): boolean {
  return LOCAL_GATEWAY_HOSTS.has(hostname) || isPrivateIpv4(hostname) || hostname.endsWith('.local');
}

function isAllowedGatewayUrl(url: URL): boolean {
  const configuredOrigins = getConfiguredGatewayOrigins();
  if (configuredOrigins.size > 0 && configuredOrigins.has(url.origin)) {
    return true;
  }

  return url.port === '5000' && isAllowedGatewayHost(url.hostname);
}

function cleanHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  const nextHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers ?? {})) {
    const normalizedKey = key.toLowerCase();
    if (!value || HOP_BY_HOP_HEADERS.has(normalizedKey)) continue;
    nextHeaders[key] = value;
  }

  return nextHeaders;
}

function buildGatewayHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  return {
    ...cleanHeaders(headers),
    Host: 'localhost:5000',
  };
}

function forwardToGateway(payload: Required<Pick<ProxyPayload, 'url' | 'method'>> & ProxyPayload) {
  return new Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
  }>((resolve, reject) => {
    const target = new URL(payload.url);
    const transport = target.protocol === 'https:' ? https : http;
    const requestBody = payload.body ?? undefined;

    const request = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method: payload.method,
        headers: buildGatewayHeaders(payload.headers),
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on('end', () => {
          const responseHeaders: Record<string, string> = {};

          for (const [key, value] of Object.entries(response.headers)) {
            if (Array.isArray(value)) {
              responseHeaders[key] = value.join(', ');
            } else if (typeof value === 'string') {
              responseHeaders[key] = value;
            }
          }

          resolve({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? '',
            headers: responseHeaders,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );

    request.on('error', reject);

    if (requestBody) {
      request.write(requestBody);
    }

    request.end();
  });
}

function formatProxyError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  const message = error.message || code || error.name;
  return code && !message.includes(code) ? `${code}: ${message}` : message;
}

export async function POST(request: Request) {
  let payload: ProxyPayload;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid proxy payload' }, { status: 400 });
  }

  if (!payload.url || !payload.method) {
    return Response.json({ error: 'Proxy payload requires url and method' }, { status: 400 });
  }

  let target: URL;

  try {
    target = new URL(payload.url);
  } catch {
    return Response.json({ error: 'Proxy payload has an invalid url' }, { status: 400 });
  }

  if (!isAllowedGatewayUrl(target)) {
    return Response.json(
      {
        error: 'Target URL is not allowed',
        detail:
          'The IBKR proxy forwards to localhost, private LAN hosts on port 5000, or origins listed in IBKR_GATEWAY_ORIGIN.',
      },
      { status: 403 }
    );
  }

  try {
    const response = await forwardToGateway({ ...payload, url: target.toString(), method: payload.method });
    return Response.json(response);
  } catch (error) {
    return Response.json(
      {
        error: 'Gateway request failed',
        detail: formatProxyError(error),
      },
      { status: 502 }
    );
  }
}
