import BriefingDesk from '@/components/briefing/BriefingDesk';
import DashboardMasthead from '@/components/briefing/DashboardMasthead';
import MarketContextBand from '@/components/briefing/MarketContextBand';
import TradingViewWidget from '@/components/TradingViewWidget';
import { getMyAlerts } from '@/lib/actions/alert.actions';
import { getMyNotifications } from '@/lib/actions/notification.actions';
import { getCurrentUserWatchlist } from '@/lib/actions/watchlist.actions';
import {
  getMarketDataWidgetConfig,
  getMarketOverviewWidgetConfig,
  HEATMAP_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
} from '@/lib/constants';
import { enrichWatchlistWithMarketData } from '@/lib/watchlist/enrich-market-data';
import { getDashboardWatchlistSymbols } from '@/lib/watchlist/dashboard-widget-symbols';

function withDisplayPrices(alerts: Alert[], watchlist: StockWithData[]): Alert[] {
  const priceBySymbol = new Map(
    watchlist
      .filter((item) => typeof item.currentPrice === 'number' && item.currentPrice > 0)
      .map((item) => [item.symbol, item.currentPrice as number])
  );

  return alerts.map((alert) => ({
    ...alert,
    currentPrice: priceBySymbol.get(alert.symbol) ?? alert.currentPrice ?? 0,
  }));
}

function formatQuotesUpdatedLabel(asOf: Date): string {
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  }).format(asOf);
  return `Last updated · ${time} ET`;
}

export default async function Home() {
  const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

  const [watchlistResult, alertsResult, notificationsResult, widgetSymbols] =
    await Promise.all([
      getCurrentUserWatchlist(),
      getMyAlerts(),
      getMyNotifications(),
      getDashboardWatchlistSymbols(),
    ]);

  const watchlistBase = watchlistResult.success ? watchlistResult.data : [];
  const alertsBase = alertsResult.success ? alertsResult.data : [];
  const notifications = notificationsResult.success ? notificationsResult.data : [];

  const hasWatchlist = watchlistBase.length > 0;
  const isPersonalized = widgetSymbols.length > 0;

  let watchlist: StockWithData[] = watchlistBase;
  let quotesAsOf: Date | null = null;
  if (hasWatchlist) {
    try {
      watchlist = await enrichWatchlistWithMarketData(watchlistBase);
      quotesAsOf = new Date();
    } catch (err) {
      console.error('[briefing] enrichWatchlistWithMarketData failed:', err);
    }
  }

  const alerts = withDisplayPrices(alertsBase, watchlist);
  const overviewConfig = getMarketOverviewWidgetConfig(widgetSymbols);
  const quotesConfig = getMarketDataWidgetConfig(widgetSymbols);
  const quotesUpdatedLabel = quotesAsOf ? formatQuotesUpdatedLabel(quotesAsOf) : null;

  return (
    <div className="briefing-packet">
      <DashboardMasthead hasWatchlist={hasWatchlist} />

      <BriefingDesk
        alerts={alerts}
        notifications={notifications}
        watchlist={watchlist}
        hasWatchlist={hasWatchlist}
        isPersonalized={isPersonalized}
        quotesUpdatedLabel={quotesUpdatedLabel}
        overviewConfig={overviewConfig}
        quotesConfig={quotesConfig}
        scriptUrl={scriptUrl}
      />

      <MarketContextBand demoted={!hasWatchlist}>
        <TradingViewWidget
          title="Stock heatmap"
          scriptUrl={`${scriptUrl}stock-heatmap.js`}
          config={HEATMAP_WIDGET_CONFIG}
          height={hasWatchlist ? 360 : 280}
          quiet
        />
        <TradingViewWidget
          title="Market timeline"
          scriptUrl={`${scriptUrl}timeline.js`}
          config={TOP_STORIES_WIDGET_CONFIG}
          height={hasWatchlist ? 360 : 280}
          quiet
        />
      </MarketContextBand>
    </div>
  );
}
