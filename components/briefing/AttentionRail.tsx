'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

type AttentionAlert = Pick<
  Alert,
  'symbol' | 'alertName' | 'alertType' | 'threshold' | 'company'
> & {
  id?: string;
  currentPrice?: number;
};

type AttentionRailProps = {
  alerts: AttentionAlert[];
  notifications?: AppNotification[];
  /** When true, empty-state copy points at building a watchlist first. */
  emptyWatchlist?: boolean;
  focusedSymbol?: string | null;
  onFocusSymbolChange?: (symbol: string | null) => void;
};

function stampLabel(alertType: AttentionAlert['alertType']): string {
  return alertType === 'upper' ? 'UPPER' : 'LOWER';
}

function stampMeaning(alertType: AttentionAlert['alertType']): string {
  return alertType === 'upper' ? 'Price above' : 'Price below';
}

function toggleFocus(
  symbol: string,
  focusedSymbol: string | null,
  onFocusSymbolChange?: (symbol: string | null) => void
) {
  if (!onFocusSymbolChange) return;
  onFocusSymbolChange(focusedSymbol === symbol ? null : symbol);
}

export default function AttentionRail({
  alerts,
  notifications,
  emptyWatchlist = false,
  focusedSymbol = null,
  onFocusSymbolChange,
}: AttentionRailProps) {
  const hasAlerts = alerts.length > 0;
  const recentNotifications = (notifications ?? []).slice(0, 3);
  const hasFocus = Boolean(focusedSymbol);

  return (
    <aside
      className={
        hasFocus ? 'attention-rail attention-rail--has-focus' : 'attention-rail'
      }
      aria-labelledby="attention-heading"
    >
      <h2 id="attention-heading" className="attention-heading">
        NEEDS ATTENTION
      </h2>

      <section className="attention-section" aria-label="Alerts">
        <h3 className="attention-section-label">ALERTS</h3>

        {hasAlerts ? (
          <ul className="attention-list">
            {alerts.map((alert) => {
              const key = alert.id ?? `${alert.symbol}-${alert.alertName}-${alert.threshold}`;
              const price =
                typeof alert.currentPrice === 'number' && alert.currentPrice > 0
                  ? formatPrice(alert.currentPrice)
                  : null;
              const isFocused = focusedSymbol === alert.symbol;

              return (
                <li
                  key={key}
                  className={
                    isFocused
                      ? 'attention-item attention-item--focused'
                      : 'attention-item'
                  }
                  tabIndex={0}
                  aria-selected={isFocused}
                  onClick={() =>
                    toggleFocus(alert.symbol, focusedSymbol, onFocusSymbolChange)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleFocus(alert.symbol, focusedSymbol, onFocusSymbolChange);
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      onFocusSymbolChange?.(null);
                    }
                  }}
                >
                  <span
                    className="attention-stamp"
                    title={stampMeaning(alert.alertType)}
                  >
                    {stampLabel(alert.alertType)}
                  </span>
                  <div className="attention-item-body">
                    <Link
                      href={`/stocks/${encodeURIComponent(alert.symbol)}`}
                      className="attention-symbol"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {alert.symbol}
                    </Link>
                    <p className="attention-item-name">{alert.alertName}</p>
                    <p className="attention-item-detail">
                      {stampMeaning(alert.alertType)}{' '}
                      <span className="tabular-nums">{formatPrice(alert.threshold)}</span>
                      {price ? (
                        <>
                          {' '}
                          · now <span className="tabular-nums">{price}</span>
                        </>
                      ) : null}
                    </p>
                    <p className="attention-item-company">{alert.company}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="attention-empty">
            {emptyWatchlist ? (
              <>
                <p>
                  Nothing flagged yet. This rail stays primary even before alerts
                  arrive — start with symbols, then set a price alert.
                </p>
                <p>
                  Add symbols from Search (⌘K) or open your{' '}
                  <Link href="/watchlist">watchlist</Link>, then use{' '}
                  <strong>Add Alert</strong> on a row or stock page.
                </p>
              </>
            ) : (
              <>
                <p>
                  No price alerts yet. Your list is ready — set an upper or lower
                  threshold so movers land here first.
                </p>
                <p>
                  Open <Link href="/watchlist">Manage watchlist</Link> and choose{' '}
                  <strong>Add Alert</strong> on a row, or open a symbol and add one
                  there.
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {recentNotifications.length > 0 ? (
        <section className="attention-section" aria-label="Movers and notices">
          <h3 className="attention-section-label">MOVERS</h3>
          <ul className="attention-list">
            {recentNotifications.map((note) => {
              const isVolume = note.type === 'volume_spike';
              const noteSymbol = note.symbol ?? null;
              const isFocused = Boolean(noteSymbol && focusedSymbol === noteSymbol);
              const canFocus = Boolean(noteSymbol && onFocusSymbolChange);

              return (
                <li
                  key={note.id}
                  className={
                    isFocused
                      ? 'attention-item attention-item--focused'
                      : 'attention-item'
                  }
                  tabIndex={canFocus ? 0 : undefined}
                  aria-selected={canFocus ? isFocused : undefined}
                  onClick={
                    canFocus && noteSymbol
                      ? () =>
                          toggleFocus(noteSymbol, focusedSymbol, onFocusSymbolChange)
                      : undefined
                  }
                  onKeyDown={
                    canFocus && noteSymbol
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleFocus(noteSymbol, focusedSymbol, onFocusSymbolChange);
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            onFocusSymbolChange?.(null);
                          }
                        }
                      : undefined
                  }
                >
                  {isVolume ? (
                    <span className="attention-stamp">VOLUME</span>
                  ) : (
                    <span className="attention-stamp">NOTE</span>
                  )}
                  <div className="attention-item-body">
                    {note.href ? (
                      <Link
                        href={note.href}
                        className="attention-symbol"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {note.symbol ?? note.title}
                      </Link>
                    ) : (
                      <p className="attention-item-name">{note.title}</p>
                    )}
                    <p className="attention-item-name">{note.title}</p>
                    <p className="attention-item-detail">{note.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <p className="attention-footer">
        <Link href="/watchlist" className="attention-footer-link">
          View all alerts →
        </Link>
      </p>
    </aside>
  );
}
