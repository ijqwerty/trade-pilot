'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { cache } from 'react';
import {
  finnhubCompanyNews,
  finnhubGeneralNews,
  finnhubSearch,
  getFinnhubApiKey,
  getQuote,
  getQuotes,
  getVolumeSnapshot,
  getVolumeSnapshots,
} from '@/lib/finnhub/client';
import { getCurrentUserWatchlistSymbols } from '@/lib/actions/watchlist.actions';
import { getPopularStockSearchResults } from '@/lib/finnhub/popular-stocks';

export { getQuote, getQuotes, getVolumeSnapshot, getVolumeSnapshots };

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  if (!getFinnhubApiKey()) {
    console.error('[finnhub] getNews: API key is not configured');
    return [];
  }

  try {
    const range = getDateRange(5);
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          const articles = await finnhubCompanyNews(sym, range.from, range.to);
          perSymbolArticles[sym] = (articles || []).filter(validateArticle);
        })
      );

      const collected: MarketNewsArticle[] = [];
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
    }

    const general = await finnhubGeneralNews();

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break;
    }

    return unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
  } catch (err) {
    console.error('getNews error:', err);
    return [];
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    if (!getFinnhubApiKey()) {
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const watchlistSymbols = new Set(await getCurrentUserWatchlistSymbols());

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      results = await getPopularStockSearchResults();
    } else {
      const data = await finnhubSearch(trimmed);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    return results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as FinnhubSearchResult & { __exchange?: string })
          .__exchange;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        return {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: watchlistSymbols.has(upper),
        } satisfies StockWithWatchlistStatus;
      })
      .slice(0, 15);
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});
