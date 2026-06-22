import { IBKRCategory } from '@/types/endpoint';

interface PathClassification {
  patterns: RegExp[];
  category: IBKRCategory;
  priority: number;
}

const IBKR_PATH_RULES: PathClassification[] = [
  { patterns: [/^\/portfolio\/accounts/, /^\/iserver\/dynaccount/, /^\/acesws/], category: 'Accounts', priority: 10 },
  { patterns: [/^\/portfolio/], category: 'Portfolio', priority: 8 },
  { patterns: [/^\/iserver\/account/], category: 'Orders', priority: 8 },
  { patterns: [/^\/iserver\/marketdata/, /^\/iserver\/currency/, /^\/iserver\/exchangerate/, /^\/iserver\/watchlist/], category: 'Market Data', priority: 10 },
  { patterns: [/^\/iserver\/secdef/, /^\/iserver\/contract/], category: 'Contracts', priority: 10 },
  { patterns: [/^\/trsrv/], category: 'Futures', priority: 10 },
  { patterns: [/^\/orders/, /^\/iserver\/reply/], category: 'Orders', priority: 10 },
  { patterns: [/^\/trades/], category: 'Trades', priority: 10 },
  { patterns: [/^\/fa/], category: 'Financial Advisor', priority: 10 },
  { patterns: [/^\/gw/, /^\/ws/], category: 'Gateway', priority: 10 },
  { patterns: [/^\/fyi/, /^\/iserver\/notification/, /^\/iserver\/alert/], category: 'Alerts', priority: 10 },
  { patterns: [/^\/iserver\/scanner/], category: 'Scanner', priority: 10 },
  { patterns: [/^\/pa/], category: 'Performance', priority: 10 },
  { patterns: [/^\/forecast/], category: 'Forecasting', priority: 10 },
  { patterns: [/^\/logout/, /^\/sso/, /^\/tickle/, /^\/oauth/, /^\/iserver\/auth/, /^\/iserver\/questions/], category: 'Session', priority: 10 },
  { patterns: [/^\/contract/], category: 'Contracts', priority: 5 },
  { patterns: [/^\/portfolio2/], category: 'Portfolio', priority: 5 },
];

const TAG_TO_CATEGORY: Record<string, IBKRCategory> = {
  portfolio: 'Portfolio',
  account: 'Accounts',
  accounts: 'Accounts',
  orders: 'Orders',
  order: 'Orders',
  'market data': 'Market Data',
  marketdata: 'Market Data',
  contracts: 'Contracts',
  contract: 'Contracts',
  trades: 'Trades',
  fa: 'Financial Advisor',
  gateway: 'Gateway',
  session: 'Session',
  alerts: 'Alerts',
  scanner: 'Scanner',
  performance: 'Performance',
  forecast: 'Forecasting',
};

export function classifyEndpoint(path: string, tags: string[] = []): IBKRCategory {
  // 1. Try path matching first (more reliable for IBKR)
  for (const rule of IBKR_PATH_RULES.sort((a, b) => b.priority - a.priority)) {
    if (rule.patterns.some((p) => p.test(path))) {
      return rule.category;
    }
  }

  // 2. Fallback to tags if no path matches
  if (tags.length > 0) {
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      if (TAG_TO_CATEGORY[lowerTag]) {
        return TAG_TO_CATEGORY[lowerTag];
      }
    }
  }

  // 3. Heuristic fallback based on path keywords
  const lower = path.toLowerCase();
  if (lower.includes('history') || lower.includes('hmds')) return 'Historical Data';
  if (lower.includes('scanner')) return 'Scanner';
  if (lower.includes('alert') || lower.includes('notification')) return 'Alerts';
  if (lower.includes('auth') || lower.includes('session') || lower.includes('login')) return 'Session';

  return 'Other';
}

export function isIBKRSpec(paths: string[]): boolean {
  const ibkrPaths = ['/portfolio', '/iserver', '/trsrv', '/hmds', '/pa/', '/sso'];
  const matchCount = paths.filter((p) =>
    ibkrPaths.some((ibkrPath) => p.toLowerCase().startsWith(ibkrPath))
  ).length;
  return matchCount > paths.length * 0.1; // 10% of paths match IBKR patterns
}

export function groupByCategory<T extends { ibkrCategory: IBKRCategory }>(
  items: T[]
): Map<IBKRCategory, T[]> {
  const groups = new Map<IBKRCategory, T[]>();
  for (const item of items) {
    const group = groups.get(item.ibkrCategory) ?? [];
    group.push(item);
    groups.set(item.ibkrCategory, group);
  }
  return groups;
}

export const CATEGORY_ICONS: Record<IBKRCategory, string> = {
  Portfolio: 'Briefcase',
  Accounts: 'User',
  Orders: 'ShoppingCart',
  'Market Data': 'TrendingUp',
  Contracts: 'FileText',
  Trades: 'ArrowLeftRight',
  'Historical Data': 'BarChart2',
  Futures: 'Zap',
  'Financial Advisor': 'Users',
  Gateway: 'Server',
  Session: 'Lock',
  Scanner: 'Search',
  Alerts: 'Bell',
  Performance: 'Activity',
  Forecasting: 'LineChart',
  Other: 'Circle',
};

export const CATEGORY_COLORS: Record<IBKRCategory, string> = {
  Portfolio: '#22c55e',
  Accounts: '#3b82f6',
  Orders: '#f59e0b',
  'Market Data': '#06b6d4',
  Contracts: '#8b5cf6',
  Trades: '#ec4899',
  'Historical Data': '#f97316',
  Futures: '#84cc16',
  'Financial Advisor': '#0ea5e9',
  Gateway: '#64748b',
  Session: '#6b7280',
  Scanner: '#a78bfa',
  Alerts: '#fb923c',
  Performance: '#10b981',
  Forecasting: '#f43f5e',
  Other: '#9ca3af',
};
