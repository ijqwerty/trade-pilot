import {inngest} from "@/lib/inngest/client";
import {
    NEWS_SUMMARY_EMAIL_PROMPT,
    PERSONALIZED_WELCOME_EMAIL_PROMPT,
    TRADINGVIEW_SYMBOL_MAPPING_PROMPT,
} from "@/lib/inngest/prompts";
import {sendNewsSummaryEmail, sendWelcomeEmail} from "@/lib/nodemailer";
import {getAllUsersForNewsEmail} from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import {
    evaluateAndDeliverPriceAlerts,
    fetchActivePriceAlerts,
    fetchQuotesForAlerts,
    selectSymbolsForQuoteBatch,
} from "@/lib/alerts/evaluate-price-alerts";
import {
    evaluateAndDeliverVolumeAlerts,
    fetchActiveVolumeWatchlist,
    fetchVolumeSnapshotsForAlerts,
    selectSymbolsForVolumeBatch,
} from "@/lib/alerts/evaluate-volume-alerts";
import { connectToDatabase } from "@/database/mongoose";
import { SymbolMap } from "@/database/models/symbol-map.model";
import { Watchlist } from "@/database/models/watchlist.model";
import {
    isPrefixedTradingViewSymbol,
    resolveTradingViewSymbol,
} from "@/lib/tradingview/mapSymbol";
import { upsertSymbolMap } from "@/lib/tradingview/get-mapped-symbol";

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created'},
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) ||'Thanks for joining TradePilot. You now have the tools to track markets and make smarter moves.'

            const { data: { email, name } } = event;

            return await sendWelcomeEmail({ email, name, intro: introText });
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    }
)

export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [ { event: 'app/send.daily.news' }, { cron: '0 12 * * *' } ],
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if(!users || users.length === 0) return { success: false, message: 'No users found for news email' };

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
                try {
                    const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                    const response = await step.ai.infer(`summarize-news-${user.email}`, {
                        model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
                        body: {
                            contents: [{ role: 'user', parts: [{ text:prompt }]}]
                        }
                    });

                    const part = response.candidates?.[0]?.content?.parts?.[0];
                    const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

                    userNewsSummaries.push({ user, newsContent });
                } catch {
                    console.error('Failed to summarize news for : ', user.email);
                    userNewsSummaries.push({ user, newsContent: null });
                }
            }

        // Step #4: (placeholder) Send the emails
        await step.run('send-news-emails', async () => {
                await Promise.all(
                    userNewsSummaries.map(async ({ user, newsContent}) => {
                        if(!newsContent) return false;

                        return await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent })
                    })
                )
            })

        return { success: true, message: 'Daily news summary emails sent successfully' }
    }
)

/**
 * Market scan — every minute (`* * * * *`).
 * Equals the 60-check/hour/user cap; do not add extra per-user loops inside a run.
 * Evaluates price alerts (spec 08) and automatic watchlist volume spikes (spec 11)
 * in one function so unique-symbol Finnhub work is shared. If the limiter is
 * exhausted after quotes, volume is skipped rather than adding more HTTP.
 */
export const checkPriceAlerts = inngest.createFunction(
    { id: 'price-alert-check' },
    { cron: '* * * * *' },
    async ({ step }) => {
        const payload = await step.run('fetch-active-scan', async () => {
            const priceRows = await fetchActivePriceAlerts();
            const volumeRows = await fetchActiveVolumeWatchlist();
            // Quotes are for price alerts; volume uses metric/candle. Overlapping
            // symbols still decorate volume emails when already cached.
            const quoteSymbols = selectSymbolsForQuoteBatch(priceRows, '[market-scan]');
            const volumeSymbols = selectSymbolsForVolumeBatch(volumeRows);
            return {
                priceRows: priceRows.map((row) => ({
                    ...row,
                    lastSignedInAt: row.lastSignedInAt.toISOString(),
                })),
                volumeRows: volumeRows.map((row) => ({
                    ...row,
                    lastSignedInAt: row.lastSignedInAt.toISOString(),
                })),
                quoteSymbols,
                volumeSymbols,
            };
        });

        const hasPrice = payload.priceRows.length > 0;
        const hasVolume = payload.volumeRows.length > 0;

        if (!hasPrice && !hasVolume) {
            return { success: true, message: 'No active users with price alerts or watchlist volume' };
        }

        let quoteResult: { quotes: Record<string, QuoteData>; skipped: boolean } = {
            quotes: {},
            skipped: false,
        };

        if (payload.quoteSymbols.length > 0) {
            quoteResult = await step.run('fetch-quotes', async () => {
                return await fetchQuotesForAlerts(payload.quoteSymbols);
            });

            if (quoteResult.skipped) {
                return { success: true, message: 'Skipped tick due to Finnhub rate limit' };
            }
        }

        let priceDelivery = { fired: 0, rearmed: 0, skipped: 0 };
        if (hasPrice) {
            priceDelivery = await step.run('deliver-price-alerts', async () => {
                return await evaluateAndDeliverPriceAlerts(
                    payload.priceRows.map((row) => ({
                        ...row,
                        lastSignedInAt: new Date(row.lastSignedInAt),
                        alertType: row.alertType === 'lower' ? 'lower' : 'upper',
                    })),
                    quoteResult.quotes ?? {}
                );
            });
        }

        if (!hasVolume) {
            return {
                success: true,
                message: 'Price alert check completed',
                ...priceDelivery,
            };
        }

        const volumeResult = await step.run('fetch-volume-snapshots', async () => {
            return await fetchVolumeSnapshotsForAlerts(payload.volumeSymbols);
        });

        if (volumeResult.skipped && Object.keys(volumeResult.snapshots).length === 0) {
            return {
                success: true,
                message: 'Price alerts completed; volume skipped due to Finnhub rate limit',
                price: priceDelivery,
                volume: { fired: 0, rearmed: 0, skipped: 0, skippedRateLimit: true },
            };
        }

        const volumeDelivery = await step.run('deliver-volume-alerts', async () => {
            return await evaluateAndDeliverVolumeAlerts(
                payload.volumeRows.map((row) => ({
                    ...row,
                    lastSignedInAt: new Date(row.lastSignedInAt),
                })),
                volumeResult.snapshots,
                quoteResult.quotes ?? {}
            );
        });

        return {
            success: true,
            message: 'Market alert check completed',
            price: priceDelivery,
            volume: volumeDelivery,
        };
    }
)

