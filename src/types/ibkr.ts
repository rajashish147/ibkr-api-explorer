export interface IBKRContract {
  conid: number;
  symbol: string;
  secType: string;
  exchange: string;
  currency: string;
  description: string;
  expiry?: string;
  strike?: number;
  right?: 'C' | 'P';
  multiplier?: number;
  localSymbol?: string;
  tradingClass?: string;
  primaryExch?: string;
}

export interface IBKRAccount {
  accountId: string;
  accountVan: string;
  accountTitle: string;
  displayName: string;
  accountCurrency: string;
  accountType: string;
  tradingType: string;
  ibEntity: string;
  clearingStatus: string;
  covestorAccount: boolean;
  parent?: {
    mmc: string[];
    accountId: string;
    isMParent: boolean;
    isMChild: boolean;
    isMultiplex: boolean;
  };
}

export type OrderType = 'MKT' | 'LMT' | 'STP' | 'STP LMT' | 'REL' | 'MIDPRICE' | 'TRAIL' | 'TRAIL LIMIT';
export type OrderSide = 'BUY' | 'SELL';
export type OrderTIF = 'GTC' | 'OPG' | 'DAY' | 'IOC' | 'PAX' | 'DTC';

export interface IBKROrder {
  acctId: string;
  conid: number;
  secType?: string;
  orderType: OrderType;
  side: OrderSide;
  quantity: number;
  tif: OrderTIF;
  price?: number;
  auxPrice?: number;
  trailingAmt?: number;
  trailingType?: 'amt' | '%';
  referrer?: string;
  outsideRTH?: boolean;
  isSingleGroup?: boolean;
  isOCA?: boolean;
  listingExchange?: string;
  cOID?: string;
}

export interface IBKRBracketOrder {
  orders: [IBKROrder, IBKROrder, IBKROrder]; // parent, take-profit, stop-loss
}

export interface IBKRPosition {
  acctId: string;
  conid: number;
  contractDesc: string;
  position: number;
  mktPrice: number;
  mktValue: number;
  currency: string;
  avgCost: number;
  avgPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  exchs: string;
  expiry: string;
  extType: string;
  multiplier: number;
  pageSize: number;
  putOrCall: string;
  strike: string;
  undConid: number;
  fullName: string;
  assetClass: string;
  chineseName: string;
}

export interface IBKRMarketData {
  conid: number;
  symbol: string;
  last?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  change?: number;
  changePct?: number;
  halted?: boolean;
  timestamp: number;
}

export interface FuturesContract {
  symbol: string;
  fullName: string;
  conid: number;
  exchange: string;
  currency: string;
  expiry: string;
  multiplier: number;
  lastTradingDate: string;
  description: string;
  group: string;
}

export const FUTURES_SYMBOLS: Record<string, { name: string; exchange: string; multiplier: number; tickSize: number; currency: string }> = {
  MNQ: { name: 'Micro E-mini NASDAQ-100', exchange: 'CME', multiplier: 2, tickSize: 0.25, currency: 'USD' },
  NQ: { name: 'E-mini NASDAQ-100', exchange: 'CME', multiplier: 20, tickSize: 0.25, currency: 'USD' },
  MES: { name: 'Micro E-mini S&P 500', exchange: 'CME', multiplier: 5, tickSize: 0.25, currency: 'USD' },
  ES: { name: 'E-mini S&P 500', exchange: 'CME', multiplier: 50, tickSize: 0.25, currency: 'USD' },
  YM: { name: 'E-mini Dow Jones', exchange: 'CBOT', multiplier: 5, tickSize: 1, currency: 'USD' },
  MYM: { name: 'Micro E-mini Dow Jones', exchange: 'CBOT', multiplier: 0.5, tickSize: 1, currency: 'USD' },
  RTY: { name: 'E-mini Russell 2000', exchange: 'CME', multiplier: 50, tickSize: 0.1, currency: 'USD' },
  M2K: { name: 'Micro E-mini Russell 2000', exchange: 'CME', multiplier: 5, tickSize: 0.1, currency: 'USD' },
  CL: { name: 'Crude Oil WTI', exchange: 'NYMEX', multiplier: 1000, tickSize: 0.01, currency: 'USD' },
  GC: { name: 'Gold', exchange: 'COMEX', multiplier: 100, tickSize: 0.1, currency: 'USD' },
  SI: { name: 'Silver', exchange: 'COMEX', multiplier: 5000, tickSize: 0.005, currency: 'USD' },
  ZB: { name: '30-Year U.S. Treasury Bond', exchange: 'CBOT', multiplier: 1000, tickSize: 0.03125, currency: 'USD' },
  ZN: { name: '10-Year U.S. Treasury Note', exchange: 'CBOT', multiplier: 1000, tickSize: 0.015625, currency: 'USD' },
};
