/**
 * Polygon.io client for fetching real OHLCV data
 * Uses the backend tRPC endpoint which handles API calls securely
 */

export interface OHLCVPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PolygonAggregates {
  c: number; // close
  h: number; // high
  l: number; // low
  o: number; // open
  t: number; // timestamp
  v: number; // volume
}

/**
 * Convert Polygon.io aggregates to our OHLCV format
 */
export function convertPolygonToOHLCV(aggregates: PolygonAggregates[]): OHLCVPoint[] {
  return aggregates.map((agg) => ({
    date: new Date(agg.t).toISOString().split('T')[0],
    open: agg.o,
    high: agg.h,
    low: agg.l,
    close: agg.c,
    volume: agg.v,
  }));
}

/**
 * Calculate date range for API request
 */
export function getDateRange(years: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - years);

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

/**
 * Map ticker symbol to Polygon.io format
 */
export function formatTickerForPolygon(ticker: string): string {
  // For crypto: X:BTCUSD format
  if (['BTC', 'ETH', 'ADA', 'SOL', 'XRP', 'DOGE', 'MATIC', 'AVAX'].includes(ticker)) {
    return `X:${ticker}USD`;
  }
  return ticker;
}

/**
 * Validate OHLCV data
 */
export function validateOHLCVData(data: OHLCVPoint[]): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;

  return data.every((point) => {
    return (
      typeof point.date === 'string' &&
      typeof point.open === 'number' &&
      typeof point.high === 'number' &&
      typeof point.low === 'number' &&
      typeof point.close === 'number' &&
      typeof point.volume === 'number' &&
      point.high >= point.low &&
      point.high >= point.open &&
      point.high >= point.close &&
      point.low <= point.open &&
      point.low <= point.close &&
      point.volume >= 0
    );
  });
}

/**
 * Generate fallback data if API fails
 */
export function generateFallbackOHLCV(ticker: string, years: number): OHLCVPoint[] {
  const data: OHLCVPoint[] = [];
  const daysCount = years * 365;
  const now = new Date();

  const basePrices: Record<string, number> = {
    BTC: 42000,
    ETH: 2500,
    ADA: 0.95,
    SOL: 140,
    XRP: 2.5,
    DOGE: 0.35,
    MATIC: 1.2,
    AVAX: 85,
  };

  const basePrice = basePrices[ticker] || 100;
  let currentPrice = basePrice;

  for (let i = daysCount; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dailyChange = (Math.random() - 0.48) * 0.05;
    currentPrice *= 1 + dailyChange;

    const volatility = Math.random() * 0.03;
    const open = currentPrice;
    const close = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
    const high = Math.max(open, close) * (1 + volatility);
    const low = Math.min(open, close) * (1 - volatility);

    const baseVolume = 20000000 + Math.random() * 30000000;
    const volumeVariation = Math.sin(i / 50) * 0.5 + 1;
    const volume = baseVolume * volumeVariation;

    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return data;
}
