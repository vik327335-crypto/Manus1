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
 * Validate ticker format
 */
export function isValidTicker(ticker: string): boolean {
  const validTickers = ['BTC', 'ETH', 'ADA', 'SOL', 'XRP', 'DOGE', 'MATIC', 'AVAX', 'BNB', 'LINK', 'UNI', 'ATOM'];
  return validTickers.includes(ticker.toUpperCase());
}

/**
 * Fetch OHLCV data from Polygon.io via backend
 */
export async function fetchOHLCVData(
  ticker: string,
  years: number
): Promise<{ success: boolean; data?: OHLCVPoint[]; error?: string }> {
  void ticker;
  void years;
  return {
    success: false,
    error: "Historical OHLCV is available only through the provider-backed server contract.",
  };
}
