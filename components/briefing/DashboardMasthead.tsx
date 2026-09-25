function formatBriefingDateTime(date: Date): string {
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'America/New_York',
  }).format(date);
  const monthDayYear = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  }).format(date);

  return `${weekday}, ${monthDayYear} • ${time} ET`.toUpperCase();
}

type DashboardMastheadProps = {
  /** Defaults to now (America/New_York). */
  now?: Date;
  hasWatchlist?: boolean;
};

export default function DashboardMasthead({
  now = new Date(),
  hasWatchlist = false,
}: DashboardMastheadProps) {
  const dateLine = formatBriefingDateTime(now);
  const focus = hasWatchlist ? 'Your watchlist' : 'Build your watchlist';

  return (
    <header className="dashboard-masthead">
      <div className="dashboard-masthead-copy">
        <h1 className="dashboard-masthead-date">{dateLine}</h1>
      </div>
      <dl className="dashboard-masthead-meta">
        <div>
          <dt>Session</dt>
          <dd>Pre-Market Check-In</dd>
        </div>
        <div>
          <dt>Focus</dt>
          <dd>{focus}</dd>
        </div>
      </dl>
    </header>
  );
}
