"use client";

import Link from "next/link";
import WatchlistButton from "@/components/WatchlistButton";
import AddAlertButton from "@/components/AddAlertButton";
import { getChangeColorClass } from "@/lib/utils";

const PLACEHOLDER = "—";

const COLUMNS = [
  { id: "company", label: "Company", defer: false },
  { id: "symbol", label: "Symbol", defer: false },
  { id: "price", label: "Price", defer: false },
  { id: "change", label: "Change", defer: false },
  { id: "mcap", label: "Market Cap", defer: true },
  { id: "pe", label: "P/E Ratio", defer: true },
  { id: "alert", label: "Alert", defer: false },
  { id: "action", label: "Action", defer: false },
] as const;

function colClass(id: (typeof COLUMNS)[number]["id"], defer: boolean) {
  return `wl-col wl-col--${id}${defer ? " col-defer" : ""}`;
}

export default function WatchlistTable({
  watchlist,
  alertCount = 0,
}: WatchlistTableProps) {
  return (
    <div className="watchlist-table">
      <table className="watchlist-data-table">
        <colgroup>
          {COLUMNS.map((column) => (
            <col
              key={column.id}
              className={colClass(column.id, column.defer)}
            />
          ))}
        </colgroup>
        <thead>
          <tr className="table-header-row">
            {COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={`table-header ${colClass(column.id, column.defer)}`}
              >
                {column.id === "action" ? (
                  <span className="sr-only">{column.label}</span>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {watchlist.map((item) => (
            <tr key={item.symbol} className="table-row">
              <td className={`table-cell ${colClass("company", false)}`}>
                <Link
                  href={`/stocks/${item.symbol}`}
                  className="wl-company-link"
                >
                  {item.company}
                </Link>
              </td>
              <td className={`table-cell ${colClass("symbol", false)}`}>
                {item.symbol}
              </td>
              <td className={`table-cell ${colClass("price", false)}`}>
                {item.priceFormatted ?? PLACEHOLDER}
              </td>
              <td
                className={`table-cell ${colClass("change", false)} ${getChangeColorClass(item.changePercent)}`}
              >
                {item.changeFormatted ?? PLACEHOLDER}
              </td>
              <td className={`table-cell ${colClass("mcap", true)}`}>
                {item.marketCap ?? PLACEHOLDER}
              </td>
              <td className={`table-cell ${colClass("pe", true)}`}>
                {item.peRatio ?? PLACEHOLDER}
              </td>
              <td className={`table-cell ${colClass("alert", false)}`}>
                <AddAlertButton
                  symbol={item.symbol}
                  company={item.company}
                  alertCount={alertCount}
                />
              </td>
              <td className={`table-cell ${colClass("action", false)}`}>
                <WatchlistButton
                  symbol={item.symbol}
                  company={item.company}
                  isInWatchlist
                  showTrashIcon
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
