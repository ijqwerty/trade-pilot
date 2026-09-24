import TradingViewWidget from "@/components/TradingViewWidget";
import {
    getMarketDataWidgetConfig,
    getMarketOverviewWidgetConfig,
    HEATMAP_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG,
} from "@/lib/constants";
import { getDashboardWatchlistSymbols } from "@/lib/watchlist/dashboard-widget-symbols";

const Home = async () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
    const watchlistSymbols = await getDashboardWatchlistSymbols();
    const isPersonalized = watchlistSymbols.length > 0;
    const overviewConfig = getMarketOverviewWidgetConfig(watchlistSymbols);
    const quotesConfig = getMarketDataWidgetConfig(watchlistSymbols);

    return (
        <div className="flex min-h-screen home-wrapper">
          {isPersonalized && (
              <p className="text-sm text-gray-500">Showing your watchlist</p>
          )}
          <section className="grid w-full gap-8 home-section">
              <div className="md:col-span-1 xl:col-span-1">
                  <TradingViewWidget
                    title="Market Overview"
                    scriptUrl={`${scriptUrl}market-overview.js`}
                    config={overviewConfig}
                    className="custom-chart"
                    height={600}
                  />
              </div>
              <div className="md-col-span xl:col-span-2">
                  <TradingViewWidget
                      title="Stock Heatmap"
                      scriptUrl={`${scriptUrl}stock-heatmap.js`}
                      config={HEATMAP_WIDGET_CONFIG}
                      height={600}
                  />
              </div>
          </section>
            <section className="grid w-full gap-8 home-section">
                <div className="h-full md:col-span-1 xl:col-span-1">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}timeline.js`}
                        config={TOP_STORIES_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
                <div className="h-full md:col-span-1 xl:col-span-2">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={quotesConfig}
                        height={600}
                    />
                </div>
            </section>
        </div>
    )
}

export default Home;
