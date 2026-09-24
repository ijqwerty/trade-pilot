import { getCurrentUserWatchlist } from '@/lib/actions/watchlist.actions';
import {
  DASHBOARD_WIDGET_SYMBOL_CAP,
  type DashboardWidgetSymbol,
} from '@/lib/constants';
import { getCachedTradingViewSymbol } from '@/lib/tradingview/get-mapped-symbol';
import { resolveTradingViewSymbol } from '@/lib/tradingview/mapSymbol';

function usableSymbol(value: string | undefined): string {
  return (value || '').trim();
}

/**
 * Session user's watchlist → mapped TradingView symbols for dashboard widgets.
 * Prefers stored mapping; no Finnhub quotes, no Inngest, no Gemini.
 * Empty or load failure → [] so the page keeps static configs.
 */
export async function getDashboardWatchlistSymbols(): Promise<DashboardWidgetSymbol[]> {
  try {
    const result = await getCurrentUserWatchlist();
    if (!result.success) {
      // Layout redirects anonymous users; don't treat that as a widget load failure.
      if (result.error !== 'You must be signed in to view your watchlist') {
        console.error('Dashboard watchlist load failed:', result.error);
      }
      return [];
    }

    if (!result.data.length) {
      return [];
    }

    const capped = result.data.slice(0, DASHBOARD_WIDGET_SYMBOL_CAP);
    const mapped: DashboardWidgetSymbol[] = [];

    for (const row of capped) {
      const raw = usableSymbol(row.symbol).toUpperCase();
      if (!raw) continue;

      let tvSymbol = usableSymbol(row.tradingViewSymbol);

      if (!tvSymbol) {
        const cached = await getCachedTradingViewSymbol(raw);
        tvSymbol = usableSymbol(cached?.tradingViewSymbol);
      }

      if (!tvSymbol) {
        tvSymbol = usableSymbol(
          resolveTradingViewSymbol({
            symbol: raw,
            company: row.company,
          }).tradingViewSymbol
        );
      }

      // Mapping missing → raw SYMBOL (TradingView often accepts it)
      if (!tvSymbol) {
        tvSymbol = raw;
      }

      mapped.push({
        tradingViewSymbol: tvSymbol,
        displayName: usableSymbol(row.company) || raw,
      });
    }

    return mapped;
  } catch (err) {
    console.error('getDashboardWatchlistSymbols error:', err);
    return [];
  }
}
