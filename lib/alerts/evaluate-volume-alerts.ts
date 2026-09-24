import { connectToDatabase } from '@/database/mongoose';
import { UserProfile } from '@/database/models/user-profile.model';
import { Watchlist } from '@/database/models/watchlist.model';
import { VolumeAlertState } from '@/database/models/volume-alert-state.model';
import { getVolumeSnapshots, type VolumeSnapshot } from '@/lib/finnhub';
import { FinnhubRateLimitError } from '@/lib/finnhub/client';
import { createNotification } from '@/lib/notifications/create-notification';
import { sendVolumeAlertEmail } from '@/lib/nodemailer';
import { selectSymbolsForQuoteBatch } from '@/lib/alerts/evaluate-price-alerts';

/** Active users must have signed in within this window (spec 08 / 11). */
const ACTIVE_SIGN_IN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Shared engineering threshold — not a user setting (spec 11). */
export const VOLUME_SPIKE_MULTIPLIER = 2.0;

export type ActiveVolumeRow = {
  userId: string;
  symbol: string;
  company: string;
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

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatTimestamp(date: Date): string {
  return (
    date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC'
  );
}

/** Email template appends "M"; values are millions of shares. */
function formatVolumeMillions(shares: number): string {
  const millions = shares / 1_000_000;
  if (millions >= 10) return millions.toFixed(1);
  if (millions >= 1) return millions.toFixed(2);
  return millions.toFixed(3);
}

function formatSpikeMultiple(currentVolume: number, averageVolume: number): string {
  const multiple = currentVolume / averageVolume;
  return `${multiple.toFixed(1)}x`;
}

function isSpike(currentVolume: number, averageVolume: number): boolean {
  return currentVolume >= VOLUME_SPIKE_MULTIPLIER * averageVolume;
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
 * Active volume user = signed in within 7 days + ≥1 watchlist symbol.
 * Missing lastSignedInAt ⇒ not active. Both channel flags false ⇒ skip.
 * Users may have zero price alerts.
 */
export async function fetchActiveVolumeWatchlist(): Promise<ActiveVolumeRow[]> {
  await connectToDatabase();

  const cutoff = new Date(Date.now() - ACTIVE_SIGN_IN_WINDOW_MS);
  const profiles = await UserProfile.find({
    lastSignedInAt: { $gte: cutoff },
  })
    .select('userId lastSignedInAt alertEmail alertInApp')
    .lean();

  const eligible = profiles.filter(
    (p) => p.alertEmail !== false || p.alertInApp !== false
  );
  if (eligible.length === 0) return [];

  const userIds = eligible.map((p) => String(p.userId));
  const watchlistItems = await Watchlist.find({ userId: { $in: userIds } })
    .select('userId symbol company')
    .lean();

  if (watchlistItems.length === 0) return [];

  const usersWithSymbols = new Set(watchlistItems.map((item) => String(item.userId)));
  const authUsers = await loadAuthUsersByIds([...usersWithSymbols]);

  const profileByUser = new Map(
    eligible.map((p) => [
      String(p.userId),
      {
        lastSignedInAt: p.lastSignedInAt as Date,
        alertEmail: p.alertEmail !== false,
        alertInApp: p.alertInApp !== false,
      },
    ])
  );

  const rows: ActiveVolumeRow[] = [];
  for (const item of watchlistItems) {
    const userId = String(item.userId);
    const prefs = profileByUser.get(userId);
    const authUser = authUsers.get(userId);
    if (!prefs || !authUser) continue;

    rows.push({
      userId,
      symbol: String(item.symbol).toUpperCase(),
      company: String(item.company || item.symbol),
      lastSignedInAt: prefs.lastSignedInAt,
      alertEmail: prefs.alertEmail,
      alertInApp: prefs.alertInApp,
      email: authUser.email,
      name: authUser.name,
    });
  }

  return rows;
}

export function selectSymbolsForVolumeBatch(rows: ActiveVolumeRow[]): string[] {
  return selectSymbolsForQuoteBatch(rows, '[volume-alert]');
}

export async function fetchVolumeSnapshotsForAlerts(
  symbols: string[]
): Promise<{ snapshots: Record<string, VolumeSnapshot>; skipped: boolean }> {
  if (symbols.length === 0) {
    return { snapshots: {}, skipped: false };
  }

  try {
    return await getVolumeSnapshots(symbols);
  } catch (error) {
    if (error instanceof FinnhubRateLimitError) {
      console.warn('[volume-alert] Finnhub rate limit exhausted; skipping volume');
      return { snapshots: {}, skipped: true };
    }
    throw error;
  }
}

export async function evaluateAndDeliverVolumeAlerts(
  rows: ActiveVolumeRow[],
  snapshots: Record<string, VolumeSnapshot>,
  quotes: Record<string, QuoteData>
): Promise<{ fired: number; rearmed: number; skipped: number }> {
  let fired = 0;
  let rearmed = 0;
  let skipped = 0;

  await connectToDatabase();

  for (const row of rows) {
    try {
      const snapshot = snapshots[row.symbol];
      if (
        !snapshot ||
        !Number.isFinite(snapshot.currentVolume) ||
        !Number.isFinite(snapshot.averageVolume10d) ||
        snapshot.currentVolume <= 0 ||
        snapshot.averageVolume10d <= 0
      ) {
        skipped += 1;
        continue;
      }

      const stillWatched = await Watchlist.findOne({
        userId: row.userId,
        symbol: row.symbol,
      })
        .select('_id')
        .lean();
      if (!stillWatched) {
        skipped += 1;
        continue;
      }

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

      const state = await VolumeAlertState.findOne({
        userId: row.userId,
        symbol: row.symbol,
      })
        .select('isArmed lastTriggeredAt')
        .lean();

      const armed = state ? state.isArmed !== false : true;
      const lastTriggeredAt = state?.lastTriggeredAt
        ? new Date(state.lastTriggeredAt)
        : null;
      const spiked = isSpike(snapshot.currentVolume, snapshot.averageVolume10d);

      if (!spiked) {
        if (!armed) {
          await VolumeAlertState.updateOne(
            { userId: row.userId, symbol: row.symbol },
            { $set: { isArmed: true } },
            { upsert: true }
          );
          rearmed += 1;
        }
        continue;
      }

      const triggeredAt = new Date();
      const dayKey = utcDateKey(triggeredAt);
      const sentToday =
        lastTriggeredAt != null && utcDateKey(lastTriggeredAt) === dayKey;
      if (sentToday) {
        if (armed) {
          await VolumeAlertState.updateOne(
            { userId: row.userId, symbol: row.symbol },
            { $set: { isArmed: false } },
            { upsert: true }
          );
        }
        continue;
      }

      const volumeSpike = formatSpikeMultiple(
        snapshot.currentVolume,
        snapshot.averageVolume10d
      );
      const currentVolume = formatVolumeMillions(snapshot.currentVolume);
      const averageVolume = formatVolumeMillions(snapshot.averageVolume10d);
      const quote = quotes[row.symbol];
      const price = quote?.c;
      const changePercentRaw = quote?.dp;
      const currentPrice =
        price != null && Number.isFinite(price) && price > 0
          ? formatPrice(price)
          : 'N/A';
      const changePercent =
        changePercentRaw != null && Number.isFinite(changePercentRaw)
          ? Math.abs(changePercentRaw).toFixed(2)
          : '0.00';
      const changePositive =
        changePercentRaw == null || !Number.isFinite(changePercentRaw)
          ? true
          : changePercentRaw >= 0;
      const timestamp = formatTimestamp(triggeredAt);
      const alertMessage = `${row.symbol} volume is ${volumeSpike} its 10-day average.`;
      const dedupeKey = `volume:${row.userId}:${row.symbol}:${dayKey}`;

      await VolumeAlertState.updateOne(
        { userId: row.userId, symbol: row.symbol },
        { $set: { isArmed: false, lastTriggeredAt: triggeredAt } },
        { upsert: true }
      );

      if (alertInApp) {
        try {
          await createNotification({
            userId: row.userId,
            type: 'volume_spike',
            title: `${row.symbol} volume spike`,
            body: `${row.company} volume is ${volumeSpike} its 10-day average.`,
            symbol: row.symbol,
            href: `/stocks/${row.symbol}`,
            dedupeKey,
          });
        } catch (err) {
          console.error('[volume-alert] inbox insert failed', row.userId, row.symbol, err);
        }
      }

      if (alertEmail) {
        try {
          await sendVolumeAlertEmail({
            email: row.email,
            symbol: row.symbol,
            company: row.company,
            currentVolume,
            averageVolume,
            volumeSpike,
            currentPrice,
            changePercent,
            changeDirection: changePositive ? '+' : '-',
            priceColor: changePositive ? '#10b981' : '#ef4444',
            alertMessage,
            timestamp,
          });
        } catch (err) {
          console.error('[volume-alert] SMTP failed', row.userId, row.symbol, err);
        }
      }

      fired += 1;
    } catch (err) {
      console.error('[volume-alert] evaluate failed', row.userId, row.symbol, err);
      skipped += 1;
    }
  }

  return { fired, rearmed, skipped };
}
