import Link from "next/link";
import type { ReactElement } from "react";

/**
 * Temporary logo-mark comparison — not wired into production Header.
 * Visit /logo-explore. Signal Ticks is now the production mark in logo.svg.
 */

const INK = "#1B2430";
const TEAL = "#2F6F8F";
const PAPER = "#EEF2F6";

type MarkProps = {
  size?: number;
  mono?: boolean;
  title: string;
};

function Wordmark({ height = 20 }: { height?: number; mono?: boolean }) {
  // Existing TradePilot lettering (production paths, x − 34). Aspect ~90×30.
  const width = (90 / 30) * height;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 90 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6.81 22.50L4.21 22.50L4.21 11.79L0.39 11.79L0.39 9.62L10.63 9.62L10.63 11.79L6.81 11.79L6.81 22.50ZM14.65 19.62L14.65 22.50L12.18 22.50L12.18 13.17L14.48 13.17L14.48 14.49Q15.06 13.55 15.53 13.25Q16.00 12.96 16.60 12.96L16.60 12.96Q17.45 12.96 18.23 13.42L18.23 13.42L17.46 15.57Q16.84 15.17 16.30 15.17L16.30 15.17Q15.79 15.17 15.42 15.46Q15.06 15.74 14.86 16.49Q14.65 17.24 14.65 19.62L14.65 19.62ZM21.14 16.01L21.14 16.01L18.90 15.61Q19.27 14.26 20.20 13.61Q21.12 12.96 22.94 12.96L22.94 12.96Q24.59 12.96 25.40 13.35Q26.21 13.74 26.54 14.34Q26.87 14.94 26.87 16.55L26.87 16.55L26.84 19.43Q26.84 20.66 26.96 21.25Q27.08 21.83 27.40 22.50L27.40 22.50L24.96 22.50Q24.86 22.25 24.72 21.77L24.72 21.77Q24.66 21.55 24.64 21.48L24.64 21.48Q24.00 22.10 23.28 22.40Q22.56 22.71 21.74 22.71L21.74 22.71Q20.30 22.71 19.47 21.93Q18.64 21.15 18.64 19.95L18.64 19.95Q18.64 19.16 19.02 18.54Q19.40 17.92 20.08 17.59Q20.76 17.26 22.04 17.02L22.04 17.02Q23.77 16.69 24.44 16.41L24.44 16.41L24.44 16.16Q24.44 15.45 24.09 15.15Q23.74 14.84 22.76 14.84L22.76 14.84Q22.10 14.84 21.74 15.10Q21.37 15.36 21.14 16.01ZM24.44 18.51L24.44 18.02Q23.97 18.18 22.94 18.40Q21.91 18.62 21.59 18.83L21.59 18.83Q21.11 19.17 21.11 19.70L21.11 19.70Q21.11 20.21 21.50 20.59Q21.88 20.97 22.48 20.97L22.48 20.97Q23.15 20.97 23.76 20.53L23.76 20.53Q24.21 20.20 24.35 19.71L24.35 19.71Q24.44 19.40 24.44 18.51L24.44 18.51ZM37.86 9.62L37.86 22.50L35.57 22.50L35.57 21.13Q35.00 21.93 34.22 22.32Q33.44 22.71 32.65 22.71L32.65 22.71Q31.04 22.71 29.90 21.41Q28.75 20.12 28.75 17.80L28.75 17.80Q28.75 15.42 29.87 14.19Q30.98 12.96 32.69 12.96L32.69 12.96Q34.25 12.96 35.39 14.26L35.39 14.26L35.39 9.62L37.86 9.62ZM31.27 17.63L31.27 17.63Q31.27 19.13 31.68 19.79L31.68 19.79Q32.28 20.76 33.35 20.76L33.35 20.76Q34.21 20.76 34.80 20.03Q35.40 19.31 35.40 17.87L35.40 17.87Q35.40 16.26 34.82 15.55Q34.24 14.84 33.34 14.84L33.34 14.84Q32.46 14.84 31.86 15.54Q31.27 16.24 31.27 17.63ZM45.70 19.53L45.70 19.53L48.16 19.94Q47.69 21.30 46.67 22.00Q45.64 22.71 44.10 22.71L44.10 22.71Q41.67 22.71 40.50 21.12L40.50 21.12Q39.58 19.85 39.58 17.90L39.58 17.90Q39.58 15.58 40.79 14.27Q42.00 12.96 43.86 12.96L43.86 12.96Q45.94 12.96 47.14 14.33Q48.35 15.71 48.30 18.54L48.30 18.54L42.11 18.54Q42.13 19.64 42.71 20.25Q43.28 20.87 44.13 20.87L44.13 20.87Q44.71 20.87 45.11 20.55Q45.50 20.23 45.70 19.53ZM42.15 17.03L45.84 17.03Q45.82 15.96 45.29 15.40Q44.76 14.84 44.01 14.84L44.01 14.84Q43.20 14.84 42.67 15.43L42.67 15.43Q42.14 16.02 42.15 17.03L42.15 17.03ZM52.93 22.50L50.33 22.50L50.33 9.62L54.50 9.62Q56.87 9.62 57.59 9.81L57.59 9.81Q58.70 10.10 59.45 11.07Q60.20 12.04 60.20 13.58L60.20 13.58Q60.20 14.77 59.77 15.57Q59.33 16.38 58.67 16.84Q58.01 17.31 57.32 17.46L57.32 17.46Q56.39 17.64 54.62 17.64L54.62 17.64L52.93 17.64L52.93 22.50ZM54.18 11.79L52.93 11.79L52.93 15.45L54.35 15.45Q55.89 15.45 56.41 15.25Q56.93 15.05 57.22 14.62Q57.52 14.19 57.52 13.61L57.52 13.61Q57.52 12.91 57.10 12.45Q56.69 12.00 56.06 11.88L56.06 11.88Q55.59 11.79 54.18 11.79L54.18 11.79ZM64.78 11.90L62.31 11.90L62.31 9.62L64.78 9.62L64.78 11.90ZM64.78 22.50L62.31 22.50L62.31 13.17L64.78 13.17L64.78 22.50ZM69.79 22.50L67.32 22.50L67.32 9.62L69.79 9.62L69.79 22.50ZM71.75 17.70L71.75 17.70Q71.75 16.47 72.35 15.32Q72.96 14.17 74.07 13.56Q75.18 12.96 76.55 12.96L76.55 12.96Q78.67 12.96 80.02 14.33Q81.38 15.71 81.38 17.81L81.38 17.81Q81.38 19.92 80.01 21.32Q78.64 22.71 76.57 22.71L76.57 22.71Q75.29 22.71 74.12 22.13Q72.96 21.55 72.35 20.43Q71.75 19.31 71.75 17.70ZM74.28 17.83L74.28 17.83Q74.28 19.22 74.94 19.96Q75.59 20.70 76.56 20.70L76.56 20.70Q77.53 20.70 78.18 19.96Q78.84 19.22 78.84 17.82L78.84 17.82Q78.84 16.44 78.18 15.71Q77.53 14.97 76.56 14.97L76.56 14.97Q75.59 14.97 74.94 15.71Q74.28 16.44 74.28 17.83ZM85.90 13.17L87.59 13.17L87.59 15.13L85.90 15.13L85.90 18.90Q85.90 20.04 85.95 20.23Q86.00 20.42 86.17 20.54Q86.34 20.66 86.59 20.66L86.59 20.66Q86.93 20.66 87.58 20.43L87.58 20.43L87.79 22.34Q86.93 22.71 85.84 22.71L85.84 22.71Q85.17 22.71 84.64 22.49Q84.10 22.26 83.85 21.91Q83.60 21.55 83.50 20.94L83.50 20.94Q83.43 20.51 83.43 19.20L83.43 19.20L83.43 15.13L82.29 15.13L82.29 13.17L83.43 13.17L83.43 11.31L85.90 9.87L85.90 13.17Z"
        fill={INK}
      />
    </svg>
  );
}

