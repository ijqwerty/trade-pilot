/** HTTP cache TTLs (seconds) — engineering defaults per feature spec 02 */
export const FINNHUB_TTL = {
  quote: 60,
  candle: 60,
  metric: 300,
  companyNews: 300,
  generalNews: 300,
  search: 1800,
  profile2: 3600,
} as const;

export const FINNHUB_MAX_QUOTES_PER_BATCH = 50;

export const FINNHUB_RATE_LIMIT_PER_MINUTE = 30;
export const FINNHUB_RATE_LIMIT_MAX_WAIT_MS = 2000;
