import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fetch as undiciFetch, Agent } from 'undici';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') || 'A';
  const targetUrl = 'https://localhost:5000/v1/api/iserver/auth/status';
  const startTime = performance.now();

  let requestHeadersToForward: Record<string, string> = {};
  const originalHeaders: Record<string, string> = {};

  // Extract body
  let bodyBuffer: Buffer = Buffer.alloc(0);
  try {
    const arrayBuffer = await request.arrayBuffer();
    bodyBuffer = Buffer.from(arrayBuffer);
  } catch {
    // Ignore
  }

  request.headers.forEach((value, key) => {
    originalHeaders[key.toLowerCase()] = value;
  });

  if (mode === 'D') {
    let curlHeaders = '';
    try {
      const golden = originalHeaders['x-golden-headers'];
      if (golden) {
        const parsed = JSON.parse(golden);
        for (const [k, v] of Object.entries(parsed)) {
          curlHeaders += `-H "${k}: ${v}" `;
        }
      } else {
        curlHeaders = `-H "Accept: */*" -H "Connection: keep-alive"`;
      }
    } catch {}

    const cmd = `curl -s -k -v -X POST ${curlHeaders} ${targetUrl}`;
    
    try {
      const { stdout, stderr } = await execAsync(cmd);
      const durationMs = performance.now() - startTime;
      
      let parsedJson = stdout;
      try { parsedJson = JSON.parse(stdout); } catch {}

      return NextResponse.json({
        mode: 'D',
        target: { url: targetUrl, method: 'POST' },
        timing: { durationMs },
        request: {
          cmd,
        },
        response: {
          statusCode: stderr.includes('HTTP/1.1 200') ? 200 : (stderr.includes('HTTP/1.1 403') ? 403 : 0),
          stderrLog: stderr,
          body: parsedJson,
        }
      });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  // Modes A, B, C setup
  const hopByHop = ['connection', 'host', 'keep-alive', 'x-golden-headers', 'content-length'];
  
  if (mode === 'A') {
    // Test A: Forward everything except hop-by-hop
    for (const [k, v] of Object.entries(originalHeaders)) {
      if (!hopByHop.includes(k)) {
        requestHeadersToForward[k] = v;
      }
    }
  } else if (mode === 'B') {
    // Test B: Remove Origin and Referer
    for (const [k, v] of Object.entries(originalHeaders)) {
      if (!hopByHop.includes(k) && k !== 'origin' && k !== 'referer') {
        requestHeadersToForward[k] = v;
      }
    }
  } else if (mode === 'C') {
    // Test C: Minimal Proxy
    const allowed = ['accept', 'accept-encoding', 'content-type', 'cookie', 'user-agent'];
    for (const [k, v] of Object.entries(originalHeaders)) {
      if (allowed.includes(k)) {
        requestHeadersToForward[k] = v;
      }
    }
  }

  // Force content-length for POST if not chunked
  requestHeadersToForward['content-length'] = bodyBuffer.length.toString();

  // The proxy request using undici
  const dispatcher = new Agent({
    connect: {
      rejectUnauthorized: false
    }
  });

  try {
    const res = await undiciFetch(targetUrl, {
      method: 'POST',
      headers: requestHeadersToForward,
      body: bodyBuffer.length > 0 ? bodyBuffer : undefined,
      dispatcher: dispatcher as any
    });

    const durationMs = performance.now() - startTime;
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { responseHeaders[k] = v; });

    let responseBody: any = await res.text();
    try {
      responseBody = JSON.parse(responseBody);
    } catch {}

    return NextResponse.json({
      mode,
      target: { url: targetUrl, method: 'POST' },
      timing: { durationMs },
      request: {
        originalBrowserHeaders: originalHeaders,
        actualForwardedHeaders: requestHeadersToForward,
      },
      response: {
        statusCode: res.status,
        statusMessage: res.statusText,
        headers: responseHeaders,
        body: responseBody,
      },
      tls: {
        agent: 'undici',
        rejectUnauthorized: false
      }
    });

  } catch (e: any) {
    const durationMs = performance.now() - startTime;
    return NextResponse.json({
      error: 'Request failed',
      message: e.message,
      target: targetUrl,
      timing: { durationMs },
      requestHeaders: requestHeadersToForward
    }, { status: 502 });
  }
}
