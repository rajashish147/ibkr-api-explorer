export interface ExtractionRule {
  id: string;
  name: string;
  pathPattern: RegExp;
  method?: string;
  extract: (responseBody: any) => Record<string, string>;
}

export const DEFAULT_EXTRACTION_RULES: ExtractionRule[] = [
  {
    id: 'portfolio-accounts',
    name: 'Portfolio Accounts',
    pathPattern: /^\/portfolio\/accounts$/,
    method: 'GET',
    extract: (body) => {
      const extracted: Record<string, string> = {};
      if (Array.isArray(body) && body.length > 0) {
        if (body[0].accountId) extracted.accountId = String(body[0].accountId);
      }
      return extracted;
    }
  },
  {
    id: 'contract-search',
    name: 'Contract Search',
    pathPattern: /^\/iserver\/secdef\/search$/,
    method: 'POST',
    extract: (body) => {
      const extracted: Record<string, string> = {};
      if (Array.isArray(body) && body.length > 0) {
        const first = body[0];
        if (first.conid) extracted.conid = String(first.conid);
        if (first.symbol) extracted.symbol = String(first.symbol);
        if (first.description) extracted.companyName = String(first.description);
        
        // Find best exchange if multiple exist
        if (Array.isArray(first.sections) && first.sections.length > 0) {
           const section = first.sections[0];
           if (section.exchange) extracted.exchange = String(section.exchange);
        }
      }
      return extracted;
    }
  },
  {
    id: 'place-order',
    name: 'Place Order',
    pathPattern: /^\/iserver\/account\/[^\/]+\/orders$/,
    method: 'POST',
    extract: (body) => {
      const extracted: Record<string, string> = {};
      if (Array.isArray(body) && body.length > 0) {
        if (body[0].order_id) extracted.orderId = String(body[0].order_id);
        if (body[0].id) extracted.orderId = String(body[0].id); // Fallback
      }
      return extracted;
    }
  },
  {
    id: 'contract-info',
    name: 'Contract Info',
    pathPattern: /^\/iserver\/contract\/[^\/]+\/info$/,
    method: 'GET',
    extract: (body) => {
      const extracted: Record<string, string> = {};
      if (body && body.con_id) extracted.conid = String(body.con_id);
      if (body && body.symbol) extracted.symbol = String(body.symbol);
      if (body && body.exchange) extracted.exchange = String(body.exchange);
      if (body && body.currency) extracted.currency = String(body.currency);
      return extracted;
    }
  },
  {
    id: 'positions',
    name: 'Positions',
    pathPattern: /^\/portfolio\/[^\/]+\/positions/,
    method: 'GET',
    extract: (body) => {
      const extracted: Record<string, string> = {};
      if (Array.isArray(body) && body.length > 0) {
        if (body[0].conid) extracted.conid = String(body[0].conid);
      }
      return extracted;
    }
  }
];

export function runExtractionEngine(
  method: string,
  url: string,
  responseBody: any,
  rules: ExtractionRule[] = DEFAULT_EXTRACTION_RULES
): Record<string, string> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {};
  }

  const path = parsedUrl.pathname;
  // Remove /v1/api prefix for matching if it exists
  const normalizedPath = path.replace(/^\/v1\/api/, '');

  let results: Record<string, string> = {};

  for (const rule of rules) {
    if (rule.method && rule.method !== method.toUpperCase()) continue;
    
    if (rule.pathPattern.test(normalizedPath)) {
      try {
        const extracted = rule.extract(responseBody);
        results = { ...results, ...extracted };
      } catch (error) {
        console.warn(`Extraction rule ${rule.name} failed:`, error);
      }
    }
  }

  return results;
}
