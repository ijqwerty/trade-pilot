import { connectToDatabase } from '@/database/mongoose';
import { SymbolMap } from '@/database/models/symbol-map.model';
import { finnhubProfile2 } from '@/lib/finnhub';
import { inngest } from '@/lib/inngest/client';
import {
  isPrefixedTradingViewSymbol,
  resolveTradingViewSymbol,
  type TradingViewMapResult,
} from '@/lib/tradingview/mapSymbol';

export async function getCachedTradingViewSymbol(
  symbol: string
): Promise<{ tradingViewSymbol: string; exchange?: string } | null> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return null;

  try {
    await connectToDatabase();
    const doc = await SymbolMap.findOne(
      { symbol: normalized },
      { tradingViewSymbol: 1, exchange: 1 }
    ).lean();
    if (!doc?.tradingViewSymbol) return null;
    return {
      tradingViewSymbol: String(doc.tradingViewSymbol),
      exchange: doc.exchange ? String(doc.exchange) : undefined,
    };
  } catch (err) {
    console.error('getCachedTradingViewSymbol error:', err);
    return null;
  }
}

export async function upsertSymbolMap({
  symbol,
  tradingViewSymbol,
  exchange,
}: {
  symbol: string;
  tradingViewSymbol: string;
  exchange?: string;
}): Promise<void> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized || !tradingViewSymbol) return;

  try {
    await connectToDatabase();
    await SymbolMap.findOneAndUpdate(
      { symbol: normalized },
      {
        $set: {
          tradingViewSymbol,
          ...(exchange ? { exchange } : {}),
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('upsertSymbolMap error:', err);
  }
}

function hasGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Resolve a TradingView symbol for stock widgets.
 * Cache → heuristic (optional cached profile2) → persist → enqueue AI on first miss only.
 * Never awaits Gemini.
 */
export async function getTradingViewSymbolForStock({
  symbol,
  company,
  exchange,
}: {
  symbol: string;
  company?: string;
  exchange?: string;
}): Promise<string> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return '';

  const cached = await getCachedTradingViewSymbol(normalized);
  if (cached?.tradingViewSymbol) {
    return cached.tradingViewSymbol;
  }

  let resolvedExchange = exchange?.trim() || undefined;
  let resolvedCompany = company?.trim() || undefined;
  let currency: string | undefined;
  let country: string | undefined;

  // Optional profile2 for exchange/country — shared cache (spec 02), not Gemini
  if (!resolvedExchange) {
    try {
      const profile = await finnhubProfile2(normalized);
      if (profile) {
        resolvedExchange =
          (profile.exchange as string | undefined)?.trim() || resolvedExchange;
        resolvedCompany =
          resolvedCompany ||
          (profile.name as string | undefined)?.trim() ||
          undefined;
        currency = (profile.currency as string | undefined)?.trim() || undefined;
        country = (profile.country as string | undefined)?.trim() || undefined;
      }
    } catch (err) {
      console.error('getTradingViewSymbolForStock profile2 error:', err);
    }
  }

  const result: TradingViewMapResult = resolveTradingViewSymbol({
    symbol: normalized,
    company: resolvedCompany,
    exchange: resolvedExchange,
  });

  // Persist every first resolution (heuristic or raw fallback) so repeat loads skip AI enqueue
  await upsertSymbolMap({
    symbol: normalized,
    tradingViewSymbol: result.tradingViewSymbol,
    exchange: resolvedExchange,
  });

  // AI only on first miss when heuristic could not prefix — fire-and-forget
  if (result.source === 'fallback' && hasGeminiConfigured()) {
    void inngest
      .send({
        name: 'app/symbol.map',
        data: {
          symbol: normalized,
          company: resolvedCompany || normalized,
          exchange: resolvedExchange || '',
          currency: currency || '',
          country: country || '',
        },
      })
      .catch((err) => {
        console.error('enqueue app/symbol.map failed:', err);
      });
  }

  return result.tradingViewSymbol;
}

/** Lookup mapping to stamp on watchlist add (cache or heuristic; no AI wait). */
export async function resolveTradingViewSymbolForWatchlist({
  symbol,
  company,
  exchange,
}: {
  symbol: string;
  company?: string;
  exchange?: string;
}): Promise<string | undefined> {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) return undefined;

  const cached = await getCachedTradingViewSymbol(normalized);
  if (cached?.tradingViewSymbol && isPrefixedTradingViewSymbol(cached.tradingViewSymbol)) {
    return cached.tradingViewSymbol;
  }

  const result = resolveTradingViewSymbol({
    symbol: normalized,
    company,
    exchange,
  });

  if (result.source === 'heuristic') {
    await upsertSymbolMap({
      symbol: normalized,
      tradingViewSymbol: result.tradingViewSymbol,
      exchange,
    });
    return result.tradingViewSymbol;
  }

  return cached?.tradingViewSymbol;
}
