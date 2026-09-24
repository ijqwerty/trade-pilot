/**
 * Heuristic Finnhub → TradingView symbol mapping (spec 09).
 * Pure / offline from Gemini — AI fallback lives in Inngest only.
 */

export type TradingViewMapSource = 'heuristic' | 'ai' | 'fallback';

export type TradingViewMapResult = {
  tradingViewSymbol: string;
  source: TradingViewMapSource;
};

/** Finnhub / search exchange fragments → TradingView exchange prefix */
const EXCHANGE_PREFIX_RULES: Array<{ match: RegExp; prefix: string }> = [
  { match: /\bNASDAQ\b/i, prefix: 'NASDAQ' },
  { match: /\bNYSE\s*NKT\b/i, prefix: 'NYSE' },
  { match: /\bNYSE\s*ARCA\b/i, prefix: 'AMEX' },
  { match: /\bNYSE\s*AMERICAN\b|\bAMEX\b|\bNYSE MKT\b/i, prefix: 'AMEX' },
  { match: /\bNEW YORK STOCK EXCHANGE\b|\bNYSE\b/i, prefix: 'NYSE' },
  { match: /\bBATS\b|\bCBOE\b/i, prefix: 'BATS' },
  { match: /\bLSE\b|\bLONDON\b/i, prefix: 'LSE' },
  { match: /\bTSX\b|\bTORONTO\b/i, prefix: 'TSX' },
  { match: /\bHKEX\b|\bHONG KONG\b/i, prefix: 'HKEX' },
];

/**
 * Built-in map for POPULAR_STOCK_SYMBOLS when exchange is missing.
 * Only obvious US listings — do not invent rename tables (FB→META, etc.).
 */
const POPULAR_TV_EXCHANGE: Record<string, string> = {
  AAPL: 'NASDAQ',
  MSFT: 'NASDAQ',
  GOOGL: 'NASDAQ',
  AMZN: 'NASDAQ',
  TSLA: 'NASDAQ',
  META: 'NASDAQ',
  NVDA: 'NASDAQ',
  NFLX: 'NASDAQ',
  ORCL: 'NASDAQ',
  CRM: 'NYSE',
  ADBE: 'NASDAQ',
  INTC: 'NASDAQ',
  AMD: 'NASDAQ',
  PYPL: 'NASDAQ',
  UBER: 'NYSE',
  SPOT: 'NYSE',
  SQ: 'NYSE',
  SHOP: 'NYSE',
  ROKU: 'NASDAQ',
  SNOW: 'NYSE',
  PLTR: 'NASDAQ',
  COIN: 'NASDAQ',
  RBLX: 'NYSE',
  DDOG: 'NASDAQ',
  CRWD: 'NASDAQ',
  NET: 'NYSE',
  OKTA: 'NASDAQ',
  TWLO: 'NYSE',
  ZM: 'NASDAQ',
  ZOOM: 'NASDAQ',
  DOCU: 'NASDAQ',
  PTON: 'NASDAQ',
  PINS: 'NYSE',
  SNAP: 'NYSE',
  LYFT: 'NASDAQ',
  DASH: 'NYSE',
  ABNB: 'NASDAQ',
  RIVN: 'NASDAQ',
  LCID: 'NASDAQ',
  NIO: 'NYSE',
  XPEV: 'NYSE',
  LI: 'NASDAQ',
  BABA: 'NYSE',
  JD: 'NASDAQ',
  PDD: 'NASDAQ',
  TME: 'NYSE',
  BILI: 'NASDAQ',
  GRAB: 'NASDAQ',
  SE: 'NYSE',
};

const TV_SYMBOL_SHAPE = /^[A-Z0-9.]+:[A-Z0-9.]+$/i;

export function isPrefixedTradingViewSymbol(value: string): boolean {
  return TV_SYMBOL_SHAPE.test(value.trim());
}

export function exchangeToTradingViewPrefix(exchange?: string | null): string | null {
  if (!exchange) return null;
  const trimmed = exchange.trim();
  if (!trimmed || /^US$/i.test(trimmed)) return null;

  for (const rule of EXCHANGE_PREFIX_RULES) {
    if (rule.match.test(trimmed)) return rule.prefix;
  }
  return null;
}

function stripFinnhubSuffix(symbol: string): string {
  // BARC.L → BARC for LSE-style Finnhub symbols when we have an exchange prefix
  const dot = symbol.lastIndexOf('.');
  if (dot > 0 && symbol.length - dot <= 3) {
    return symbol.slice(0, dot);
  }
  return symbol;
}

export function resolveTradingViewSymbol({
  symbol,
  company: _company,
  exchange,
}: {
  symbol: string;
  company?: string;
  exchange?: string;
}): TradingViewMapResult {
  void _company; // reserved for AI path / future heuristics
  const raw = (symbol || '').trim().toUpperCase();
  if (!raw) {
    return { tradingViewSymbol: '', source: 'fallback' };
  }

  // Already in TradingView form
  if (isPrefixedTradingViewSymbol(raw)) {
    return { tradingViewSymbol: raw, source: 'heuristic' };
  }

  const prefixFromExchange = exchangeToTradingViewPrefix(exchange);
  if (prefixFromExchange) {
    const ticker = stripFinnhubSuffix(raw);
    return {
      tradingViewSymbol: `${prefixFromExchange}:${ticker}`,
      source: 'heuristic',
    };
  }

  const popularPrefix = POPULAR_TV_EXCHANGE[raw];
  if (popularPrefix) {
    return {
      tradingViewSymbol: `${popularPrefix}:${raw}`,
      source: 'heuristic',
    };
  }

  return { tradingViewSymbol: raw, source: 'fallback' };
}
