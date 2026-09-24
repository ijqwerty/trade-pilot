import {
  finnhubGet,
  finnhubProfile2,
  getQuotes,
  normalizeFinnhubSymbol,
} from '@/lib/finnhub/client';
import { FINNHUB_TTL } from '@/lib/finnhub/constants';
import {
  formatChangePercent,
  formatMarketCapValue,
  formatPrice,
} from '@/lib/utils';

const PLACEHOLDER = '—';

/** Extra profile + metric calls only for small watchlists (best-effort market cap / P/E). */
const MAX_FUNDAMENTALS_SYMBOLS = 5;

type MetricResponse = {
  metric?: Record<string, number>;
};

async function getPeRatio(symbol: string): Promise<number | undefined> {
  try {
    const data = await finnhubGet<MetricResponse>(
      '/stock/metric',
      { symbol, metric: 'all' },
      FINNHUB_TTL.metric
    );
    const pe = data?.metric?.peBasic ?? data?.metric?.peTTM;
    if (pe == null || !Number.isFinite(pe) || pe <= 0) return undefined;
    return pe;
  } catch {
    return undefined;
  }
}

export async function enrichWatchlistWithMarketData(
  items: StockWithData[]
): Promise<StockWithData[]> {
  if (items.length === 0) return items;

  const uniqueSymbols = [
    ...new Set(items.map((item) => normalizeFinnhubSymbol(item.symbol)).filter(Boolean)),
  ];

  const quotes = await getQuotes(uniqueSymbols);

  const marketCapBySymbol = new Map<string, string>();
  const peBySymbol = new Map<string, string>();

  if (uniqueSymbols.length <= MAX_FUNDAMENTALS_SYMBOLS) {
    await Promise.all(
      uniqueSymbols.map(async (sym) => {
        const profile = await finnhubProfile2(sym);
        const capMillions = profile?.marketCapitalization;
        if (typeof capMillions === 'number' && capMillions > 0) {
          marketCapBySymbol.set(sym, formatMarketCapValue(capMillions * 1_000_000));
        }

        const pe = await getPeRatio(sym);
        if (pe != null) {
          peBySymbol.set(sym, pe.toFixed(2));
        }
      })
    );
  }

  return items.map((item) => {
    const sym = normalizeFinnhubSymbol(item.symbol);
    const quote = quotes[sym];
    const currentPrice = quote?.c;
    const changePercent = quote?.dp;

    const priceFormatted =
      currentPrice != null && currentPrice > 0 ? formatPrice(currentPrice) : PLACEHOLDER;

    const changeFormatted =
      changePercent != null && Number.isFinite(changePercent)
        ? formatChangePercent(changePercent) || PLACEHOLDER
        : PLACEHOLDER;

    return {
      ...item,
      currentPrice,
      changePercent,
      priceFormatted,
      changeFormatted,
      marketCap: marketCapBySymbol.get(sym) ?? PLACEHOLDER,
      peRatio: peBySymbol.get(sym) ?? PLACEHOLDER,
    };
  });
}
