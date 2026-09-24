import {
  FINNHUB_MAX_QUOTES_PER_BATCH,
  FINNHUB_RATE_LIMIT_MAX_WAIT_MS,
  FINNHUB_RATE_LIMIT_PER_MINUTE,
  FINNHUB_TTL,
} from '@/lib/finnhub/constants';

const FINNHUB_BASE =
  process.env.FINNHUB_BASE_URL?.replace(/\/$/, '') ?? 'https://finnhub.io/api/v1';

const inFlight = new Map<string, Promise<unknown>>();

let warnedPublicKey = false;

export class FinnhubConfigError extends Error {
  constructor(message = 'missing_api_key') {
    super(message);
    this.name = 'FinnhubConfigError';
  }
}

export class FinnhubRateLimitError extends Error {
  constructor() {
    super('rate_limited');
    this.name = 'FinnhubRateLimitError';
  }
}

export class FinnhubHttpError extends Error {
  status: number;
  path: string;

  constructor(status: number, path: string) {
    super(`Finnhub HTTP ${status}`);
    this.name = 'FinnhubHttpError';
    this.status = status;
    this.path = path;
  }
}

const rateLimiter = {
  timestamps: [] as number[],
  windowMs: 60_000,

  async acquire(): Promise<boolean> {
    for (;;) {
      const now = Date.now();
      this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
      if (this.timestamps.length < FINNHUB_RATE_LIMIT_PER_MINUTE) {
        this.timestamps.push(now);
        return true;
      }
      const oldest = this.timestamps[0];
      if (oldest === undefined) continue;
      const waitMs = this.windowMs - (now - oldest) + 1;
      if (waitMs > FINNHUB_RATE_LIMIT_MAX_WAIT_MS) {
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  },
};

export function normalizeFinnhubSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function getFinnhubApiKey(): string | null {
  const serverKey = process.env.FINNHUB_API_KEY;
  if (serverKey) return serverKey;

  const legacyPublic = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (legacyPublic) {
    if (!warnedPublicKey) {
      console.warn(
        '[finnhub] FINNHUB_API_KEY is unset; using NEXT_PUBLIC_FINNHUB_API_KEY for local compatibility. Set FINNHUB_API_KEY (server-only) in production.'
      );
      warnedPublicKey = true;
    }
    return legacyPublic;
  }

  return null;
}

function buildCacheKey(path: string, params: Record<string, string>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${normalizedPath}?${sorted}`;
}

function buildUrl(path: string, params: Record<string, string>, token: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${FINNHUB_BASE}${normalizedPath}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('token', token);
  return url.toString();
}

/**
 * Central Finnhub GET — token injection, rate limit, in-flight coalescing, Next fetch cache.
 */
export async function finnhubGet<T>(
  path: string,
  params: Record<string, string>,
  ttlSeconds: number
): Promise<T> {
  const token = getFinnhubApiKey();
  if (!token) {
    throw new FinnhubConfigError();
  }

  const cacheKey = buildCacheKey(path, params);
  const pending = inFlight.get(cacheKey);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = (async () => {
    const acquired = await rateLimiter.acquire();
    if (!acquired) {
      console.warn('[finnhub] rate_limited', path);
      throw new FinnhubRateLimitError();
    }

    const url = buildUrl(path, params, token);
    const res = await fetch(url, {
      cache: 'force-cache',
      next: { revalidate: ttlSeconds },
    });

    if (!res.ok) {
      console.error('[finnhub] fetch failed', res.status, path);
      throw new FinnhubHttpError(res.status, path);
    }

    return (await res.json()) as T;
  })();

  inFlight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlight.delete(cacheKey);
  }
}

function isFinnhubFailure(error: unknown): boolean {
  return (
    error instanceof FinnhubConfigError ||
    error instanceof FinnhubRateLimitError ||
    error instanceof FinnhubHttpError
  );
}

export async function getQuote(symbol: string): Promise<QuoteData | null> {
  const sym = normalizeFinnhubSymbol(symbol);
  if (!sym) return null;

  try {
    const data = await finnhubGet<QuoteData>('/quote', { symbol: sym }, FINNHUB_TTL.quote);
    if (data?.c == null || data.c === 0) return null;
    return data;
  } catch (error) {
    if (!isFinnhubFailure(error)) {
      console.error('[finnhub] getQuote failed', sym, error);
    }
    return null;
  }
}

export async function getQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const unique = [...new Set(symbols.map(normalizeFinnhubSymbol).filter(Boolean))];
  if (unique.length > FINNHUB_MAX_QUOTES_PER_BATCH) {
    console.warn(
      `[finnhub] getQuotes truncated from ${unique.length} to ${FINNHUB_MAX_QUOTES_PER_BATCH} symbols`
    );
    unique.length = FINNHUB_MAX_QUOTES_PER_BATCH;
  }

  const result: Record<string, QuoteData> = {};
  for (const sym of unique) {
    const quote = await getQuote(sym);
    if (quote) result[sym] = quote;
  }
  return result;
}

type FinnhubCandleResponse = {
  s: string;
  v?: number[];
};

type FinnhubMetricResponse = {
  metric?: Record<string, number>;
};

export type VolumeSnapshot = {
  /** Latest daily bar volume, in shares. */
  currentVolume: number;
  /** 10-day average trading volume, in shares. */
  averageVolume10d: number;
};

/**
 * Finnhub `/stock/metric` sample values for 10DayAverageTradingVolume are in millions
 * (e.g. 32.5). Candle `v` is share count. Values already ≥ 1e6 are treated as shares.
 */
function metricAverageToShares(avg: number): number {
  if (avg > 0 && avg < 1_000_000) return avg * 1_000_000;
  return avg;
}

async function fetchVolumeSnapshot(symbol: string): Promise<VolumeSnapshot | null> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 10 * 86400;

  // Metric first so a missing 10d average skips the candle call (spec 11).
  const metric = await finnhubGet<FinnhubMetricResponse>(
    '/stock/metric',
    { symbol, metric: 'all' },
    FINNHUB_TTL.metric
  );

  const rawAverage = metric?.metric?.['10DayAverageTradingVolume'];
  if (rawAverage == null || rawAverage <= 0) return null;
  const averageVolume10d = metricAverageToShares(rawAverage);
  if (averageVolume10d <= 0) return null;

  const candle = await finnhubGet<FinnhubCandleResponse>(
    '/stock/candle',
    {
      symbol,
      resolution: 'D',
      from: String(from),
      to: String(now),
    },
    FINNHUB_TTL.candle
  );

  if (candle.s !== 'ok' || !candle.v?.length) return null;
  const currentVolume = candle.v[candle.v.length - 1];
  if (currentVolume == null || currentVolume <= 0) return null;

  return { currentVolume, averageVolume10d };
}

/** Latest daily bar volume + 10-day average volume (for spec 11). */
export async function getVolumeSnapshot(symbol: string): Promise<VolumeSnapshot | null> {
  const sym = normalizeFinnhubSymbol(symbol);
  if (!sym) return null;

  try {
    return await fetchVolumeSnapshot(sym);
  } catch (error) {
    if (!isFinnhubFailure(error)) {
      console.error('[finnhub] getVolumeSnapshot failed', sym, error);
    }
    return null;
  }
}

/**
 * Batch volume snapshots through the shared cache/limiter.
 * Caps unique symbols (spec 02). Stops if the limiter is exhausted rather than hammering.
 */
export async function getVolumeSnapshots(
  symbols: string[]
): Promise<{ snapshots: Record<string, VolumeSnapshot>; skipped: boolean }> {
  const unique = [...new Set(symbols.map(normalizeFinnhubSymbol).filter(Boolean))];
  if (unique.length > FINNHUB_MAX_QUOTES_PER_BATCH) {
    console.warn(
      `[finnhub] getVolumeSnapshots truncated from ${unique.length} to ${FINNHUB_MAX_QUOTES_PER_BATCH} symbols`
    );
    unique.length = FINNHUB_MAX_QUOTES_PER_BATCH;
  }

  const snapshots: Record<string, VolumeSnapshot> = {};
  for (const sym of unique) {
    try {
      const snap = await fetchVolumeSnapshot(sym);
      if (snap) snapshots[sym] = snap;
    } catch (error) {
      if (error instanceof FinnhubRateLimitError) {
        console.warn('[finnhub] volume snapshots stopped due to rate_limited');
        return { snapshots, skipped: true };
      }
      if (!isFinnhubFailure(error)) {
        console.error('[finnhub] getVolumeSnapshots failed', sym, error);
      }
    }
  }

  return { snapshots, skipped: false };
}

export async function finnhubSearch(query: string): Promise<FinnhubSearchResponse> {
  return finnhubGet<FinnhubSearchResponse>(
    '/search',
    { q: query },
    FINNHUB_TTL.search
  );
}

export async function finnhubProfile2(symbol: string): Promise<Record<string, unknown> | null> {
  const sym = normalizeFinnhubSymbol(symbol);
  try {
    return await finnhubGet<Record<string, unknown>>(
      '/stock/profile2',
      { symbol: sym },
      FINNHUB_TTL.profile2
    );
  } catch (error) {
    if (!(error instanceof FinnhubConfigError || error instanceof FinnhubRateLimitError)) {
      console.error('[finnhub] profile2 failed', sym, error);
    }
    return null;
  }
}

export async function finnhubCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<RawNewsArticle[]> {
  const sym = normalizeFinnhubSymbol(symbol);
  try {
    const articles = await finnhubGet<RawNewsArticle[]>(
      '/company-news',
      { symbol: sym, from, to },
      FINNHUB_TTL.companyNews
    );
    return articles ?? [];
  } catch (error) {
    if (!(error instanceof FinnhubConfigError || error instanceof FinnhubRateLimitError)) {
      console.error('[finnhub] company-news failed', sym, error);
    }
    return [];
  }
}

export async function finnhubGeneralNews(): Promise<RawNewsArticle[]> {
  try {
    const articles = await finnhubGet<RawNewsArticle[]>(
      '/news',
      { category: 'general' },
      FINNHUB_TTL.generalNews
    );
    return articles ?? [];
  } catch (error) {
    if (!(error instanceof FinnhubConfigError || error instanceof FinnhubRateLimitError)) {
      console.error('[finnhub] general news failed', error);
    }
    return [];
  }
}
