import { invokeLLM } from "../_core/llm";

interface PolygonOHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PolygonResponse {
  status: string;
  results?: Array<{
    t: number;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
  }>;
  error?: string;
}

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";
const POLYGON_BASE_URL = "https://api.polygon.io/v1";

// Cache for API responses (1 hour TTL)
const cache = new Map<
  string,
  { data: PolygonOHLCV[]; timestamp: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch OHLCV data from Polygon.io API
 */
export async function fetchPolygonOHLCV(
  ticker: string,
  timespan: "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year" = "day",
  from: string,
  to: string
): Promise<PolygonOHLCV[]> {
  const cacheKey = `${ticker}-${timespan}-${from}-${to}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Polygon] Cache hit for ${cacheKey}`);
    return cached.data;
  }

  try {
    if (!POLYGON_API_KEY) {
      console.warn("[Polygon] API key not configured, using fallback data");
      return generateFallbackOHLCV(ticker, from, to);
    }

    const url = `${POLYGON_BASE_URL}/open-close/${ticker}/${from}?adjusted=true&sort=asc&apikey=${POLYGON_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Polygon] API error: ${response.status} ${response.statusText}`);
      return generateFallbackOHLCV(ticker, from, to);
    }

    const data = (await response.json()) as PolygonResponse;

    if (data.status !== "OK" || !data.results) {
      console.error(`[Polygon] Invalid response: ${data.error || "unknown error"}`);
      return generateFallbackOHLCV(ticker, from, to);
    }

    // Convert Polygon format to our format
    const ohlcv: PolygonOHLCV[] = data.results.map((bar) => ({
      timestamp: bar.t,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));

    // Cache the results
    cache.set(cacheKey, { data: ohlcv, timestamp: Date.now() });

    console.log(`[Polygon] Fetched ${ohlcv.length} bars for ${ticker}`);
    return ohlcv;
  } catch (error) {
    console.error("[Polygon] Fetch error:", error);
    return generateFallbackOHLCV(ticker, from, to);
  }
}

/**
 * Generate fallback OHLCV data using random walk model
 */
function generateFallbackOHLCV(
  ticker: string,
  from: string,
  to: string
): PolygonOHLCV[] {
  const startDate = new Date(from);
  const endDate = new Date(to);
  const data: PolygonOHLCV[] = [];

  let price = 50000; // Starting price
  let timestamp = startDate.getTime();

  while (timestamp < endDate.getTime()) {
    // Random walk
    const change = (Math.random() - 0.5) * 1000;
    const open = price;
    const close = Math.max(100, price + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
    timestamp += 24 * 60 * 60 * 1000; // Next day
  }

  return data;
}

/**
 * Get multiple years of OHLCV data
 */
export async function fetchMultiYearOHLCV(
  ticker: string,
  years: number = 1
): Promise<PolygonOHLCV[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - years);

  const from = startDate.toISOString().split("T")[0];
  const to = endDate.toISOString().split("T")[0];

  return fetchPolygonOHLCV(ticker, "day", from, to);
}

/**
 * Calculate technical indicators from OHLCV data
 */
export function calculateIndicators(ohlcv: PolygonOHLCV[], period: number = 20) {
  const closes = ohlcv.map((bar) => bar.close);
  const highs = ohlcv.map((bar) => bar.high);
  const lows = ohlcv.map((bar) => bar.low);

  // SMA (Simple Moving Average)
  const sma = calculateSMA(closes, period);

  // EMA (Exponential Moving Average)
  const ema = calculateEMA(closes, period);

  // RSI (Relative Strength Index)
  const rsi = calculateRSI(closes, 14);

  // Bollinger Bands
  const bb = calculateBollingerBands(closes, period);

  // ATR (Average True Range)
  const atr = calculateATR(ohlcv, 14);

  return {
    sma,
    ema,
    rsi,
    bollingerBands: bb,
    atr,
  };
}

function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(0);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);

  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      ema.push(prices[0]);
    } else if (i < period) {
      const sum = prices.slice(0, i + 1).reduce((a, b) => a + b, 0);
      ema.push(sum / (i + 1));
    } else {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const changes: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }

    const rs = avgGain / avgLoss;
    const rsiValue = 100 - 100 / (1 + rs);
    rsi.push(rsiValue);
  }

  return rsi;
}

function calculateBollingerBands(prices: number[], period: number = 20) {
  const sma = calculateSMA(prices, period);
  const bands: Array<{ upper: number; middle: number; lower: number }> = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      bands.push({ upper: 0, middle: 0, lower: 0 });
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance =
        slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      bands.push({
        upper: sma[i] + 2 * stdDev,
        middle: sma[i],
        lower: sma[i] - 2 * stdDev,
      });
    }
  }

  return bands;
}

function calculateATR(ohlcv: PolygonOHLCV[], period: number = 14): number[] {
  const atr: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < ohlcv.length; i++) {
    const high = ohlcv[i].high;
    const low = ohlcv[i].low;
    const prevClose = ohlcv[i - 1].close;

    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);

    tr.push(Math.max(tr1, tr2, tr3));
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
  }

  atr.push(sum / period);

  for (let i = period; i < tr.length; i++) {
    const newATR = (atr[i - period] * (period - 1) + tr[i]) / period;
    atr.push(newATR);
  }

  return atr;
}

/**
 * Clear cache
 */
export function clearCache(): void {
  cache.clear();
  console.log("[Polygon] Cache cleared");
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}
