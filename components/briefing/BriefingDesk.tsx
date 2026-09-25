'use client';

import { useCallback, useState } from 'react';
import AttentionRail from '@/components/briefing/AttentionRail';
import BriefingWatchlistTable from '@/components/briefing/BriefingWatchlistTable';
import Link from 'next/link';
import TradingViewWidget from '@/components/TradingViewWidget';

type AttentionAlert = Pick<
  Alert,
  'symbol' | 'alertName' | 'alertType' | 'threshold' | 'company'
> & {
  id?: string;
  currentPrice?: number;
};

type BriefingDeskProps = {
  alerts: AttentionAlert[];
  notifications: AppNotification[];
  watchlist: StockWithData[];
  hasWatchlist: boolean;
  isPersonalized: boolean;
  quotesUpdatedLabel: string | null;
  overviewConfig: Record<string, unknown>;
  quotesConfig: Record<string, unknown>;
  scriptUrl: string;
};

export default function BriefingDesk({
  alerts,
  notifications,
  watchlist,
  hasWatchlist,
  isPersonalized,
  quotesUpdatedLabel,
  overviewConfig,
  quotesConfig,
  scriptUrl,
}: BriefingDeskProps) {
  const [focusedSymbol, setFocusedSymbol] = useState<string | null>(null);

  const handleFocusSymbolChange = useCallback((symbol: string | null) => {
    setFocusedSymbol(symbol);
  }, []);

  return (
    <div className="briefing-split">
      <AttentionRail
        alerts={alerts}
        notifications={notifications}
        emptyWatchlist={!hasWatchlist}
        focusedSymbol={focusedSymbol}
        onFocusSymbolChange={handleFocusSymbolChange}
      />

      <section className="watchlist-panel" aria-labelledby="watchlist-panel-heading">
        <div className="watchlist-panel-header">
          <h2 id="watchlist-panel-heading" className="watchlist-panel-heading">
            MY WATCHLIST
          </h2>
          <div className="watchlist-panel-meta">
            {quotesUpdatedLabel ? (
              <p className="watchlist-panel-updated">{quotesUpdatedLabel}</p>
            ) : null}
            {hasWatchlist ? (
              <Link href="/watchlist" className="watchlist-panel-link">
                Manage watchlist →
              </Link>
            ) : null}
          </div>
        </div>

        {!hasWatchlist ? (
          <div className="watchlist-panel-empty">
            <p>
              Your morning brief centers on the symbols you follow. Add a few from Search
              (⌘K) or open your <Link href="/watchlist">watchlist</Link> to get started.
            </p>
          </div>
        ) : (
          <>
            <BriefingWatchlistTable
              watchlist={watchlist}
              focusedSymbol={focusedSymbol}
              onFocusSymbolChange={handleFocusSymbolChange}
            />

            {isPersonalized ? (
              <div className="watchlist-panel-widgets">
                <TradingViewWidget
                  title="Watchlist overview"
                  scriptUrl={`${scriptUrl}market-overview.js`}
                  config={overviewConfig}
                  className="custom-chart"
                  height={300}
                  quiet
                />
                <TradingViewWidget
                  title="Watchlist quotes"
                  scriptUrl={`${scriptUrl}market-quotes.js`}
                  config={quotesConfig}
                  height={300}
                  quiet
                />
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
