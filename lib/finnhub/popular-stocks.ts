import { unstable_cache } from 'next/cache';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { finnhubProfile2 } from '@/lib/finnhub/client';
import { FINNHUB_TTL } from '@/lib/finnhub/constants';

async function loadPopularStockSearchResults(): Promise<FinnhubSearchResult[]> {
  const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
  const results: FinnhubSearchResult[] = [];

  // Sequential fetches avoid stampeding the shared rate limiter (dev has no fetch cache).
  for (const sym of top) {
    const profile = await finnhubProfile2(sym);
    const symbol = sym.toUpperCase();
    const name =
      (profile?.name as string | undefined) ||
      (profile?.ticker as string | undefined) ||
      symbol;
    const exchange = (profile?.exchange as string | undefined) ?? 'US';
    const r: FinnhubSearchResult = {
      symbol,
      description: name,
      displaySymbol: symbol,
      type: 'Common Stock',
    };
    (r as FinnhubSearchResult & { __exchange?: string }).__exchange = exchange;
    results.push(r);
  }

  return results;
}

export const getPopularStockSearchResults = unstable_cache(
  loadPopularStockSearchResults,
  ['finnhub-popular-stock-search-results'],
  { revalidate: FINNHUB_TTL.profile2 }
);
