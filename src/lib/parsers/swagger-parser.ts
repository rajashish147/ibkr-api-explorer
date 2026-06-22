import { OpenApiSpec } from '@/types/openapi';
import { parseOpenApiSpec } from './openapi-parser';
import { ParsedEndpoint } from '@/types/endpoint';

// Minimal Swagger 2.0 → OpenAPI 3.0 adapter
interface SwaggerSpec {
  swagger: string;
  info: OpenApiSpec['info'];
  host?: string;
  basePath?: string;
  schemes?: string[];
  tags?: OpenApiSpec['tags'];
  paths: Record<string, unknown>;
  definitions?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  securityDefinitions?: Record<string, unknown>;
}

function convertSwaggerToOpenApi(swagger: SwaggerSpec): OpenApiSpec {
  const scheme = swagger.schemes?.[0] ?? 'https';
  const host = swagger.host ?? 'localhost';
  const basePath = swagger.basePath ?? '/';
  const baseUrl = `${scheme}://${host}${basePath}`;

  // Convert security definitions
  const securitySchemes: NonNullable<OpenApiSpec['components']> = {
    schemas: swagger.definitions as NonNullable<OpenApiSpec['components']>['schemas'],
    securitySchemes: {},
  };

  if (swagger.securityDefinitions) {
    for (const [name, def] of Object.entries(swagger.securityDefinitions)) {
      const d = def as { type: string; in?: string; name?: string; flow?: string; authorizationUrl?: string; tokenUrl?: string; scopes?: Record<string, string> };
      if (d.type === 'apiKey') {
        securitySchemes.securitySchemes![name] = {
          type: 'apiKey',
          in: d.in as 'query' | 'header' | 'cookie',
          name: d.name,
        };
      } else if (d.type === 'basic') {
        securitySchemes.securitySchemes![name] = { type: 'http', scheme: 'basic' };
      } else if (d.type === 'oauth2') {
        securitySchemes.securitySchemes![name] = {
          type: 'oauth2',
          flows: {
            implicit: d.flow === 'implicit' ? { authorizationUrl: d.authorizationUrl ?? '', scopes: d.scopes ?? {} } : undefined,
            password: d.flow === 'password' ? { tokenUrl: d.tokenUrl ?? '', scopes: d.scopes ?? {} } : undefined,
          },
        };
      }
    }
  }

  // Convert paths
  const convertedPaths: OpenApiSpec['paths'] = {};
  for (const [path, pathItem] of Object.entries(swagger.paths)) {
    const pi = pathItem as Record<string, unknown>;
    const converted: OpenApiSpec['paths'][string] = {};

    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    for (const method of methods) {
      if (pi[method]) {
        const op = pi[method] as Record<string, unknown>;
        const convertedOp: Record<string, unknown> = {
          operationId: op.operationId,
          summary: op.summary,
          description: op.description,
          tags: op.tags,
          deprecated: op.deprecated,
          parameters: [],
          responses: {},
        };

        // Convert parameters (swagger inline body param)
        const params = (op.parameters as Array<Record<string, unknown>> | undefined) ?? [];
        const convertedParams: unknown[] = [];
        let requestBody: Record<string, unknown> | null = null;

        for (const param of params) {
          if (param.in === 'body') {
            const schema = param.schema as Record<string, unknown> | undefined;
            if (schema?.$ref) {
              const refParts = (schema.$ref as string).replace('#/definitions/', '');
              requestBody = {
                description: param.description,
                required: param.required ?? false,
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${refParts}` },
                  },
                },
              };
            } else {
              requestBody = {
                description: param.description,
                required: param.required ?? false,
                content: { 'application/json': { schema } },
              };
            }
          } else if (param.in === 'formData') {
            // skip for simplicity
          } else {
            // Fix $ref in parameter schema
            if (param.schema && (param.schema as Record<string, unknown>).$ref) {
              const oldRef = (param.schema as Record<string, unknown>).$ref as string;
              const newRef = oldRef.replace('#/definitions/', '#/components/schemas/');
              convertedParams.push({ ...param, schema: { $ref: newRef } });
            } else {
              convertedParams.push(param);
            }
          }
        }

        convertedOp.parameters = convertedParams;
        if (requestBody) convertedOp.requestBody = requestBody;

        // Convert responses
        const responses: Record<string, unknown> = {};
        for (const [code, resp] of Object.entries((op.responses as Record<string, unknown>) ?? {})) {
          const r = resp as Record<string, unknown>;
          const schema = r.schema as Record<string, unknown> | undefined;
          let convertedSchema = schema;
          if (schema?.$ref) {
            const oldRef = schema.$ref as string;
            convertedSchema = { $ref: oldRef.replace('#/definitions/', '#/components/schemas/') };
          }
          responses[code] = {
            description: r.description ?? '',
            content: convertedSchema ? { 'application/json': { schema: convertedSchema } } : undefined,
          };
        }
        convertedOp.responses = responses;

        (converted as Record<string, unknown>)[method] = convertedOp;
      }
    }

    convertedPaths[path] = converted;
  }

  return {
    openapi: '3.0.0',
    info: swagger.info,
    servers: [{ url: baseUrl }],
    tags: swagger.tags,
    paths: convertedPaths,
    components: securitySchemes,
  };
}

export function parseSwaggerSpec(spec: SwaggerSpec): ParsedEndpoint[] {
  const converted = convertSwaggerToOpenApi(spec);
  return parseOpenApiSpec(converted);
}

export function detectSpecVersion(raw: Record<string, unknown>): 'openapi3' | 'swagger2' | 'unknown' {
  if (typeof raw.openapi === 'string' && raw.openapi.startsWith('3')) return 'openapi3';
  if (typeof raw.swagger === 'string' && raw.swagger.startsWith('2')) return 'swagger2';
  return 'unknown';
}