function extractJsonObject(text: string): unknown | null {
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch {
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(trimmed.slice(start, end + 1));
            } catch {
                return null;
            }
        }
        return null;
    }
}

/**
 * AI fallback for TradingView symbol mapping (spec 09).
 * Triggered only on first miss when heuristic returns raw fallback.
 * Never runs during RSC render.
 */
export const mapTradingViewSymbol = inngest.createFunction(
    { id: 'map-tradingview-symbol' },
    { event: 'app/symbol.map' },
    async ({ event, step }) => {
        const symbol = String(event.data?.symbol || '').trim().toUpperCase();
        const company = String(event.data?.company || symbol).trim();
        const exchange = String(event.data?.exchange || '').trim();
        const currency = String(event.data?.currency || '').trim();
        const country = String(event.data?.country || '').trim();

        if (!symbol) {
            return { success: false, message: 'Missing symbol' };
        }

        // Skip AI if heuristic (or prior AI) already stored a prefixed mapping
        const existing = await step.run('check-existing-map', async () => {
            await connectToDatabase();
            const doc = await SymbolMap.findOne(
                { symbol },
                { tradingViewSymbol: 1 }
            ).lean();
            return doc?.tradingViewSymbol ? String(doc.tradingViewSymbol) : null;
        });

        if (existing && isPrefixedTradingViewSymbol(existing)) {
            return {
                success: true,
                message: 'Prefixed mapping already present; skipped AI',
                tradingViewSymbol: existing,
            };
        }

        const heuristic = resolveTradingViewSymbol({ symbol, company, exchange });
        if (heuristic.source === 'heuristic' && isPrefixedTradingViewSymbol(heuristic.tradingViewSymbol)) {
            await step.run('persist-heuristic', async () => {
                await upsertSymbolMap({
                    symbol,
                    tradingViewSymbol: heuristic.tradingViewSymbol,
                    exchange: exchange || undefined,
                });
            });
            return {
                success: true,
                message: 'Heuristic mapping applied; skipped AI',
                tradingViewSymbol: heuristic.tradingViewSymbol,
            };
        }

        const prompt = TRADINGVIEW_SYMBOL_MAPPING_PROMPT
            .replace('{{symbol}}', symbol)
            .replace('{{company}}', company || symbol)
            .replace('{{exchange}}', exchange || 'unknown')
            .replace('{{currency}}', currency || 'unknown')
            .replace('{{country}}', country || 'unknown');

        const response = await step.ai.infer('map-tv-symbol', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const rawText = part && 'text' in part ? part.text : null;

        if (!rawText) {
            console.error('map-tradingview-symbol: empty AI response for', symbol);
            return { success: false, message: 'Empty AI response' };
        }

        const parsed = extractJsonObject(rawText) as {
            tradingViewSymbol?: string;
            confidence?: string;
        } | null;

        if (!parsed || typeof parsed.tradingViewSymbol !== 'string') {
            console.error('map-tradingview-symbol: invalid AI JSON for', symbol, rawText);
            return { success: false, message: 'Invalid AI JSON' };
        }

        const tvSymbol = parsed.tradingViewSymbol.trim().toUpperCase();
        const confidence = String(parsed.confidence || '').toLowerCase();

        if (!isPrefixedTradingViewSymbol(tvSymbol)) {
            console.error('map-tradingview-symbol: invalid TV shape for', symbol, tvSymbol);
            return { success: false, message: 'Invalid TradingView symbol shape' };
        }

        // Ignore low-confidence when we already have any stored value from heuristic/raw
        if (confidence === 'low') {
            return {
                success: true,
                message: 'Low-confidence AI result ignored',
                tradingViewSymbol: existing || heuristic.tradingViewSymbol,
            };
        }

        await step.run('persist-ai-mapping', async () => {
            await upsertSymbolMap({
                symbol,
                tradingViewSymbol: tvSymbol,
                exchange: exchange || undefined,
            });

            // Stamp watchlist rows that already track this symbol
            await Watchlist.updateMany(
                { symbol },
                { $set: { tradingViewSymbol: tvSymbol } }
            );
        });

        return {
            success: true,
            message: 'TradingView symbol mapped via AI',
            tradingViewSymbol: tvSymbol,
            confidence,
        };
    }
)
