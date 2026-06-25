import https from 'node:https';
import { Buffer } from 'node:buffer';
import { NextRequest, NextResponse } from 'next/server';
import { TLSSocket } from 'node:tls';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') || 'A';
  const targetUrl = 'https://localhost:5000/v1/api/iserver/auth/status';
  const startTime = performance.now();

  let requestHeadersToForward: Record<string, string> = {};
  const originalHeaders: Record<string, string> = {};

  // Extract body if provided (e.g. for Golden Request testing or POST)
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
    // Test D: cURL Replay
    // We will construct a curl command using the incoming headers but strictly removing
    // typical browser headers if we want to emulate Postman perfectly. 
    // Wait, the user said "curl command that reproduces the successful Postman request".
    // Let's pass the 'golden' headers from the client if provided, otherwise use a minimal set.
    
    // We expect the client to send 'x-golden-headers' if they want a perfect replay.
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
  const hopByHop = ['connection', 'host', 'content-length', 'keep-alive', 'x-golden-headers'];
  
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

  // The proxy request
  return new Promise<NextResponse>((resolve) => {
    const options: https.RequestOptions = {
      method: 'POST',
      headers: requestHeadersToForward,
      rejectUnauthorized: false,
    };

    let tlsInfo: any = {};
    const req = https.request(targetUrl, options, (res) => {
      const socket = res.socket as TLSSocket;
      if (socket && typeof socket.getProtocol === 'function') {
        tlsInfo = {
          protocol: socket.getProtocol(),
          cipher: socket.getCipher(),
          authorized: socket.authorized,
        };
      }

      const chunks: Buffer[] = [];
      res.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));

      res.on('end', () => {
        const durationMs = performance.now() - startTime;
        let responseBody: any = Buffer.concat(chunks).toString('utf8');
        try {
          responseBody = JSON.parse(responseBody);
        } catch {}

        resolve(NextResponse.json({
          mode,
          target: { url: targetUrl, method: options.method },
          timing: { durationMs },
          request: {
            originalBrowserHeaders: originalHeaders,
            actualForwardedHeaders: requestHeadersToForward,
          },
          response: {
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            body: responseBody,
          },
          tls: tlsInfo,
        }));
      });
    });

    req.on('error', (e) => {
      const durationMs = performance.now() - startTime;
      resolve(NextResponse.json({
        error: 'Request failed',
        message: e.message,
        target: targetUrl,
        timing: { durationMs },
        requestHeaders: requestHeadersToForward
      }, { status: 502 }));
    });

    req.write(bodyBuffer);
    req.end();
  });
}
