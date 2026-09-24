'use server';

import { connectToDatabase } from '@/database/mongoose';
import { AlertModel } from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

const MAX_ALERTS_PER_USER = 20;
const MAX_ALERT_NAME_LENGTH = 80;

export type AlertInput = {
  symbol: string;
  company: string;
  alertName: string;
  alertType: 'upper' | 'lower';
  threshold: number | string;
  enabled?: boolean;
};

async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function parseThreshold(threshold: number | string): number | null {
  const value = typeof threshold === 'number' ? threshold : Number(String(threshold).trim());
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function validateAlertInput(input: AlertInput):
  | { success: true; data: Omit<AlertInput, 'threshold' | 'symbol' | 'company' | 'alertName'> & {
      symbol: string;
      company: string;
      alertName: string;
      threshold: number;
      enabled: boolean;
    } }
  | { success: false; error: string } {
  const symbol = normalizeSymbol(input.symbol || '');
  if (!symbol) {
    return { success: false, error: 'Symbol is required' };
  }

  const alertName = (input.alertName || '').trim();
  if (!alertName) {
    return { success: false, error: 'Alert name is required' };
  }
  if (alertName.length > MAX_ALERT_NAME_LENGTH) {
    return { success: false, error: `Alert name must be ${MAX_ALERT_NAME_LENGTH} characters or fewer` };
  }

  if (input.alertType !== 'upper' && input.alertType !== 'lower') {
    return { success: false, error: 'Alert type must be upper or lower' };
  }

  const threshold = parseThreshold(input.threshold);
  if (threshold === null) {
    return { success: false, error: 'Threshold must be a positive number' };
  }

  const company = (input.company || symbol).trim() || symbol;

  return {
    success: true,
    data: {
      symbol,
      company,
      alertName,
      alertType: input.alertType,
      threshold,
      enabled: input.enabled !== false,
    },
  };
}

function mapAlert(item: {
  _id: unknown;
  symbol: string;
  company: string;
  alertName: string;
  alertType: 'upper' | 'lower';
  threshold: number;
}): Alert {
  return {
    id: String(item._id),
    symbol: String(item.symbol),
    company: String(item.company),
    alertName: String(item.alertName),
    currentPrice: 0,
    alertType: item.alertType === 'lower' ? 'lower' : 'upper',
    threshold: Number(item.threshold),
  };
}

function revalidateAlertPaths(symbol?: string) {
  revalidatePath('/watchlist');
  if (symbol) {
    revalidatePath(`/stocks/${symbol}`);
  }
}

export async function getMyAlerts(
  symbol?: string
): Promise<{ success: true; data: Alert[] } | { success: false; error: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to view alerts' };
  }

  try {
    await connectToDatabase();
    const filter: { userId: string; symbol?: string } = { userId };
    const normalized = symbol ? normalizeSymbol(symbol) : '';
    if (normalized) {
      filter.symbol = normalized;
    }

    const items = await AlertModel.find(filter).sort({ createdAt: -1 }).lean();
    return {
      success: true,
      data: items.map((item) =>
        mapAlert({
          _id: item._id,
          symbol: String(item.symbol),
          company: String(item.company),
          alertName: String(item.alertName),
          alertType: item.alertType === 'lower' ? 'lower' : 'upper',
          threshold: Number(item.threshold),
        })
      ),
    };
  } catch (err) {
    console.error('getMyAlerts error:', err);
    return { success: false, error: 'Failed to load alerts' };
  }
}

export async function createAlert(
  input: AlertInput
): Promise<{ success: true; data: Alert } | { success: false; error: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to create alerts' };
  }

  const validated = validateAlertInput(input);
  if (!validated.success) {
    return validated;
  }

  try {
    await connectToDatabase();
    const count = await AlertModel.countDocuments({ userId });
    if (count >= MAX_ALERTS_PER_USER) {
      return {
        success: false,
        error: `You can have at most ${MAX_ALERTS_PER_USER} alerts`,
      };
    }

    const created = await AlertModel.create({
      userId,
      ...validated.data,
      isArmed: true,
      lastTriggeredAt: null,
    });

    revalidateAlertPaths(validated.data.symbol);

    return {
      success: true,
      data: mapAlert({
        _id: created._id,
        symbol: created.symbol,
        company: created.company,
        alertName: created.alertName,
        alertType: created.alertType,
        threshold: created.threshold,
      }),
    };
  } catch (err) {
    console.error('createAlert error:', err);
    return { success: false, error: 'Failed to create alert' };
  }
}

export async function updateAlert(
  id: string,
  input: AlertInput
): Promise<{ success: true; data: Alert } | { success: false; error: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to update alerts' };
  }

  const alertId = id?.trim();
  if (!alertId) {
    return { success: false, error: 'Alert id is required' };
  }

  const validated = validateAlertInput(input);
  if (!validated.success) {
    return validated;
  }

  try {
    await connectToDatabase();
    const updated = await AlertModel.findOneAndUpdate(
      { _id: alertId, userId },
      {
        $set: {
          symbol: validated.data.symbol,
          company: validated.data.company,
          alertName: validated.data.alertName,
          alertType: validated.data.alertType,
          threshold: validated.data.threshold,
          enabled: validated.data.enabled,
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return { success: false, error: 'Alert not found' };
    }

    revalidateAlertPaths(String(updated.symbol));

    return {
      success: true,
      data: mapAlert({
        _id: updated._id,
        symbol: String(updated.symbol),
        company: String(updated.company),
        alertName: String(updated.alertName),
        alertType: updated.alertType === 'lower' ? 'lower' : 'upper',
        threshold: Number(updated.threshold),
      }),
    };
  } catch (err) {
    console.error('updateAlert error:', err);
    return { success: false, error: 'Failed to update alert' };
  }
}

export async function deleteAlert(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to delete alerts' };
  }

  const alertId = id?.trim();
  if (!alertId) {
    return { success: false, error: 'Alert id is required' };
  }

  try {
    await connectToDatabase();
    const existing = await AlertModel.findOne({ _id: alertId, userId }).lean();
    if (!existing) {
      return { success: false, error: 'Alert not found' };
    }

    await AlertModel.deleteOne({ _id: alertId, userId });
    revalidateAlertPaths(String(existing.symbol));

    return { success: true };
  } catch (err) {
    console.error('deleteAlert error:', err);
    return { success: false, error: 'Failed to delete alert' };
  }
}
