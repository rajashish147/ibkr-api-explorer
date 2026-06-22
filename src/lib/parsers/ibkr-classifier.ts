import { IBKRCategory } from '@/types/endpoint';

interface PathClassification {
  patterns: RegExp[];
  category: IBKRCategory;
  priority: number;
}

const IBKR_PATH_RULES: PathClassification[] = [
  { patterns: [/^\/portfolio\/accounts/], category: 'Accounts', priority: 10 },
  { patterns: [/^\/portfolio/], category: 'Portfolio', priority: 8 },
  { patterns: [/^\/iserver\/account.*order/i, /^\/iserver\/reply/], category: 'Orders', priority: 10 },
  { patterns: [/^\/iserver\/marketdata/, /^\/md\//], category: 'Market Data', priority: 10 },
  { patterns: [/^\/trsrv/, /^\/iserver\/secdef/, /^\/iserver\/contract/], category: 'Contracts', priority: 10 },
  { patterns: [/^\/iserver\/account.*trade/, /^\/portfolio.*trade/], category: 'Trades', priority: 10 },
  { patterns: [/^\/hmds\/history/, /^\/iserver\/marketdata\/history/], category: 'Historical Data', priority: 10 },
  { patterns: [/^\/trsrv\/futures/, /futures/i], category: 'Futures', priority: 9 },
  { patterns: [/^\/iserver\/auth/, /^\/iserver\/reauthenticate/, /^\/iserver\/tickle/, /^\/logout/, /^\/sso/], category: 'Session', priority: 10 },
  { patterns: [/^\/iserver\/scanner/], category: 'Scanner', priority: 10 },
  { patterns: [/^\/iserver\/notification/, /^\/iserver\/alert/], category: 'Alerts', priority: 10 },
  { patterns: [/^\/iserver\/account/], category: 'Accounts', priority: 6 },
  { patterns: [/^\/iserver/], category: 'Orders', priority: 2 },
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
  trade: 'Trades',
  historical: 'Historical Data',
  'historical data': 'Historical Data',
  futures: 'Futures',
  session: 'Session',
  authentication: 'Session',
  auth: 'Session',
  scanner: 'Scanner',
  alerts: 'Alerts',
  alert: 'Alerts',
};

export function classifyEndpoint(path: string, tags: string[] = [], operationId?: string): IBKRCategory {
  // Try tag-based classification first
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag in TAG_TO_CATEGORY) {
      return TAG_TO_CATEGORY[normalizedTag];
    }
  }

  // Try path-based classification with priority
  let bestMatch: { category: IBKRCategory; priority: number } | null = null;
  const lowerPath = path.toLowerCase();

  for (const rule of IBKR_PATH_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(lowerPath)) {
        if (!bestMatch || rule.priority > bestMatch.priority) {
          bestMatch = { category: rule.category, priority: rule.priority };
        }
        break;
      }
    }
  }

  if (bestMatch) return bestMatch.category;

  // operationId-based fallback
  if (operationId) {
    const lower = operationId.toLowerCase();
    if (lower.includes('order')) return 'Orders';
    if (lower.includes('portfolio')) return 'Portfolio';
    if (lower.includes('account')) return 'Accounts';
    if (lower.includes('trade')) return 'Trades';
    if (lower.includes('market') || lower.includes('quote')) return 'Market Data';
    if (lower.includes('contract') || lower.includes('security')) return 'Contracts';
    if (lower.includes('future')) return 'Futures';
    if (lower.includes('history')) return 'Historical Data';
    if (lower.includes('session') || lower.includes('auth')) return 'Session';
  }

  return 'General';
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
  Session: 'Lock',
  Scanner: 'Search',
  Alerts: 'Bell',
  General: 'Circle',
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
  Session: '#6b7280',
  Scanner: '#a78bfa',
  Alerts: '#fb923c',
  General: '#9ca3af',
};
