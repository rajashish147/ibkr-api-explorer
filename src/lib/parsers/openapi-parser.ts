import {
  OpenApiSpec,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiSchema,
  HttpMethod,
} from '@/types/openapi';
import { ParsedEndpoint, ParsedParameter, ParsedRequestBody, ParsedResponse } from '@/types/endpoint';
import { classifyEndpoint } from './ibkr-classifier';
import { generateId } from '@/lib/utils';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const;

export function resolveRef(ref: string, spec: OpenApiSpec): unknown {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let current: unknown = spec;
  for (const part of parts) {
    const decoded = part.replace(/~1/g, '/').replace(/~0/g, '~');
    if (current && typeof current === 'object' && decoded in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[decoded];
    } else {
      return null;
    }
  }
  return current;
}

export function resolveSchema(schema: OpenApiSchema | undefined, spec: OpenApiSpec, depth = 0): OpenApiSchema | null {
  if (!schema) return null;
  if (depth > 10) return schema; // prevent infinite recursion

  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec);
    if (resolved) return resolveSchema(resolved as OpenApiSchema, spec, depth + 1);
    return null;
  }

  return schema;
}

function parseParameter(param: OpenApiParameter, spec: OpenApiSpec): ParsedParameter {
  const schema = resolveSchema(param.schema, spec);
  return {
    name: param.name,
    in: param.in,
    description: param.description ?? '',
    required: param.required ?? (param.in === 'path'),
    deprecated: param.deprecated ?? false,
    schema,
    example: param.example ?? schema?.example,
    defaultValue: String(schema?.default ?? ''),
  };
}

function parseOperation(
  method: HttpMethod,
  path: string,
  operation: OpenApiOperation,
  pathLevelParams: OpenApiParameter[],
  spec: OpenApiSpec
): ParsedEndpoint {
  const allParams: OpenApiParameter[] = [
    ...pathLevelParams,
    ...(operation.parameters ?? []),
  ].map((p) => {
    if ((p as unknown as { $ref?: string }).$ref) {
      const resolved = resolveRef((p as unknown as { $ref: string }).$ref, spec);
      return (resolved as OpenApiParameter) ?? p;
    }
    return p;
  });

  const parameters = allParams.map((p) => parseParameter(p, spec));

  // Parse request body
  let requestBody: ParsedRequestBody | null = null;
  if (operation.requestBody) {
    const rb = operation.requestBody;
    const contentType = Object.keys(rb.content ?? {})[0] ?? 'application/json';
    const media = rb.content?.[contentType];
    const schema = resolveSchema(media?.schema, spec);
    const example = media?.example ?? schema?.example ?? (media?.examples ? Object.values(media.examples)[0] : null);

    requestBody = {
      description: rb.description ?? '',
      required: rb.required ?? false,
      contentType,
      schema,
      example: (example as { value?: unknown })?.value ?? example,
    };
  }

  // Parse responses
  const responses: ParsedResponse[] = Object.entries(operation.responses ?? {}).map(([statusCode, response]) => {
    const contentType = Object.keys(response.content ?? {})[0] ?? '';
    const media = response.content?.[contentType];
    const schema = resolveSchema(media?.schema, spec);
    const example = media?.example ?? schema?.example;
    return {
      statusCode,
      description: response.description ?? '',
      contentType,
      schema,
      example,
    };
  });

  const tags = operation.tags ?? [];
  const category = classifyEndpoint(path, tags);

  return {
    id: generateId(),
    method: method.toUpperCase() as HttpMethod,
    path,
    summary: operation.summary ?? '',
    description: operation.description ?? '',
    tags,
    operationId: operation.operationId ?? `${method.toUpperCase()} ${path}`,
    parameters,
    requestBody,
    responses,
    security: operation.security ?? [],
    deprecated: operation.deprecated ?? false,
    ibkrCategory: category,
    isFavorite: false,
  };
}

export function parseOpenApiSpec(spec: OpenApiSpec): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    const pathLevelParams: OpenApiParameter[] = (pathItem.parameters ?? []).map((p) => {
      if ((p as unknown as { $ref?: string }).$ref) {
        const resolved = resolveRef((p as unknown as { $ref: string }).$ref, spec);
        return (resolved as OpenApiParameter) ?? p;
      }
      return p;
    });

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method as keyof typeof pathItem] as OpenApiOperation | undefined;
      if (operation) {
        const endpoint = parseOperation(method.toUpperCase() as HttpMethod, path, operation, pathLevelParams, spec);
        endpoints.push(endpoint);
      }
    }
  }

  return endpoints;
}
