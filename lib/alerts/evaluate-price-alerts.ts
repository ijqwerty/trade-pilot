import { connectToDatabase } from '@/database/mongoose';
import { AlertModel } from '@/database/models/alert.model';
import { UserProfile } from '@/database/models/user-profile.model';
import { getQuotes } from '@/lib/finnhub';
import { FINNHUB_MAX_QUOTES_PER_BATCH } from '@/lib/finnhub/constants';
import { FinnhubRateLimitError } from '@/lib/finnhub/client';
import { createNotification } from '@/lib/notifications/create-notification';
import {
  sendLowerPriceAlertEmail,
  sendUpperPriceAlertEmail,
} from '@/lib/nodemailer';

/** Active users must have signed in within this window (spec 08). */
const ACTIVE_SIGN_IN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type ActiveAlertRow = {
  alertId: string;
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: 'upper' | 'lower';
  threshold: number;
  isArmed: boolean;
  lastSignedInAt: Date;
  alertEmail: boolean;
  alertInApp: boolean;
  email: string;
  name: string;
};

type AuthUserRow = {
  id: string;
  email: string;
  name: string;
};

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }) + ' UTC';
}

function isTriggered(alertType: 'upper' | 'lower', price: number, threshold: number): boolean {
  return alertType === 'upper' ? price >= threshold : price <= threshold;
}

function isOnNonTriggeredSide(
  alertType: 'upper' | 'lower',
  price: number,
  threshold: number
): boolean {
  return alertType === 'upper' ? price < threshold : price > threshold;
}

async function loadAuthUsersByIds(userIds: string[]): Promise<Map<string, AuthUserRow>> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db || userIds.length === 0) return new Map();

  const users = await db
    .collection('user')
    .find(
      { id: { $in: userIds } },
      { projection: { _id: 1, id: 1, email: 1, name: 1 } }
    )
    .toArray();

  const map = new Map<string, AuthUserRow>();
  for (const user of users) {
    const id = (user.id as string) || user._id?.toString() || '';
    const email = typeof user.email === 'string' ? user.email : '';
    const name = typeof user.name === 'string' ? user.name : '';
    if (!id || !email) continue;
    map.set(id, { id, email, name: name || email });
  }
  return map;
}

/**
 * Active user = ≥1 enabled alert + lastSignedInAt within 7 days.
 * Missing lastSignedInAt ⇒ not active. Both channel flags false ⇒ skip.
 */
export async function fetchActivePriceAlerts(): Promise<ActiveAlertRow[]> {
  await connectToDatabase();

  const enabledAlerts = await AlertModel.find({ enabled: true })
    .select('_id userId symbol company alertName alertType threshold isArmed')
    .lean();

  if (enabledAlerts.length === 0) return [];

  const userIds = [...new Set(enabledAlerts.map((a) => String(a.userId)))];
  const cutoff = new Date(Date.now() - ACTIVE_SIGN_IN_WINDOW_MS);

  const profiles = await UserProfile.find({
    userId: { $in: userIds },
    lastSignedInAt: { $gte: cutoff },
  })
    .select('userId lastSignedInAt alertEmail alertInApp')
    .lean();

  const profileByUser = new Map(
    profiles.map((p) => [
      String(p.userId),
      {
        lastSignedInAt: p.lastSignedInAt as Date,
        // Missing flags default ON (spec 06 / 08)
        alertEmail: p.alertEmail !== false,
        alertInApp: p.alertInApp !== false,
      },
    ])
  );

  const activeUserIds = [...profileByUser.entries()]
    .filter(([, prefs]) => prefs.alertEmail || prefs.alertInApp)
    .map(([userId]) => userId);

  if (activeUserIds.length === 0) return [];

  const authUsers = await loadAuthUsersByIds(activeUserIds);
  const activeSet = new Set(activeUserIds);
  const rows: ActiveAlertRow[] = [];

  for (const alert of enabledAlerts) {
    const userId = String(alert.userId);
    if (!activeSet.has(userId)) continue;

    const prefs = profileByUser.get(userId);
    const authUser = authUsers.get(userId);
    if (!prefs || !authUser) continue;

    rows.push({
      alertId: String(alert._id),
      userId,
      symbol: String(alert.symbol).toUpperCase(),
      company: String(alert.company),
      alertName: String(alert.alertName),
      alertType: alert.alertType === 'lower' ? 'lower' : 'upper',
      threshold: Number(alert.threshold),
      isArmed: alert.isArmed !== false,
      lastSignedInAt: prefs.lastSignedInAt,
      alertEmail: prefs.alertEmail,
      alertInApp: prefs.alertInApp,
      email: authUser.email,
      name: authUser.name,
    });
  }

  return rows;
}