function StrataBearing({ size = 32, mono = false, title }: MarkProps) {
  const ink = INK;
  const accent = mono ? INK : TEAL;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label={title} role="img">
      <title>{title}</title>
      <path d="M2 18 H30" stroke={ink} strokeWidth="2.25" strokeLinecap="square" />
      <path d="M9 12 V24" stroke={ink} strokeWidth="1.75" strokeLinecap="square" />
      <path d="M9 18 L23.5 9.5" stroke={accent} strokeWidth="2.25" strokeLinecap="square" />
      <path d="M21.6 7.7 L25.4 11.3" stroke={accent} strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

function SignalTicks({ size = 32, mono = false, title }: MarkProps) {
  const ink = INK;
  const accent = mono ? INK : TEAL;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label={title} role="img">
      <title>{title}</title>
      {/* Proof ticks crossing a thin strata — not bars on a chart axis */}
      <rect x="1.5" y="15" width="29" height="2" fill={ink} />
      <rect x="5.75" y="10.5" width="2" height="11" fill={ink} />
      <rect x="24.25" y="10.5" width="2" height="11" fill={ink} />
      <rect x="13.25" y="10.5" width="2" height="11" fill={accent} />
      <rect x="16.75" y="10.5" width="2" height="11" fill={accent} />
    </svg>
  );
}

