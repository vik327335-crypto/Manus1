/**
 * Read-only Coinbase Exchange public ticker adapter.
 * It never signs requests, accesses account data, or submits transactions.
 */

const COINBASE_EXCHANGE_BASE_URL = "https://api.exchange.coinbase.com";
const CACHE_TTL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RATE_LIMIT_RETRIES = 1;

export type CoinbaseQuoteAvailability = "available" | "unavailable";

export interface CoinbasePublicQuote {
  ticker: string;
  source: "coinbase_exchange";
  availability: CoinbaseQuoteAvailability;
  priceUsd: number | null;
  bidUsd: number | null;
  askUsd: number | null;
  providerTimestamp: number | null;
  fetchedAt: number | null;
  cacheAgeMs: number | null;
  error?: { code: "rate_limited" | "provider_error" | "invalid_response" | "request_timeout" | "unsupported_ticker"; message: string; status?: number; retryAfterMs?: number };
}

export interface CoinbasePublicQuoteHealth {
  source: "coinbase_exchange";
  lastAttemptAt: number | null;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastStatus: number | null;
  consecutiveFailures: number;
  rateLimitEvents: number;
  lastRateLimitAt: number | null;
  lastRetryAfterMs: number | null;
  freshnessAgeMs: number | null;
}

interface CachedQuote { quote: CoinbasePublicQuote; timestamp: number }

const cache = new Map<string, CachedQuote>();
let health: Omit<CoinbasePublicQuoteHealth, "source" | "freshnessAgeMs"> = {
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastStatus: null,
  consecutiveFailures: 0,
  rateLimitEvents: 0,
  lastRateLimitAt: null,
  lastRetryAfterMs: null,
};

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1_000);
  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? null : Math.max(0, retryAt - Date.now());
}

function wait(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function toUnavailable(ticker: string, code: NonNullable<CoinbasePublicQuote["error"]>["code"], message: string, status?: number, retryAfterMs?: number): CoinbasePublicQuote {
  return {
    ticker,
    source: "coinbase_exchange",
    availability: "unavailable",
    priceUsd: null,
    bidUsd: null,
    askUsd: null,
    providerTimestamp: null,
    fetchedAt: null,
    cacheAgeMs: null,
    error: { code, message, ...(status ? { status } : {}), ...(retryAfterMs !== undefined ? { retryAfterMs } : {}) },
  };
}

function recordFailure(status?: number, retryAfterMs?: number): void {
  const now = Date.now();
  health = {
    ...health,
    lastFailureAt: now,
    lastStatus: status ?? null,
    consecutiveFailures: health.consecutiveFailures + 1,
    rateLimitEvents: status === 429 ? health.rateLimitEvents + 1 : health.rateLimitEvents,
    lastRateLimitAt: status === 429 ? now : health.lastRateLimitAt,
    lastRetryAfterMs: status === 429 ? retryAfterMs ?? null : health.lastRetryAfterMs,
  };
}

function recordSuccess(status: number): void {
  health = { ...health, lastSuccessAt: Date.now(), lastStatus: status, consecutiveFailures: 0 };
}

export async function getCoinbasePublicQuote(tickerInput: string): Promise<CoinbasePublicQuote> {
  const ticker = tickerInput.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(ticker)) {
    return toUnavailable(ticker, "unsupported_ticker", "Ticker must contain 2-12 alphanumeric characters.");
  }

  const cached = cache.get(ticker);
  if (cached) {
    const cacheAgeMs = Math.max(0, Date.now() - cached.timestamp);
    if (cacheAgeMs < CACHE_TTL_MS) {
      return { ...cached.quote, fetchedAt: cached.timestamp, cacheAgeMs };
    }
    cache.delete(ticker);
  }

  const url = `${COINBASE_EXCHANGE_BASE_URL}/products/${encodeURIComponent(`${ticker}-USD`)}/ticker`;
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    health = { ...health, lastAttemptAt: Date.now() };
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      const code = error instanceof DOMException && error.name === "TimeoutError" ? "request_timeout" : "provider_error";
      recordFailure();
      return toUnavailable(ticker, code, code === "request_timeout" ? "Coinbase public ticker request timed out." : "Coinbase public ticker request failed before a response was received.");
    }

    if (response.status === 429) {
      const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      recordFailure(429, retryAfterMs ?? undefined);
      if (attempt < MAX_RATE_LIMIT_RETRIES) {
        await wait(retryAfterMs ?? 1_000);
        continue;
      }
      return toUnavailable(ticker, "rate_limited", "Coinbase public ticker is rate limited.", 429, retryAfterMs ?? undefined);
    }

    if (!response.ok) {
      recordFailure(response.status);
      return toUnavailable(ticker, "provider_error", `Coinbase public ticker failed with HTTP ${response.status}.`, response.status);
    }

    const payload = await response.json() as { price?: unknown; bid?: unknown; ask?: unknown; time?: unknown };
    const priceUsd = Number(payload.price);
    const bidUsd = Number(payload.bid);
    const askUsd = Number(payload.ask);
    const providerTimestamp = typeof payload.time === "string" ? Date.parse(payload.time) : Number.NaN;
    if (!isFinitePositive(priceUsd) || !isFinitePositive(bidUsd) || !isFinitePositive(askUsd) || Number.isNaN(providerTimestamp)) {
      recordFailure(response.status);
      return toUnavailable(ticker, "invalid_response", "Coinbase public ticker returned incomplete or invalid quote fields.", response.status);
    }

    recordSuccess(response.status);
    const fetchedAt = Date.now();
    const quote: CoinbasePublicQuote = {
      ticker,
      source: "coinbase_exchange",
      availability: "available",
      priceUsd,
      bidUsd,
      askUsd,
      providerTimestamp,
      fetchedAt,
      cacheAgeMs: 0,
    };
    cache.set(ticker, { quote, timestamp: fetchedAt });
    return quote;
  }

  return toUnavailable(ticker, "provider_error", "Coinbase public ticker request exhausted without a response.");
}

export function getCoinbasePublicQuoteHealth(): CoinbasePublicQuoteHealth {
  return {
    source: "coinbase_exchange",
    ...health,
    freshnessAgeMs: health.lastSuccessAt === null ? null : Math.max(0, Date.now() - health.lastSuccessAt),
  };
}

export function resetCoinbasePublicQuoteStateForTesting(): void {
  cache.clear();
  health = { lastAttemptAt: null, lastSuccessAt: null, lastFailureAt: null, lastStatus: null, consecutiveFailures: 0, rateLimitEvents: 0, lastRateLimitAt: null, lastRetryAfterMs: null };
}
