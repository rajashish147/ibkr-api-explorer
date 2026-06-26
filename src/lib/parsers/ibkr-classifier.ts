import { IBKRCategory } from '@/types/endpoint';

interface PathClassification {
  patterns: RegExp[];
  category: IBKRCategory;
  priority: number;
}

const IBKR_PATH_RULES: PathClassification[] = [
  { patterns: [/^\/portfolio\/accounts/, /^\/iserver\/dynaccount/, /^\/acesws/], category: '📊 Portfolio', priority: 10 },
  { patterns: [/^\/portfolio/], category: '📊 Portfolio', priority: 8 },
  { patterns: [/^\/iserver\/account/], category: '💹 Trading', priority: 8 },
  { patterns: [/^\/iserver\/marketdata/, /^\/iserver\/currency/, /^\/iserver\/exchangerate/, /^\/iserver\/watchlist/], category: '📈 Market', priority: 10 },
  { patterns: [/^\/iserver\/secdef/, /^\/iserver\/contract/], category: '🔍 Contracts', priority: 10 },
  { patterns: [/^\/trsrv/], category: '🔍 Contracts', priority: 10 },
  { patterns: [/^\/orders/, /^\/iserver\/reply/], category: '💹 Trading', priority: 10 },
  { patterns: [/^\/trades/], category: '💹 Trading', priority: 10 },
  { patterns: [/^\/fa/, /^\/ibcust/, /^\/ccp/], category: '🧪 Advanced', priority: 10 },
  { patterns: [/^\/gw/, /^\/ws/, /^\/admin/, /^\/metrics/], category: '⚙ Utilities', priority: 10 },
  { patterns: [/^\/fyi/, /^\/iserver\/notification/, /^\/iserver\/alert/], category: '⚙ Utilities', priority: 10 },
  { patterns: [/^\/iserver\/scanner/], category: '📈 Market', priority: 10 },
  { patterns: [/^\/pa/], category: '🧪 Advanced', priority: 10 },
  { patterns: [/^\/forecast/], category: '🧪 Advanced', priority: 10 },
  { patterns: [/^\/logout/, /^\/sso/, /^\/tickle/, /^\/oauth/, /^\/iserver\/auth/, /^\/iserver\/questions/], category: '🔐 Session', priority: 10 },
  { patterns: [/^\/contract/], category: '🔍 Contracts', priority: 5 },
  { patterns: [/^\/portfolio2/], category: '📊 Portfolio', priority: 5 },
];

const TAG_TO_CATEGORY: Record<string, IBKRCategory> = {
  portfolio: '📊 Portfolio',
  account: '📊 Portfolio',
  accounts: '📊 Portfolio',
  orders: '💹 Trading',
  order: '💹 Trading',
  'market data': '📈 Market',
  marketdata: '📈 Market',
  contracts: '🔍 Contracts',
  contract: '🔍 Contracts',
  trades: '💹 Trading',
  fa: '🧪 Advanced',
  gateway: '⚙ Utilities',
  session: '🔐 Session',
  alerts: '⚙ Utilities',
  scanner: '📈 Market',
  performance: '🧪 Advanced',
  forecast: '🧪 Advanced',
  history: '📜 History',
};

export function classifyEndpoint(path: string, tags: string[] = [], deprecated = false): IBKRCategory {
  if (deprecated) return '🧪 Advanced';

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
  if (lower.includes('history') || lower.includes('hmds')) return '📜 History';
  if (lower.includes('scanner')) return '📈 Market';
  if (lower.includes('alert') || lower.includes('notification')) return '⚙ Utilities';
  if (lower.includes('auth') || lower.includes('session') || lower.includes('login') || lower.includes('oauth')) return '🔐 Session';
  if (lower.includes('funding') || lower.includes('tax') || lower.includes('advisor') || lower.includes('institutional')) return '🧪 Advanced';

  return '🧪 Advanced';
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
  '⭐ Favorites': 'Star',
  '📊 Portfolio': 'Briefcase',
  '💹 Trading': 'ShoppingCart',
  '📈 Market': 'TrendingUp',
  '📜 History': 'BarChart2',
  '🔍 Contracts': 'FileText',
  '🔐 Session': 'Lock',
  '⚙ Utilities': 'Settings',
  '🧪 Advanced': 'FlaskConical',
};

export const CATEGORY_COLORS: Record<IBKRCategory, string> = {
  '⭐ Favorites': '#eab308',
  '📊 Portfolio': '#22c55e',
  '💹 Trading': '#3b82f6',
  '📈 Market': '#06b6d4',
  '📜 History': '#f97316',
  '🔍 Contracts': '#8b5cf6',
  '🔐 Session': '#6b7280',
  '⚙ Utilities': '#64748b',
  '🧪 Advanced': '#ec4899',
};