function BriefingSeal({ size = 32, mono = false, title }: MarkProps) {
  const ink = INK;
  const accent = mono ? INK : TEAL;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label={title} role="img">
      <title>{title}</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 4.5 H20 L27.5 12 V27.5 H4.5 V4.5 ZM8 8 H18.25 L23.75 13.5 V24 H8 V8 Z"
        fill={ink}
      />
      <rect x="10.5" y="15.5" width="10" height="2.25" fill={accent} />
    </svg>
  );
}

function Lockup({
  Mark,
  label,
  mono = false,
}: {
  Mark: (p: MarkProps) => ReactElement;
  label: string;
  mono?: boolean;
}) {
  // Production header: logo Image h-8 (32px). Mark ≈28–32px; wordmark optical ~20px letter height inside 32px lockup.
  return (
    <div className="flex items-center gap-2" aria-label={`${label} TradePilot`}>
      <Mark size={28} mono={mono} title={label} />
      <Wordmark height={20} mono={mono} />
    </div>
  );
}

function HeaderStrip({
  Mark,
  label,
}: {
  Mark: (p: MarkProps) => ReactElement;
  label: string;
}) {
  return (
    <header
      className="w-full border-b border-[color-mix(in_srgb,#1b2430_14%,transparent)]"
      style={{ background: PAPER }}
    >
      <div className="mx-auto grid max-w-screen-2xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Lockup Mark={Mark} label={label} />
        <nav className="hidden justify-center sm:flex" aria-hidden>
          <ul className="flex gap-8 text-sm font-medium text-[#5a6573]">
            <li className="border-b-2 border-[#2f6f8f] pb-0.5 text-[#1b2430]">Dashboard</li>
            <li>Search</li>
            <li>Watchlist</li>
          </ul>
        </nav>
        <div className="flex justify-end text-sm text-[#5a6573]" aria-hidden>
          <span className="hidden sm:inline">Header chrome</span>
        </div>
      </div>
    </header>
  );
}

const CANDIDATES = [
  {
    id: "A",
    name: "Strata Bearing",
    Mark: StrataBearing,
    idea: "Dominant strata + short datum + shallow bearing with heading stub.",
  },
  {
    id: "B",
    name: "Signal Ticks",
    Mark: SignalTicks,
    idea: "Equal-height proof ticks crossing a thin strata; teal pair = signal cadence (not chart bars).",
  },
  {
    id: "C",
    name: "Briefing Seal",
    Mark: BriefingSeal,
    idea: "Stamp frame with NE heading chamfer and inner strata rule.",
  },
] as const;

