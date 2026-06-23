import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const specPath = path.join(process.cwd(), 'api', 'api-docs.json');
    const content = await readFile(specPath, 'utf8');

    return new Response(content, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to read bundled OpenAPI spec',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
