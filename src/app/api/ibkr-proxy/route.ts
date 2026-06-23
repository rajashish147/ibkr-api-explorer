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

const LOCAL_GATEWAY_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function isAllowedGatewayUrl(url: URL): boolean {
  const configured = process.env.IBKR_GATEWAY_ORIGIN;
  if (configured) {
    const allowed = new URL(configured);
    return url.origin === allowed.origin;
  }

  return LOCAL_GATEWAY_HOSTS.has(url.hostname) && url.port === '5000';
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
        headers: cleanHeaders(payload.headers),
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
        detail: 'The IBKR proxy only forwards to IBKR_GATEWAY_ORIGIN or https://localhost:5000.',
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
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
