type AuthCoverProps = {
  variant?: "panel" | "compact";
  dateLine: string;
};

const WATCHLIST_ROWS = [
  {
    symbol: "AAPL",
    company: "Apple Inc.",
    price: "178.42",
    change: "+1.24%",
    direction: "up" as const,
  },
  {
    symbol: "MSFT",
    company: "Microsoft",
    price: "415.20",
    change: "−0.38%",
    direction: "down" as const,
  },
  {
    symbol: "NVDA",
    company: "NVIDIA",
    price: "875.10",
    change: "+2.11%",
    direction: "up" as const,
  },
  {
    symbol: "AMZN",
    company: "Amazon",
    price: "186.55",
    change: "+0.62%",
    direction: "up" as const,
  },
] as const;

const AuthCover = ({ variant = "panel", dateLine }: AuthCoverProps) => {
  if (variant === "compact") {
    return (
      <div className="auth-mobile-cover">
        <p className="auth-cover-date auth-mobile-cover-date">{dateLine}</p>
        <p className="auth-mobile-cover-title">
          Watch your symbols. Catch the move.
        </p>
        <p className="auth-mobile-cover-lede">
          Morning briefing for the list you follow — alerts included.
        </p>
      </div>
    );
  }

  return (
    <div className="auth-cover-panel" aria-hidden="true">
      <header className="auth-showcase-masthead">
        <p className="auth-cover-date">{dateLine}</p>
        <h2 className="auth-showcase-statement">
          Watch your symbols.
          <br />
          Catch the move.
        </h2>
        <p className="auth-showcase-lede">
          A calm window into your watchlist, price alerts, and market context —
          not a trading terminal.
        </p>
      </header>

      <div className="auth-showcase-stage">
        <div className="auth-showcase-frame" />
        <div className="auth-showcase-line auth-showcase-line--a" />
        <div className="auth-showcase-line auth-showcase-line--b" />

        <article className="auth-mod auth-mod--watchlist">
          <header className="auth-mod-header">
            <h3 className="auth-mod-title">My Watchlist</h3>
            <span className="auth-mod-meta">4 symbols</span>
          </header>
          <table className="auth-mod-table">
            <thead>
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Price</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {WATCHLIST_ROWS.map((row) => (
                <tr key={row.symbol}>
                  <td>
                    <span className="auth-mod-symbol">{row.symbol}</span>
                    <span className="auth-mod-company">{row.company}</span>
                  </td>
                  <td className="tabular-nums">{row.price}</td>
                  <td
                    className={
                      row.direction === "up"
                        ? "tabular-nums text-delta-up"
                        : "tabular-nums text-delta-down"
                    }
                  >
                    {row.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <div className="auth-mod-float auth-mod-float--alert">
          <article className="auth-mod auth-mod--alert">
            <div className="auth-mod-alert-row">
              <span className="attention-stamp auth-mod-stamp">UPPER</span>
              <div className="auth-mod-alert-body">
                <p className="auth-mod-alert-symbol">AAPL</p>
                <p className="auth-mod-alert-name">Break above open</p>
              </div>
              <span className="auth-mod-alert-pulse" />
            </div>
            <p className="auth-mod-alert-detail">
              Price above <span className="tabular-nums">$180.00</span>
              <span className="auth-mod-alert-now">
                {" "}
                · now <span className="tabular-nums">$178.42</span>
              </span>
            </p>
          </article>
        </div>

        <article className="auth-mod auth-mod--trend">
          <header className="auth-mod-header">
            <h3 className="auth-mod-title">Session</h3>
            <span className="auth-mod-meta auth-mod-meta--live">Open</span>
          </header>
          <p className="auth-mod-trend-label">Watchlist trend</p>
          <svg
            className="auth-mod-chart"
            viewBox="0 0 160 48"
            fill="none"
            aria-hidden="true"
          >
            <path
              className="auth-mod-chart-baseline"
              d="M0 36 H160"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              className="auth-mod-chart-line"
              d="M0 34 C18 32 28 28 42 22 C56 16 68 18 82 24 C96 30 108 12 124 10 C140 8 150 14 160 8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <dl className="auth-mod-trend-stats">
            <div>
              <dt>Movers</dt>
              <dd className="tabular-nums text-delta-up">2↑</dd>
            </div>
            <div>
              <dt>Alerts</dt>
              <dd className="tabular-nums">1 armed</dd>
            </div>
          </dl>
        </article>
      </div>
    </div>
  );
};

export default AuthCover;
