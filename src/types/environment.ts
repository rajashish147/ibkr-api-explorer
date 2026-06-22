export interface Environment {
  id: string;
  name: string;
  description: string;
  variables: EnvironmentVariable[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  color: string;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
  sensitive: boolean;
}

export type EnvironmentType = 'development' | 'paper' | 'live' | 'custom';

export const DEFAULT_IBKR_ENVIRONMENTS: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Development',
    description: 'Local IBKR Gateway development environment',
    isActive: true,
    color: '#22c55e',
    variables: [
      { id: 'dev-1', key: 'baseUrl', value: 'https://localhost:5000/v1/api', description: 'Base URL', enabled: true, sensitive: false },
      { id: 'dev-2', key: 'accountId', value: '', description: 'IBKR Account ID', enabled: true, sensitive: true },
      { id: 'dev-3', key: 'conid', value: '', description: 'Contract ID', enabled: true, sensitive: false },
      { id: 'dev-4', key: 'orderId', value: '', description: 'Order ID', enabled: true, sensitive: false },
      { id: 'dev-5', key: 'futureSymbol', value: 'MNQ', description: 'Futures symbol', enabled: true, sensitive: false },
      { id: 'dev-6', key: 'etfSymbol', value: 'SPY', description: 'ETF symbol', enabled: true, sensitive: false },
    ],
  },
  {
    name: 'Paper Trading',
    description: 'IBKR Paper Trading environment',
    isActive: false,
    color: '#f59e0b',
    variables: [
      { id: 'paper-1', key: 'baseUrl', value: 'https://localhost:5000/v1/api', description: 'Base URL', enabled: true, sensitive: false },
      { id: 'paper-2', key: 'accountId', value: '', description: 'Paper Account ID', enabled: true, sensitive: true },
      { id: 'paper-3', key: 'conid', value: '', description: 'Contract ID', enabled: true, sensitive: false },
      { id: 'paper-4', key: 'orderId', value: '', description: 'Order ID', enabled: true, sensitive: false },
      { id: 'paper-5', key: 'futureSymbol', value: 'MNQ', description: 'Futures symbol', enabled: true, sensitive: false },
      { id: 'paper-6', key: 'etfSymbol', value: 'SPY', description: 'ETF symbol', enabled: true, sensitive: false },
    ],
  },
  {
    name: 'Live Trading',
    description: 'IBKR Live Trading environment',
    isActive: false,
    color: '#ef4444',
    variables: [
      { id: 'live-1', key: 'baseUrl', value: 'https://localhost:5000/v1/api', description: 'Base URL', enabled: true, sensitive: false },
      { id: 'live-2', key: 'accountId', value: '', description: 'Live Account ID', enabled: true, sensitive: true },
      { id: 'live-3', key: 'conid', value: '', description: 'Contract ID', enabled: true, sensitive: false },
      { id: 'live-4', key: 'orderId', value: '', description: 'Order ID', enabled: true, sensitive: false },
      { id: 'live-5', key: 'futureSymbol', value: 'MNQ', description: 'Futures symbol', enabled: true, sensitive: false },
      { id: 'live-6', key: 'etfSymbol', value: 'SPY', description: 'ETF symbol', enabled: true, sensitive: false },
    ],
  },
];
