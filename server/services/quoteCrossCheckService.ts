import { getCurrentPrice } from "./coingecko";
import { getCoinbasePublicQuote } from "./coinbasePublicQuoteService";

const DIVERGENCE_THRESHOLD_BPS = 150;

export interface QuoteCrossCheckResult {
  ticker: string;
  availability: "available" | "unavailable";
  primary: { source: "coingecko"; priceUsd: number; fetchedAt: number; cacheAgeMs: number } | null;
  secondary: { source: "coinbase_exchange"; priceUsd: number; fetchedAt: number; cacheAgeMs: number; providerTimestamp: number } | null;
  divergenceBps: number | null;
  thresholdBps: number;
  verdict: "matched" | "divergent" | "unavailable";
  checkedAt: number;
  reason?: string;
}

/**
 * Cross-checks an independently supplied read-only Coinbase ticker against the
 * existing CoinGecko quote. Neither value overwrites the other.
 */
export async function crossCheckUsdQuote(ticker: string): Promise<QuoteCrossCheckResult> {
  const [primary, secondary] = await Promise.all([getCurrentPrice(ticker), getCoinbasePublicQuote(ticker)]);
  const checkedAt = Date.now();

  if (!primary || secondary.availability !== "available" || secondary.priceUsd === null || secondary.fetchedAt === null || secondary.cacheAgeMs === null || secondary.providerTimestamp === null) {
    return {
      ticker: ticker.trim().toUpperCase(),
      availability: "unavailable",
      primary: primary ? { source: "coingecko", priceUsd: primary.price, fetchedAt: primary.fetchedAt, cacheAgeMs: primary.cacheAgeMs } : null,
      secondary: null,
      divergenceBps: null,
      thresholdBps: DIVERGENCE_THRESHOLD_BPS,
      verdict: "unavailable",
      checkedAt,
      reason: primary ? secondary.error?.message ?? "Reserve quote is unavailable." : "Primary CoinGecko quote is unavailable.",
    };
  }

  const divergenceBps = Math.abs((primary.price - secondary.priceUsd) / primary.price) * 10_000;
  return {
    ticker: ticker.trim().toUpperCase(),
    availability: "available",
    primary: { source: "coingecko", priceUsd: primary.price, fetchedAt: primary.fetchedAt, cacheAgeMs: primary.cacheAgeMs },
    secondary: { source: "coinbase_exchange", priceUsd: secondary.priceUsd, fetchedAt: secondary.fetchedAt, cacheAgeMs: secondary.cacheAgeMs, providerTimestamp: secondary.providerTimestamp },
    divergenceBps,
    thresholdBps: DIVERGENCE_THRESHOLD_BPS,
    verdict: divergenceBps > DIVERGENCE_THRESHOLD_BPS ? "divergent" : "matched",
    checkedAt,
  };
}
