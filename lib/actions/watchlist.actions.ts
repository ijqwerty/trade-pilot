'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { resolveTradingViewSymbolForWatchlist } from '@/lib/tradingview/get-mapped-symbol';

async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function mapWatchlistItem(
  item: {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
    tradingViewSymbol?: string;
  }
): StockWithData {
  return {
    userId: item.userId,
    symbol: String(item.symbol),
    company: item.company,
    addedAt: item.addedAt,
    ...(item.tradingViewSymbol
      ? { tradingViewSymbol: String(item.tradingViewSymbol) }
      : {}),
  };
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getCurrentUserWatchlistSymbols(): Promise<string[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];

  try {
    await connectToDatabase();
    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getCurrentUserWatchlistSymbols error:', err);
    return [];
  }
}

export async function getWatchlistCompanyForCurrentUser(symbol: string): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;

  try {
    await connectToDatabase();
    const item = await Watchlist.findOne({ userId, symbol: normalized }, { company: 1 }).lean();
    return item?.company ? String(item.company) : null;
  } catch (err) {
    console.error('getWatchlistCompanyForCurrentUser error:', err);
    return null;
  }
}

export async function isSymbolInWatchlist(symbol: string): Promise<boolean> {
  const userId = await getSessionUserId();
  if (!userId) return false;

  const normalized = normalizeSymbol(symbol);
  if (!normalized) return false;

  try {
    await connectToDatabase();
    const existing = await Watchlist.findOne({ userId, symbol: normalized }, { _id: 1 }).lean();
    return Boolean(existing);
  } catch (err) {
    console.error('isSymbolInWatchlist error:', err);
    return false;
  }
}

export async function getCurrentUserWatchlist(): Promise<
  { success: true; data: StockWithData[] } | { success: false; error: string }
> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to view your watchlist' };
  }

  try {
    await connectToDatabase();
    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
    return {
      success: true,
      data: items.map((item) =>
        mapWatchlistItem({
          userId: String(item.userId),
          symbol: String(item.symbol),
          company: String(item.company),
          addedAt: item.addedAt instanceof Date ? item.addedAt : new Date(item.addedAt),
          tradingViewSymbol: item.tradingViewSymbol
            ? String(item.tradingViewSymbol)
            : undefined,
        })
      ),
    };
  } catch (err) {
    console.error('getCurrentUserWatchlist error:', err);
    return { success: false, error: 'Failed to load watchlist' };
  }
}

export async function addToWatchlist({
  symbol,
  company,
}: {
  symbol: string;
  company: string;
}): Promise<
  { success: true; data: { alreadyExists: boolean } } | { success: false; error: string }
> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to update your watchlist' };
  }

  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    return { success: false, error: 'Symbol is required' };
  }

  const companyName = (company || normalized).trim() || normalized;

  try {
    await connectToDatabase();
    const tradingViewSymbol = await resolveTradingViewSymbolForWatchlist({
      symbol: normalized,
      company: companyName,
    });

    await Watchlist.create({
      userId,
      symbol: normalized,
      company: companyName,
      ...(tradingViewSymbol ? { tradingViewSymbol } : {}),
    });

    revalidatePath('/');
    revalidatePath('/watchlist');
    revalidatePath(`/stocks/${normalized}`);

    return { success: true, data: { alreadyExists: false } };
  } catch (err) {
    const isDuplicate =
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: number }).code === 11000;

    if (isDuplicate) {
      revalidatePath('/');
      revalidatePath('/watchlist');
      revalidatePath(`/stocks/${normalized}`);
      return { success: true, data: { alreadyExists: true } };
    }

    console.error('addToWatchlist error:', err);
    return { success: false, error: 'Failed to add symbol to watchlist' };
  }
}

export async function removeFromWatchlist({
  symbol,
}: {
  symbol: string;
}): Promise<{ success: true; data: { removed: boolean } } | { success: false; error: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { success: false, error: 'You must be signed in to update your watchlist' };
  }

  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    return { success: false, error: 'Symbol is required' };
  }

  try {
    await connectToDatabase();
    const result = await Watchlist.deleteOne({ userId, symbol: normalized });

    revalidatePath('/');
    revalidatePath('/watchlist');
    revalidatePath(`/stocks/${normalized}`);

    return { success: true, data: { removed: result.deletedCount > 0 } };
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    return { success: false, error: 'Failed to remove symbol from watchlist' };
  }
}
