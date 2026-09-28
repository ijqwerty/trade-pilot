import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import AddAlertButton from "@/components/AddAlertButton";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import {
  getWatchlistCompanyForCurrentUser,
  isSymbolInWatchlist,
} from "@/lib/actions/watchlist.actions";
import { getMyAlerts } from "@/lib/actions/alert.actions";
import { getTradingViewSymbolForStock } from "@/lib/tradingview/get-mapped-symbol";

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  const [savedCompany, isInWatchlist, alertsResult, tvSymbol] = await Promise.all([
    getWatchlistCompanyForCurrentUser(upperSymbol),
    isSymbolInWatchlist(upperSymbol),
    getMyAlerts(),
    getTradingViewSymbolForStock({ symbol: upperSymbol }),
  ]);
  const company = savedCompany ?? upperSymbol;
  const alertCount = alertsResult.success ? alertsResult.data.length : 0;
  // Spec 09: mapped EXCHANGE:SYMBOL when known; else raw uppercase (today's behavior)
  const widgetSymbol = tvSymbol || upperSymbol;

  return (
    <div className="packet-page">
      <header className="packet-page-header">
        <div>
          <h1 className="packet-page-title">{upperSymbol}</h1>
          <p className="packet-page-lede">{company}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <WatchlistButton
            symbol={upperSymbol}
            company={company}
            isInWatchlist={isInWatchlist}
          />
          <AddAlertButton
            symbol={upperSymbol}
            company={company}
            alertCount={alertCount}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <div className="flex flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(widgetSymbol)}
            height={170}
            quiet
          />

          <TradingViewWidget
            title="Candles"
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(widgetSymbol)}
            className="custom-chart"
            height={480}
            quiet
          />

          <TradingViewWidget
            title="Baseline"
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(widgetSymbol)}
            className="custom-chart"
            height={400}
            quiet
          />
        </div>

        <div className="flex flex-col gap-6">
          <TradingViewWidget
            title="Technical analysis"
            note="Third-party TradingView gauges (including Buy/Sell labels) are technical views, not TradePilot advice."
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(widgetSymbol)}
            height={400}
            quiet
          />

          <TradingViewWidget
            title="Company profile"
            scriptUrl={`${scriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(widgetSymbol)}
            height={440}
            quiet
          />

          <TradingViewWidget
            title="Financials"
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(widgetSymbol)}
            height={464}
            quiet
          />
        </div>
      </section>
    </div>
  );
}
