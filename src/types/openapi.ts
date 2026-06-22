export interface OpenApiSpec {
  openapi?: string;
  swagger?: string;
  info: OpenApiInfo;
  servers?: OpenApiServer[];
  paths: Record<string, OpenApiPathItem>;
  components?: OpenApiComponents;
  tags?: OpenApiTag[];
  security?: SecurityRequirement[];
  externalDocs?: ExternalDocs;
}

export interface OpenApiInfo {
  title: string;
  description?: string;
  version: string;
  contact?: { name?: string; email?: string; url?: string };
  license?: { name: string; url?: string };
  termsOfService?: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

export interface OpenApiPathItem {
  summary?: string;
  description?: string;
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
  head?: OpenApiOperation;
  options?: OpenApiOperation;
  trace?: OpenApiOperation;
  parameters?: OpenApiParameter[];
  servers?: OpenApiServer[];
}

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
  security?: SecurityRequirement[];
  deprecated?: boolean;
  externalDocs?: ExternalDocs;
  'x-ibkr-group'?: string;
}

export interface OpenApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: OpenApiSchema;
  example?: unknown;
  examples?: Record<string, OpenApiExample>;
  style?: string;
  explode?: boolean;
}

export interface OpenApiRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, OpenApiMediaType>;
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
  example?: unknown;
  examples?: Record<string, OpenApiExample>;
  encoding?: Record<string, OpenApiEncoding>;
}

export interface OpenApiEncoding {
  contentType?: string;
  headers?: Record<string, OpenApiParameter>;
  style?: string;
  explode?: boolean;
}

export interface OpenApiResponse {
  description: string;
  headers?: Record<string, OpenApiParameter>;
  content?: Record<string, OpenApiMediaType>;
  links?: Record<string, unknown>;
}

export interface OpenApiComponents {
  schemas?: Record<string, OpenApiSchema>;
  responses?: Record<string, OpenApiResponse>;
  parameters?: Record<string, OpenApiParameter>;
  requestBodies?: Record<string, OpenApiRequestBody>;
  headers?: Record<string, OpenApiParameter>;
  securitySchemes?: Record<string, SecurityScheme>;
  examples?: Record<string, OpenApiExample>;
  links?: Record<string, unknown>;
  callbacks?: Record<string, unknown>;
}

export interface OpenApiSchema {
  type?: string | string[];
  format?: string;
  title?: string;
  description?: string;
  default?: unknown;
  example?: unknown;
  examples?: unknown[];
  enum?: unknown[];
  const?: unknown;
  // Numeric
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
  // String
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // Array
  items?: OpenApiSchema | OpenApiSchema[];
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  // Object
  properties?: Record<string, OpenApiSchema>;
  additionalProperties?: OpenApiSchema | boolean;
  required?: string[];
  minProperties?: number;
  maxProperties?: number;
  // Composition
  allOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  not?: OpenApiSchema;
  // Reference
  $ref?: string;
  // Nullable (OpenAPI 3.0)
  nullable?: boolean;
  // Discriminator
  discriminator?: { propertyName: string; mapping?: Record<string, string> };
  // Read/Write
  readOnly?: boolean;
  writeOnly?: boolean;
  // Deprecated
  deprecated?: boolean;
  // XML
  xml?: { name?: string; namespace?: string; prefix?: string; attribute?: boolean; wrapped?: boolean };
}

export interface OpenApiExample {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}

export interface OpenApiTag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocs;
}

export interface ExternalDocs {
  description?: string;
  url: string;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect' | 'mutualTLS';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export type SecurityRequirement = Record<string, string[]>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE';
