/**
 * Polygon/Massive crypto OHLCV adapter.
 *
 * Historical bars are returned only when the provider supplies a valid,
 * timestamped response. Provider failures—including rate limiting—become an
 * explicit unavailable contract; this service never generates fallback bars.
 */

const POLYGON_BASE_URL = "https://api.polygon.io/v2/aggs/ticker";
const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RATE_LIMIT_RETRIES = 1;

export type HistoricalTimeframe = "day" | "week" | "month";
export type HistoricalDataAvailability = "available" | "unavailable";
export type HistoricalDataErrorCode =
  | "provider_not_configured"
  | "rate_limited"
  | "provider_error"
  | "invalid_response"
  | "no_data"
  | "request_timeout";

export interface OHLCVData {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface HistoricalDataError {
  code: HistoricalDataErrorCode;
  message: string;
  status?: number;
  retryAfterMs?: number;
}

export interface HistoricalDataResponse {
  ticker: string;
  data: OHLCVData[];
  startDate: string;
  endDate: string;
  timeframe: HistoricalTimeframe;
  dataPoints: number;
  availability: HistoricalDataAvailability;
  source: "polygon";
  fetchedAt: number | null;
  cacheAgeMs: number | null;
  coverageStartDate: string | null;
  coverageEndDate: string | null;
  error?: HistoricalDataError;
}

export interface HistoricalOHLCVProviderHealth {
  source: "polygon";
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

interface CachedHistoricalData {
  response: HistoricalDataResponse;
  timestamp: number;
}

interface PolygonAggregateResponse {
  status?: unknown;
  error?: unknown;
  results?: unknown;
}

interface PolygonAggregateBar {
  t?: unknown;
  o?: unknown;
  h?: unknown;
  l?: unknown;
  c?: unknown;
  v?: unknown;
  vw?: unknown;
}

class ProviderRequestError extends Error {
  constructor(
    readonly code: HistoricalDataErrorCode,
    message: string,
    readonly status?: number,
    readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "ProviderRequestError";
  }
}

const cache = new Map<string, CachedHistoricalData>();
let health: Omit<HistoricalOHLCVProviderHealth, "source" | "freshnessAgeMs"> = {
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastStatus: null,
  consecutiveFailures: 0,
  rateLimitEvents: 0,
  lastRateLimitAt: null,
  lastRetryAfterMs: null,
};

function getPolygonApiKey(): string {
  return process.env.POLYGON_API_KEY?.trim() ?? "";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

function normalizeTicker(ticker: string): string {
  const normalized = ticker.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(normalized)) {
    throw new ProviderRequestError("invalid_response", "Ticker must contain 2-12 alphanumeric characters.");
  }
  return normalized;
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? null : Math.max(0, retryAt - Date.now());
}

function wait(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function toUnavailable(
  ticker: string,
  startDate: string,
  endDate: string,
  timeframe: HistoricalTimeframe,
  error: HistoricalDataError
): HistoricalDataResponse {
  return {
    ticker,
    data: [],
    startDate,
    endDate,
    timeframe,
    dataPoints: 0,
    availability: "unavailable",
    source: "polygon",
    fetchedAt: null,
    cacheAgeMs: null,
    coverageStartDate: null,
    coverageEndDate: null,
    error,
  };
}

function recordSuccess(status: number): void {
  health = {
    ...health,
    lastSuccessAt: Date.now(),
    lastStatus: status,
    consecutiveFailures: 0,
  };
}

function recordFailure(status: number | undefined, retryAfterMs?: number): void {
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

function getCachedResponse(cacheKey: string): HistoricalDataResponse | null {
  const cached = cache.get(cacheKey);
  if (!cached) return null;

  const cacheAgeMs = Math.max(0, Date.now() - cached.timestamp);
  if (cacheAgeMs >= CACHE_TTL_MS) {
    cache.delete(cacheKey);
    return null;
  }

  return {
    ...cached.response,
    fetchedAt: cached.timestamp,
    cacheAgeMs,
  };
}

async function requestPolygon(url: URL): Promise<PolygonAggregateResponse> {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    health = { ...health, lastAttemptAt: Date.now() };

    let response: Response;
    try {
      response = await fetch(url.toString(), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        recordFailure(undefined);
        throw new ProviderRequestError("request_timeout", "Polygon OHLCV request timed out.");
      }
      recordFailure(undefined);
      throw new ProviderRequestError("provider_error", "Polygon OHLCV request failed before a response was received.");
    }

    if (response.status === 429) {
      const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      recordFailure(429, retryAfterMs ?? undefined);
      if (attempt < MAX_RATE_LIMIT_RETRIES) {
        await wait(retryAfterMs ?? 1_000);
        continue;
      }
      throw new ProviderRequestError(
        "rate_limited",
        "Polygon rate limit reached; historical OHLCV is temporarily unavailable.",
        429,
        retryAfterMs ?? undefined
      );
    }

    if (!response.ok) {
      recordFailure(response.status);
      throw new ProviderRequestError(
        "provider_error",
        `Polygon OHLCV request failed with HTTP ${response.status}.`,
        response.status
      );
    }

    const payload = (await response.json()) as PolygonAggregateResponse;
    recordSuccess(response.status);
    return payload;
  }

  throw new ProviderRequestError("provider_error", "Polygon OHLCV request exhausted without a response.");
}

function validateBars(payload: PolygonAggregateResponse): OHLCVData[] {
  if (payload.status !== "OK" || !Array.isArray(payload.results)) {
    throw new ProviderRequestError("invalid_response", "Polygon returned an invalid OHLCV response.");
  }

  const bars = payload.results.flatMap((rawBar): OHLCVData[] => {
    if (!rawBar || typeof rawBar !== "object") return [];
    const bar = rawBar as PolygonAggregateBar;
    const values = [bar.t, bar.o, bar.h, bar.l, bar.c, bar.v];
    if (!values.every(isFiniteNumber)) return [];
    const timestamp = bar.t as number;
    const open = bar.o as number;
    const high = bar.h as number;
    const low = bar.l as number;
    const close = bar.c as number;
    const volume = bar.v as number;
    if (timestamp <= 0 || open <= 0 || high <= 0 || low <= 0 || close <= 0 || volume < 0) return [];
    if (high < Math.max(open, close) || low > Math.min(open, close)) return [];

    return [{
      timestamp,
      date: new Date(timestamp).toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volume,
      ...(isFiniteNumber(bar.vw) && bar.vw > 0 ? { vwap: bar.vw } : {}),
    }];
  });

  const chronologicalBars = bars.sort((left, right) => left.timestamp - right.timestamp);
  if (chronologicalBars.length === 0) {
    throw new ProviderRequestError("no_data", "Polygon returned no valid OHLCV bars for the requested interval.");
  }

  return chronologicalBars;
}

/**
 * Get historical crypto OHLCV data with provider provenance and explicit
 * unavailable states. All requested dates are interpreted as UTC dates.
 */
export async function getHistoricalOHLCV(
  tickerInput: string,
  startDate: string,
  endDate: string,
  timeframe: HistoricalTimeframe = "day"
): Promise<HistoricalDataResponse> {
  let ticker: string;
  try {
    ticker = normalizeTicker(tickerInput);
  } catch (error) {
    const providerError = error instanceof ProviderRequestError
      ? error
      : new ProviderRequestError("invalid_response", "Ticker validation failed.");
    return toUnavailable(tickerInput.trim().toUpperCase(), startDate, endDate, timeframe, {
      code: providerError.code,
      message: providerError.message,
    });
  }

  if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) {
    return toUnavailable(ticker, startDate, endDate, timeframe, {
      code: "invalid_response",
      message: "Historical OHLCV requires an ascending UTC date range in YYYY-MM-DD format.",
    });
  }

  const apiKey = getPolygonApiKey();
  if (!apiKey) {
    return toUnavailable(ticker, startDate, endDate, timeframe, {
      code: "provider_not_configured",
      message: "Polygon historical OHLCV provider is not configured.",
    });
  }

  const cacheKey = `${ticker}-${startDate}-${endDate}-${timeframe}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  const url = new URL(`${POLYGON_BASE_URL}/X:${ticker}USD/range/1/${timeframe}/${startDate}/${endDate}`);
  url.searchParams.set("adjusted", "true");
  url.searchParams.set("sort", "asc");
  url.searchParams.set("limit", "50000");
  url.searchParams.set("apiKey", apiKey);

  try {
    const payload = await requestPolygon(url);
    const data = validateBars(payload);
    const fetchedAt = Date.now();
    const response: HistoricalDataResponse = {
      ticker,
      data,
      startDate,
      endDate,
      timeframe,
      dataPoints: data.length,
      availability: "available",
      source: "polygon",
      fetchedAt,
      cacheAgeMs: 0,
      coverageStartDate: data[0].date,
      coverageEndDate: data[data.length - 1].date,
    };
    cache.set(cacheKey, { response, timestamp: fetchedAt });
    return response;
  } catch (error) {
    const providerError = error instanceof ProviderRequestError
      ? error
      : new ProviderRequestError("provider_error", "Polygon historical OHLCV failed unexpectedly.");
    if (!(error instanceof ProviderRequestError)) recordFailure(undefined);
    console.warn(`[PolygonOHLCV] ${providerError.code} for ${ticker}: ${providerError.message}`);
    return toUnavailable(ticker, startDate, endDate, timeframe, {
      code: providerError.code,
      message: providerError.message,
      ...(providerError.status ? { status: providerError.status } : {}),
      ...(providerError.retryAfterMs !== undefined ? { retryAfterMs: providerError.retryAfterMs } : {}),
    });
  }
}

export async function getMultiYearHistoricalData(
  ticker: string,
  years: number = 1
): Promise<HistoricalDataResponse> {
  const boundedYears = Math.max(1, Math.min(2, Math.trunc(years)));
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setUTCFullYear(startDate.getUTCFullYear() - boundedYears);

  return getHistoricalOHLCV(
    ticker,
    startDate.toISOString().slice(0, 10),
    endDate.toISOString().slice(0, 10),
    "day"
  );
}

export function getHistoricalOHLCVProviderHealth(): HistoricalOHLCVProviderHealth {
  return {
    source: "polygon",
    ...health,
    freshnessAgeMs: health.lastSuccessAt === null ? null : Math.max(0, Date.now() - health.lastSuccessAt),
  };
}

export function clearHistoricalOHLCVCache(): void {
  cache.clear();
}

export function resetHistoricalOHLCVProviderHealthForTesting(): void {
  health = {
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastStatus: null,
    consecutiveFailures: 0,
    rateLimitEvents: 0,
    lastRateLimitAt: null,
    lastRetryAfterMs: null,
  };
}

export function calculateTechnicalIndicators(data: OHLCVData[]) {
  if (data.length === 0) return null;

  const sma20 = calculateSMA(data, 20);
  const sma50 = calculateSMA(data, 50);
  const sma200 = calculateSMA(data, 200);
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macd = ema12 - ema26;
  const signal = calculateEMA(data.map((point) => ({ ...point, close: macd })), 9);
  const rsi = calculateRSI(data, 14);
  const bollingerBands = calculateBollingerBands(data, 20, 2);
  const volatility = calculateVolatility(data);
  const latestPrice = data[data.length - 1].close;
  const initialPrice = data[0].close;

  return {
    sma20,
    sma50,
    sma200,
    ema12,
    ema26,
    macd,
    signal,
    rsi,
    bollingerBands,
    volatility,
    latestPrice,
    totalReturn: ((latestPrice - initialPrice) / initialPrice) * 100,
  };
}

function calculateSMA(data: OHLCVData[], period: number): number {
  if (data.length < period) return data[data.length - 1].close;
  return data.slice(-period).reduce((sum, point) => sum + point.close, 0) / period;
}

function calculateEMA(data: OHLCVData[], period: number): number {
  if (data.length < period) return data[data.length - 1].close;
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((sum, point) => sum + point.close, 0) / period;
  for (let index = period; index < data.length; index += 1) {
    ema = data[index].close * multiplier + ema * (1 - multiplier);
  }
  return ema;
}

function calculateRSI(data: OHLCVData[], period: number): number {
  if (data.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = data[data.length - period + index].close - data[data.length - period + index - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  if (losses === 0) return 100;
  const relativeStrength = (gains / period) / (losses / period);
  return 100 - 100 / (1 + relativeStrength);
}

function calculateBollingerBands(data: OHLCVData[], period: number, standardDeviations: number) {
  const middle = calculateSMA(data, period);
  const prices = data.slice(-period).map((point) => point.close);
  const variance = prices.reduce((sum, price) => sum + (price - middle) ** 2, 0) / prices.length;
  const deviation = Math.sqrt(variance);
  return {
    upper: middle + deviation * standardDeviations,
    middle,
    lower: middle - deviation * standardDeviations,
  };
}

function calculateVolatility(data: OHLCVData[]): number {
  if (data.length < 2) return 0;
  const returns = data.slice(1).map((point, index) => (point.close - data[index].close) / data[index].close);
  const averageReturn = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - averageReturn) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 100;
}