export default function LogoExplorePage() {
  return (
    <main className="min-h-screen" style={{ background: PAPER, color: INK }}>
      <div className="border-b border-[color-mix(in_srgb,#1b2430_14%,transparent)] px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#5a6573]">
          Temporary exploration · TradePilot mark candidates
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.04em]">
          Logo mark comparison
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5a6573]">
          <strong className="font-medium text-[#1b2430]">B — Signal Ticks</strong> is implemented in
          production <code className="text-[#1b2430]">logo.svg</code> (and <code className="text-[#1b2430]">app/icon.svg</code>).
          Refined so ticks cross a paper rule rather than rising like equalizer bars. A/C remain for
          reference only.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/" className="text-[#2f6f8f] underline underline-offset-[3px]">
            ← Back to app
          </Link>
        </p>
      </div>

      {/* Side-by-side header contexts */}
      <section className="space-y-0">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#5a6573]">
            In header context · [mark] TradePilot
          </h2>
        </div>
        {CANDIDATES.map(({ id, name, Mark }) => (
          <div key={id} className="border-t border-[color-mix(in_srgb,#1b2430_14%,transparent)]">
            <p className="px-4 pt-3 text-xs font-medium text-[#5a6573] sm:px-6 lg:px-8">
              {id} — {name}
            </p>
            <HeaderStrip Mark={Mark} label={name} />
          </div>
        ))}
      </section>

      {/* Geometry inspection + sizes */}
      <section className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#5a6573]">
          Mark inspection
        </h2>
        <div className="mt-6 grid gap-10 lg:grid-cols-3">
          {CANDIDATES.map(({ id, name, Mark, idea }) => (
            <article
              key={id}
              className="border-t border-[color-mix(in_srgb,#1b2430_14%,transparent)] pt-4"
            >
              <h3 className="font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.04em]">
                {id} — {name}
              </h3>
              <p className="mt-1 text-sm text-[#5a6573]">{idea}</p>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#5a6573]">
                    Geometry · 128px
                  </p>
                  <div
                    className="inline-flex items-center justify-center border border-[color-mix(in_srgb,#1b2430_14%,transparent)] p-6"
                    style={{ background: "#F7F8F8" }}
                  >
                    <Mark size={128} title={`${name} large`} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#5a6573]">
                    Header size · 28px + wordmark
                  </p>
                  <div
                    className="inline-flex border border-[color-mix(in_srgb,#1b2430_14%,transparent)] px-4 py-3"
                    style={{ background: PAPER }}
                  >
                    <Lockup Mark={Mark} label={name} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#5a6573]">
                    Favicon / small · 20px · 24px · 32px
                  </p>
                  <div className="flex items-end gap-4">
                    <Mark size={20} title={`${name} 20`} />
                    <Mark size={24} title={`${name} 24`} />
                    <Mark size={32} title={`${name} 32`} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#5a6573]">
                    Monochrome · ink only
                  </p>
                  <div className="flex flex-wrap items-center gap-6">
                    <Mark size={64} mono title={`${name} mono large`} />
                    <Lockup Mark={Mark} label={name} mono />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Current production for reference */}
      <section className="border-t border-[color-mix(in_srgb,#1b2430_14%,transparent)] px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#5a6573]">
          Production lockup (live asset)
        </h2>
        <div
          className="mt-4 inline-flex border border-[color-mix(in_srgb,#1b2430_14%,transparent)] px-4 py-3"
          style={{ background: PAPER }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/icons/logo.svg"
            alt="TradePilot logo — Signal Ticks"
            width={160}
            height={32}
            className="h-8 w-auto"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div>
            <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#5a6573]">
              Favicon mark · 20 / 24 / 32
            </p>
            <div className="flex items-end gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/logo-explore/signal-ticks.svg" alt="" width={20} height={20} className="border border-[color-mix(in_srgb,#1b2430_14%,transparent)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/logo-explore/signal-ticks.svg" alt="" width={24} height={24} className="border border-[color-mix(in_srgb,#1b2430_14%,transparent)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/logo-explore/signal-ticks.svg" alt="" width={32} height={32} className="border border-[color-mix(in_srgb,#1b2430_14%,transparent)]" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#5a6573]">
              Monochrome mark
            </p>
            <SignalTicks size={48} mono title="Signal Ticks mono" />
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm text-[#5a6573]">
          Header and auth layouts load this asset. No commit yet — review first.
        </p>
      </section>
    </main>
  );
}
