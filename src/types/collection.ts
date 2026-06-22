import { RequestConfig } from './endpoint';

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  items: CollectionItem[];
  createdAt: number;
  updatedAt: number;
}

export type CollectionItemType = 'request' | 'folder';

export interface CollectionItem {
  id: string;
  type: CollectionItemType;
  name: string;
  description?: string;
  // For folders
  children?: CollectionItem[];
  isExpanded?: boolean;
  // For requests
  request?: SavedRequest;
}

export interface SavedRequest {
  id: string;
  name: string;
  description: string;
  config: RequestConfig;
  endpointId?: string;
  collectionId: string;
  folderId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  lastStatus?: number;
  lastDuration?: number;
}

export interface CollectionRunResult {
  collectionId: string;
  startedAt: number;
  completedAt: number;
  totalRequests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: RequestRunResult[];
}

export interface RequestRunResult {
  requestId: string;
  requestName: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  statusCode?: number;
  duration?: number;
  error?: string;
  response?: unknown;
}
