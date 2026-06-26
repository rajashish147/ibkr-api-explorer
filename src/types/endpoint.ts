import { HttpMethod, OpenApiSchema } from './openapi';

export type IBKRCategory =
  | '⭐ Favorites'
  | '📊 Portfolio'
  | '💹 Trading'
  | '📈 Market'
  | '📜 History'
  | '🔍 Contracts'
  | '🔐 Session'
  | '⚙ Utilities'
  | '🧪 Advanced';

export interface ParsedEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  operationId: string;
  parameters: ParsedParameter[];
  requestBody: ParsedRequestBody | null;
  responses: ParsedResponse[];
  security: Array<Record<string, string[]>>;
  deprecated: boolean;
  ibkrCategory: IBKRCategory;
  isFavorite: boolean;
}

export interface ParsedParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description: string;
  required: boolean;
  deprecated: boolean;
  schema: OpenApiSchema | null;
  example: unknown;
  defaultValue: string;
}

export interface ParsedRequestBody {
  description: string;
  required: boolean;
  contentType: string;
  schema: OpenApiSchema | null;
  example: unknown;
}

export interface ParsedResponse {
  statusCode: string;
  description: string;
  contentType: string;
  schema: OpenApiSchema | null;
  example: unknown;
}

export interface EndpointGroup {
  tag: string;
  category: IBKRCategory;
  endpoints: ParsedEndpoint[];
  isExpanded: boolean;
}

export interface RequestParam {
  name: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: RequestParam[];
  queryParams: RequestParam[];
  pathParams: RequestParam[];
  body: string;
  bodyType: 'json' | 'form' | 'raw' | 'none';
  auth: AuthConfig;
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey' | 'oauth2' | 'cookie' | 'session';

export interface AuthConfig {
  type: AuthType;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: 'header' | 'query' | 'cookie';
  cookieValue?: string;
  sessionToken?: string;
}
