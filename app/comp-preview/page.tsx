import Link from "next/link";
import { Bell } from "lucide-react";

/** Development / capture preview of Morning Briefing Packet composition. Synthetic data labeled as such. */
const SYNTHETIC = [
  { symbol: "AAPL", company: "Apple Inc.", price: "194.62", change: "+1.23", changePct: "+0.64%", up: true },
  { symbol: "MSFT", company: "Microsoft", price: "430.15", change: "-0.87", changePct: "-0.20%", up: false },
  { symbol: "NVDA", company: "NVIDIA", price: "1,152.74", change: "+35.21", changePct: "+3.15%", up: true },
  { symbol: "AMZN", company: "Amazon", price: "184.57", change: "+0.68", changePct: "+0.37%", up: true },
  { symbol: "GOOGL", company: "Alphabet", price: "163.28", change: "-1.12", changePct: "-0.68%", up: false },
];

export default function CompPreviewPage() {
  return (
    <main className="briefing-shell min-h-screen">
      <header className="sticky top-0 header">
        <div className="container header-wrapper">
          <Link href="/" className="font-[family-name:var(--font-display)] text-xl text-[var(--briefing-ink)]">
            TradePilot
          </Link>
          <nav className="hidden sm:flex justify-center" aria-label="Primary">
            <ul className="nav-list">
              <li><span className="nav-link nav-link-active">Dashboard</span></li>
              <li><span className="nav-link">Search</span></li>
              <li><span className="nav-link">Watchlist</span></li>
            </ul>
          </nav>
          <div className="flex items-center justify-end gap-3 text-sm text-[var(--briefing-slate)] shrink-0">
            <Bell className="h-5 w-5" aria-hidden={false} aria-label="Notifications" />
            <span className="whitespace-nowrap">Good morning, Alex</span>
          </div>
        </div>
      </header>

      <div className="container briefing-main">
        <div className="briefing-packet">
          <header className="dashboard-masthead">
            <div className="dashboard-masthead-copy">
              <h1 className="dashboard-masthead-date">TUESDAY, MAY 13, 2025 • 7:45 AM ET</h1>
            </div>
            <dl className="dashboard-masthead-meta">
              <div>
                <dt>Session</dt>
                <dd>Pre-Market Check-In</dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd>Your watchlist</dd>
              </div>
            </dl>
          </header>

          <div className="briefing-split">
            <aside className="attention-rail">
              <h2 className="attention-heading">Needs Attention</h2>
              <p className="attention-section-label">Alerts</p>
              <ul className="attention-list">
                <li className="attention-item">
                  <span className="attention-stamp">UPPER</span>
                  <div>
                    <Link href="/stocks/NVDA" className="attention-symbol">NVDA</Link>
                    <p className="attention-item-name">Price above $1,100</p>
                    <p className="attention-item-detail">Synthetic demo alert</p>
                  </div>
                </li>
                <li className="attention-item">
                  <span className="attention-stamp">LOWER</span>
                  <div>
                    <Link href="/stocks/GOOGL" className="attention-symbol">GOOGL</Link>
                    <p className="attention-item-name">Price below $165</p>
                    <p className="attention-item-detail">Synthetic demo alert</p>
                  </div>
                </li>
              </ul>
              <p className="attention-section-label">Movers</p>
              <ul className="attention-list">
                <li className="attention-item">
                  <span className="attention-stamp">VOLUME</span>
                  <div>
                    <Link href="/stocks/NVDA" className="attention-symbol">NVDA</Link>
                    <p className="attention-item-name">Volume spike</p>
                    <p className="attention-item-detail">Synthetic demo notice</p>
                  </div>
                </li>
              </ul>
              <div className="attention-footer">
                <Link href="/watchlist" className="attention-footer-link">View all alerts →</Link>
              </div>
            </aside>

            <section className="watchlist-panel">
              <div className="watchlist-panel-header">
                <h2 className="watchlist-panel-heading">MY WATCHLIST</h2>
                <span className="watchlist-panel-link">Synthetic preview</span>
              </div>
              <div className="briefing-watchlist-table-wrap">
                <table className="briefing-watchlist-table">
                  <thead>
                    <tr>
                      <th scope="col">Symbol</th>
                      <th scope="col">Company</th>
                      <th scope="col">Price</th>
                      <th scope="col">Chg</th>
                      <th scope="col">Chg%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SYNTHETIC.map((row, i) => (
                      <tr key={row.symbol} className={i === 2 ? "is-struck" : undefined}>
                        <td><Link href={`/stocks/${row.symbol}`}>{row.symbol}</Link></td>
                        <td>{row.company}</td>
                        <td className="tabular-nums">{row.price}</td>
                        <td className={`tabular-nums ${row.up ? "text-delta-up" : "text-delta-down"}`}>
                          {row.change}
                        </td>
                        <td className={`tabular-nums ${row.up ? "text-delta-up" : "text-delta-down"}`}>
                          {row.changePct}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="market-context-band" aria-label="Market context">
            <h2 className="market-context-heading">MARKET CONTEXT</h2>
            <p className="attention-empty">
              Live heatmap and timeline widgets load on the signed-in dashboard. This preview shows the packet frame only.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
