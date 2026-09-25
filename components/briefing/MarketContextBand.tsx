import type { ReactNode } from 'react';

type MarketContextBandProps = {
  children: ReactNode;
  /** Soften global widgets when the watchlist is empty. */
  demoted?: boolean;
};

export default function MarketContextBand({
  children,
  demoted = false,
}: MarketContextBandProps) {
  return (
    <section
      className={demoted ? 'market-context-band market-context-band--demoted' : 'market-context-band'}
      aria-labelledby="market-context-heading"
    >
      <h2 id="market-context-heading" className="market-context-heading">
        MARKET CONTEXT
      </h2>
      {demoted ? (
        <p className="market-context-note">
          Wider market view — quieter until your watchlist is set.
        </p>
      ) : null}
      <div className="market-context-widgets">{children}</div>
    </section>
  );
}
