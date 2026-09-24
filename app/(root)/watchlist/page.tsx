import { getCurrentUserWatchlist } from "@/lib/actions/watchlist.actions";
import { getMyAlerts } from "@/lib/actions/alert.actions";
import { getNews, searchStocks } from "@/lib/actions/finnhub.actions";
import { enrichWatchlistWithMarketData } from "@/lib/watchlist/enrich-market-data";
import WatchlistTable from "@/components/WatchlistTable";
import WatchlistEmpty from "@/components/WatchlistEmpty";
import WatchlistNews from "@/components/WatchlistNews";
import AlertsList from "@/components/AlertsList";

function withDisplayPrices(alerts: Alert[], watchlist: StockWithData[]): Alert[] {
  const priceBySymbol = new Map(
    watchlist
      .filter((item) => typeof item.currentPrice === "number" && item.currentPrice > 0)
      .map((item) => [item.symbol, item.currentPrice as number])
  );

  return alerts.map((alert) => ({
    ...alert,
    currentPrice: priceBySymbol.get(alert.symbol) ?? 0,
  }));
}

export default async function WatchlistPage() {
  const [watchlistResult, alertsResult] = await Promise.all([
    getCurrentUserWatchlist(),
    getMyAlerts(),
  ]);

  const watchlist = watchlistResult.success ? watchlistResult.data : [];
  const alerts = alertsResult.success ? alertsResult.data : [];

  if (watchlist.length === 0) {
    const initialStocks = await searchStocks();
    return (
      <div className="watchlist-container">
        <section className="watchlist space-y-6">
          <h1 className="watchlist-title">Watchlist</h1>
          <WatchlistEmpty initialStocks={initialStocks} />
        </section>
        <AlertsList alertData={alerts} />
      </div>
    );
  }

  const symbols = [...new Set(watchlist.map((item) => item.symbol))];

  const [enrichedWatchlist, newsState] = await Promise.all([
    enrichWatchlistWithMarketData(watchlist),
    (async (): Promise<{ news: MarketNewsArticle[]; unavailable: boolean }> => {
      try {
        const news = await getNews(symbols);
        return { news, unavailable: false };
      } catch (err) {
        console.error("[watchlist] getNews failed:", err);
        return { news: [], unavailable: true };
      }
    })(),
  ]);

  const alertsWithPrices = withDisplayPrices(alerts, enrichedWatchlist);

  return (
    <div className="watchlist-container">
      <section className="watchlist space-y-6">
        <h1 className="watchlist-title">Watchlist</h1>
        <WatchlistTable watchlist={enrichedWatchlist} alertCount={alerts.length} />
        <WatchlistNews news={newsState.news} unavailable={newsState.unavailable} />
      </section>
      <AlertsList alertData={alertsWithPrices} />
    </div>
  );
}