/** Prefer symbols belonging to most recently signed-in users when over batch cap. */
export function selectSymbolsForQuoteBatch(
  rows: Array<{ symbol: string; lastSignedInAt: Date }>,
  logLabel = '[price-alert]'
): string[] {
  const sorted = [...rows].sort((a, b) => {
    const aTime = new Date(a.lastSignedInAt).getTime();
    const bTime = new Date(b.lastSignedInAt).getTime();
    return bTime - aTime;
  });

  const symbols: string[] = [];
  const seen = new Set<string>();
  const totalUnique = new Set(rows.map((r) => r.symbol)).size;

  for (const row of sorted) {
    if (seen.has(row.symbol)) continue;
    seen.add(row.symbol);
    symbols.push(row.symbol);
    if (symbols.length >= FINNHUB_MAX_QUOTES_PER_BATCH) {
      if (seen.size < totalUnique) {
        console.warn(
          `${logLabel} symbol subset capped at ${FINNHUB_MAX_QUOTES_PER_BATCH}; preferring recent sign-ins`
        );
      }
      break;
    }
  }

  return symbols;
}

export async function fetchQuotesForAlerts(
  symbols: string[]
): Promise<{ quotes: Record<string, QuoteData>; skipped: boolean }> {
  if (symbols.length === 0) {
    return { quotes: {}, skipped: false };
  }

  try {
    const quotes = await getQuotes(symbols);
    return { quotes, skipped: false };
  } catch (error) {
    if (error instanceof FinnhubRateLimitError) {
      console.warn('[price-alert] Finnhub rate limit exhausted; skipping tick');
      return { quotes: {}, skipped: true };
    }
    throw error;
  }
}

export async function evaluateAndDeliverPriceAlerts(
  rows: ActiveAlertRow[],
  quotes: Record<string, QuoteData>
): Promise<{ fired: number; rearmed: number; skipped: number }> {
  let fired = 0;
  let rearmed = 0;
  let skipped = 0;

  await connectToDatabase();

  for (const row of rows) {
    try {
      const quote = quotes[row.symbol];
      const price = quote?.c;
      if (price == null || !Number.isFinite(price) || price <= 0) {
        console.warn('[price-alert] missing/invalid quote; skip', row.symbol, row.alertId);
        skipped += 1;
        continue;
      }

      // Alert may have been deleted after quote fetch
      const existing = await AlertModel.findById(row.alertId)
        .select('_id enabled isArmed userId')
        .lean();
      if (!existing || !existing.enabled) {
        skipped += 1;
        continue;
      }

      // User became inactive mid-way: re-check sign-in window
      const cutoff = new Date(Date.now() - ACTIVE_SIGN_IN_WINDOW_MS);
      const profile = await UserProfile.findOne({ userId: row.userId })
        .select('lastSignedInAt alertEmail alertInApp')
        .lean();
      if (!profile?.lastSignedInAt || profile.lastSignedInAt < cutoff) {
        skipped += 1;
        continue;
      }

      const alertEmail = profile.alertEmail !== false;
      const alertInApp = profile.alertInApp !== false;
      if (!alertEmail && !alertInApp) {
        skipped += 1;
        continue;
      }

      const armed = existing.isArmed !== false;
      const triggered = isTriggered(row.alertType, price, row.threshold);

      if (!armed) {
        if (isOnNonTriggeredSide(row.alertType, price, row.threshold)) {
          await AlertModel.updateOne({ _id: row.alertId }, { $set: { isArmed: true } });
          rearmed += 1;
        }
        continue;
      }

      if (!triggered) continue;

      const triggeredAt = new Date();
      const dedupeKey = `price:${row.alertId}:${triggeredAt.toISOString()}`;
      const currentPrice = formatPrice(price);
      const targetPrice = formatPrice(row.threshold);
      const timestamp = formatTimestamp(triggeredAt);
      const notifType = row.alertType === 'upper' ? 'price_upper' : 'price_lower';
      const title =
        row.alertType === 'upper'
          ? `${row.symbol} hit upper target`
          : `${row.symbol} hit lower target`;
      const body =
        row.alertType === 'upper'
          ? `${row.company} is at ${currentPrice}, at or above your alert of ${targetPrice}.`
          : `${row.company} is at ${currentPrice}, at or below your alert of ${targetPrice}.`;

      // Disarm + stamp before delivery so retries stay idempotent with dedupeKey
      await AlertModel.updateOne(
        { _id: row.alertId, enabled: true },
        { $set: { isArmed: false, lastTriggeredAt: triggeredAt } }
      );

      if (alertInApp) {
        try {
          await createNotification({
            userId: row.userId,
            type: notifType,
            title,
            body,
            symbol: row.symbol,
            href: `/stocks/${row.symbol}`,
            dedupeKey,
          });
        } catch (err) {
          console.error('[price-alert] inbox insert failed', row.alertId, err);
        }
      }

      if (alertEmail) {
        try {
          const emailPayload = {
            email: row.email,
            symbol: row.symbol,
            company: row.company,
            currentPrice,
            targetPrice,
            timestamp,
          };
          if (row.alertType === 'upper') {
            await sendUpperPriceAlertEmail(emailPayload);
          } else {
            await sendLowerPriceAlertEmail(emailPayload);
          }
        } catch (err) {
          console.error('[price-alert] SMTP failed', row.alertId, err);
        }
      }

      fired += 1;
    } catch (err) {
      console.error('[price-alert] evaluate failed for alert', row.alertId, err);
      skipped += 1;
    }
  }

  return { fired, rearmed, skipped };
}
