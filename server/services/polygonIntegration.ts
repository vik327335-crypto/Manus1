import {
  clearHistoricalOHLCVCache,
  getHistoricalOHLCV,
  getHistoricalOHLCVProviderHealth,
} from "./polygonService";

export interface PolygonOHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type PolygonTimespan = "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";

/**
 * Compatibility adapter for legacy callers. Only daily, weekly and monthly
 * bars are supported by the verified historical crypto contract. Unsupported
 * timeframes and provider failures throw rather than fabricating bars.
 */
export async function fetchPolygonOHLCV(
  ticker: string,
  timespan: PolygonTimespan = "day",
  from: string,
  to: string
): Promise<PolygonOHLCV[]> {
  if (timespan !== "day" && timespan !== "week" && timespan !== "month") {
    throw new Error(`Verified crypto OHLCV does not support ${timespan} bars.`);
  }

  const response = await getHistoricalOHLCV(ticker, from, to, timespan);
  if (response.availability !== "available") {
    throw new Error(response.error?.message ?? "Historical OHLCV is unavailable.");
  }

  return response.data.map((bar) => ({
    timestamp: bar.timestamp,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  }));
}

export async function fetchMultiYearOHLCV(ticker: string, years: number = 1): Promise<PolygonOHLCV[]> {
  const end = new Date();
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - Math.max(1, Math.min(2, Math.trunc(years))));
  return fetchPolygonOHLCV(ticker, "day", start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
}

export function calculateIndicators(ohlcv: PolygonOHLCV[], period: number = 20) {
  if (ohlcv.length === 0) return null;
  const closes = ohlcv.map((bar) => bar.close);
  return {
    sma: calculateSMA(closes, period),
    ema: calculateEMA(closes, period),
    rsi: calculateRSI(closes, 14),
    bollingerBands: calculateBollingerBands(closes, period),
    atr: calculateATR(ohlcv, 14),
  };
}

function calculateSMA(prices: number[], period: number): number[] {
  return prices.map((_, index) => {
    if (index < period - 1) return Number.NaN;
    const window = prices.slice(index - period + 1, index + 1);
    return window.reduce((sum, value) => sum + value, 0) / period;
  });
}

function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const multiplier = 2 / (period + 1);
  return prices.reduce<number[]>((ema, price, index) => {
    if (index === 0) return [price];
    return [...ema, price * multiplier + ema[index - 1] * (1 - multiplier)];
  }, []);
}

function calculateRSI(prices: number[], period: number): number[] {
  return prices.map((_, index) => {
    if (index < period) return Number.NaN;
    const changes = prices.slice(index - period, index + 1).map((price, changeIndex, values) =>
      changeIndex === 0 ? 0 : price - values[changeIndex - 1]
    ).slice(1);
    const gains = changes.filter((change) => change > 0);
    const losses = changes.filter((change) => change < 0).map(Math.abs);
    const averageGain = gains.reduce((sum, value) => sum + value, 0) / period;
    const averageLoss = losses.reduce((sum, value) => sum + value, 0) / period;
    return averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
  });
}

function calculateBollingerBands(prices: number[], period: number) {
  const middle = calculateSMA(prices, period);
  return prices.map((_, index) => {
    if (index < period - 1) return { upper: Number.NaN, middle: Number.NaN, lower: Number.NaN };
    const window = prices.slice(index - period + 1, index + 1);
    const variance = window.reduce((sum, price) => sum + (price - middle[index]) ** 2, 0) / period;
    const deviation = Math.sqrt(variance);
    return { upper: middle[index] + 2 * deviation, middle: middle[index], lower: middle[index] - 2 * deviation };
  });
}

function calculateATR(ohlcv: PolygonOHLCV[], period: number): number[] {
  return ohlcv.map((bar, index) => {
    if (index < period) return Number.NaN;
    const trueRanges = ohlcv.slice(index - period + 1, index + 1).map((current, rangeIndex, values) => {
      const previousClose = rangeIndex === 0 ? ohlcv[index - period].close : values[rangeIndex - 1].close;
      return Math.max(current.high - current.low, Math.abs(current.high - previousClose), Math.abs(current.low - previousClose));
    });
    return trueRanges.reduce((sum, range) => sum + range, 0) / period;
  });
}

export function clearCache(): void {
  clearHistoricalOHLCVCache();
}

export function getCacheStats() {
  return getHistoricalOHLCVProviderHealth();
}
