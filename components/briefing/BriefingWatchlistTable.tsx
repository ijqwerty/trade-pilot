'use client';

import Link from 'next/link';
import { useCallback, useId, useState } from 'react';

type BriefingWatchlistTableProps = {
  watchlist: StockWithData[];
  /** When set, selecting a row notifies the parent (e.g. attention rail sync). */
  onFocusSymbolChange?: (symbol: string | null) => void;
  /** Controlled focus symbol from parent (attention rail). */
  focusedSymbol?: string | null;
};

export default function BriefingWatchlistTable({
  watchlist,
  onFocusSymbolChange,
  focusedSymbol,
}: BriefingWatchlistTableProps) {
  const labelId = useId();
  const [internalFocus, setInternalFocus] = useState<string | null>(null);
  const selected = focusedSymbol !== undefined ? focusedSymbol : internalFocus;

  const setSelected = useCallback(
    (symbol: string | null) => {
      if (focusedSymbol === undefined) {
        setInternalFocus(symbol);
      }
      onFocusSymbolChange?.(symbol);
    },
    [focusedSymbol, onFocusSymbolChange]
  );

  const toggleRow = (symbol: string) => {
    setSelected(selected === symbol ? null : symbol);
  };

  return (
    <div className="briefing-watchlist-table-wrap">
      <table
        className={
          selected
            ? 'briefing-watchlist-table has-focus-selection'
            : 'briefing-watchlist-table'
        }
        aria-labelledby={labelId}
      >
        <caption id={labelId} className="sr-only">
          Your watchlist quotes. Select a row to focus it; Escape clears focus.
        </caption>
        <thead>
          <tr>
            <th scope="col">Symbol</th>
            <th scope="col" className="col-secondary">
              Company
            </th>
            <th scope="col">Price</th>
            <th scope="col">Change</th>
            <th scope="col" className="col-defer">
              Cap
            </th>
            <th scope="col" className="col-defer">
              P/E
            </th>
          </tr>
        </thead>
        <tbody>
          {watchlist.map((item) => {
            const isSelected = selected === item.symbol;
            return (
              <tr
                key={item.symbol}
                tabIndex={0}
                aria-selected={isSelected}
                className={isSelected ? 'is-focused' : undefined}
                onClick={() => toggleRow(item.symbol)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleRow(item.symbol);
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setSelected(null);
                  }
                }}
              >
                <td>
                  <Link
                    href={`/stocks/${encodeURIComponent(item.symbol)}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {item.symbol}
                  </Link>
                </td>
                <td className="col-secondary">{item.company}</td>
                <td className="tabular-nums">{item.priceFormatted ?? '—'}</td>
                <td className="tabular-nums">{item.changeFormatted ?? '—'}</td>
                <td className="tabular-nums col-defer">{item.marketCap ?? '—'}</td>
                <td className="tabular-nums col-defer">{item.peRatio ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
