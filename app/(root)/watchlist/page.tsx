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

function formatQuotesUpdatedLabel(asOf: Date): string {
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(asOf);
  return `Last updated · ${time} ET`;
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
      <div className="packet-page">
        <header className="packet-page-header">
          <div>
            <h1 className="packet-page-title">Watchlist</h1>
            <p className="packet-page-lede">
              Track the symbols you care about and manage alerts beside them.
            </p>
          </div>
        </header>
        <div className="watchlist-container">
          <section className="watchlist space-y-6">
            <WatchlistEmpty initialStocks={initialStocks} />
          </section>
          <AlertsList alertData={alerts} />
        </div>
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

  const quotesAsOf = new Date();
  const alertsWithPrices = withDisplayPrices(alerts, enrichedWatchlist);

  return (
    <div className="packet-page">
      <header className="packet-page-header">
        <div>
          <h1 className="packet-page-title">Watchlist</h1>
          <p className="packet-page-lede">
            Your personal list with quotes, alerts, and related news.
          </p>
        </div>
        <p className="watchlist-panel-updated">{formatQuotesUpdatedLabel(quotesAsOf)}</p>
      </header>
      <div className="watchlist-container">
        <section className="watchlist space-y-6">
          <WatchlistTable watchlist={enrichedWatchlist} alertCount={alerts.length} />
          <WatchlistNews news={newsState.news} unavailable={newsState.unavailable} />
        </section>
        <AlertsList alertData={alertsWithPrices} />
      </div>
    </div>
  );
}
