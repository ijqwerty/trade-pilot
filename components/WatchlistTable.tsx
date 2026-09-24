"use client";

import Link from "next/link";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import WatchlistButton from "@/components/WatchlistButton";
import AddAlertButton from "@/components/AddAlertButton";
import { getChangeColorClass } from "@/lib/utils";

const PLACEHOLDER = "—";

export default function WatchlistTable({
  watchlist,
  alertCount = 0,
}: WatchlistTableProps) {
  return (
    <div className="watchlist-table overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header-row">
            {WATCHLIST_TABLE_HEADER.map((header) => (
              <th key={header} className="table-header px-4 py-3 text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {watchlist.map((item) => (
            <tr key={item.symbol} className="table-row">
              <td className="table-cell px-4 py-3">
                <Link href={`/stocks/${item.symbol}`} className="hover:text-yellow-500 transition-colors">
                  {item.company}
                </Link>
              </td>
              <td className="table-cell px-4 py-3">{item.symbol}</td>
              <td className="table-cell px-4 py-3">{item.priceFormatted ?? PLACEHOLDER}</td>
              <td
                className={`table-cell px-4 py-3 ${getChangeColorClass(item.changePercent)}`}
              >
                {item.changeFormatted ?? PLACEHOLDER}
              </td>
              <td className="table-cell px-4 py-3">{item.marketCap ?? PLACEHOLDER}</td>
              <td className="table-cell px-4 py-3">{item.peRatio ?? PLACEHOLDER}</td>
              <td className="table-cell px-4 py-3">
                <AddAlertButton
                  symbol={item.symbol}
                  company={item.company}
                  alertCount={alertCount}
                />
              </td>
              <td className="table-cell px-4 py-3">
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
