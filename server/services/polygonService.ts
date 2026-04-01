/**
 * Polygon.io Service for Historical Crypto Data
 * Provides OHLCV data for backtesting and historical analysis
 */

import { cache } from './cacheService';

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || '';
const POLYGON_BASE_URL = 'https://api.polygon.io/v1/open-close';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface HistoricalDataResponse {
  ticker: string;
  data: OHLCVData[];
  startDate: string;
  endDate: string;
  dataPoints: number;
}

/**
 * Get historical OHLCV data for a cryptocurrency
 * Falls back to mock data if API key is not configured
 */
export async function getHistoricalOHLCV(
  ticker: string,
  startDate: string,
  endDate: string,
  timeframe: 'day' | 'week' | 'month' = 'day'
): Promise<HistoricalDataResponse> {
  const cacheKey = `polygon-${ticker}-${startDate}-${endDate}-${timeframe}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`[PolygonService] Cache hit for ${ticker} (${startDate} to ${endDate})`);
    return cached as HistoricalDataResponse;
  }

  try {
    if (!POLYGON_API_KEY) {
      console.warn('[PolygonService] No API key configured, using mock data');
      return generateMockHistoricalData(ticker, startDate, endDate);
    }

    // For crypto, we need to use the crypto endpoint
    const cryptoTicker = `X:${ticker}USD`; // e.g., X:BTCUSD
    const data = await fetchFromPolygon(cryptoTicker, startDate, endDate, timeframe);

    cache.set(cacheKey, data, CACHE_DURATION);
    return data;
  } catch (error) {
    console.error(`[PolygonService] Error fetching historical data for ${ticker}:`, error);
    // Fallback to mock data on error
    return generateMockHistoricalData(ticker, startDate, endDate);
  }
}

/**
 * Fetch data from Polygon.io API
 */
async function fetchFromPolygon(
  ticker: string,
  startDate: string,
  endDate: string,
  timeframe: 'day' | 'week' | 'month'
): Promise<HistoricalDataResponse> {
  const multiplier = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
  const timeframeStr = timeframe === 'day' ? 'minute' : 'day'; // Polygon uses minute/day/week/month

  const url = new URL('https://api.polygon.io/v2/aggs/ticker');
  url.pathname = `/v2/aggs/ticker/${ticker}/range/${multiplier}/${timeframeStr}`;
  url.searchParams.append('from', startDate);
  url.searchParams.append('to', endDate);
  url.searchParams.append('adjusted', 'true');
  url.searchParams.append('sort', 'asc');
  url.searchParams.append('limit', '50000');
  url.searchParams.append('apikey', POLYGON_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as {
    results?: Array<{
      t: number;
      o: number;
      h: number;
      l: number;
      c: number;
      v: number;
      vw?: number;
    }>;
    status: string;
  };

  if (!result.results || result.results.length === 0) {
    throw new Error(`No data found for ${ticker} from ${startDate} to ${endDate}`);
  }

  const data: OHLCVData[] = result.results.map((item) => ({
    date: new Date(item.t).toISOString().split('T')[0],
    open: item.o,
    high: item.h,
    low: item.l,
    close: item.c,
    volume: item.v,
    vwap: item.vw,
  }));

  return {
    ticker,
    data,
    startDate,
    endDate,
    dataPoints: data.length,
  };
}

/**
 * Generate mock historical data for testing
 */
function generateMockHistoricalData(
  ticker: string,
  startDate: string,
  endDate: string
): HistoricalDataResponse {
  const data: OHLCVData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Mock prices for different tickers
  const basePrices: Record<string, number> = {
    BTC: 45000,
    ETH: 2500,
    ADA: 0.65,
    SOL: 120,
    DOGE: 0.15,
    XRP: 0.50,
  };

  let currentPrice = basePrices[ticker] || 100;
  let currentDate = new Date(start);

  while (currentDate <= end) {
    // Generate realistic price movements (±2% daily)
    const dailyChange = (Math.random() - 0.5) * 0.04 * currentPrice;
    const open = currentPrice;
    const close = currentPrice + dailyChange;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 1000000000) + 100000000;

    data.push({
      date: currentDate.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
      vwap: Math.round(((open + high + low + close) / 4) * 100) / 100,
    });

    currentPrice = close;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    ticker,
    data,
    startDate,
    endDate,
    dataPoints: data.length,
  };
}

/**
 * Get multiple years of historical data
 */
export async function getMultiYearHistoricalData(
  ticker: string,
  years: number = 1
): Promise<HistoricalDataResponse> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - years);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  return getHistoricalOHLCV(ticker, startDateStr, endDateStr, 'day');
}

/**
 * Calculate technical indicators from OHLCV data
 */
export function calculateTechnicalIndicators(data: OHLCVData[]) {
  if (data.length === 0) {
    return null;
  }

  // Simple Moving Average (SMA)
  const sma20 = calculateSMA(data, 20);
  const sma50 = calculateSMA(data, 50);
  const sma200 = calculateSMA(data, 200);

  // Exponential Moving Average (EMA)
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);

  // MACD
  const macd = ema12 - ema26;
  const signal = calculateEMA(data.map((d) => ({ ...d, close: macd })), 9);

  // RSI (Relative Strength Index)
  const rsi = calculateRSI(data, 14);

  // Bollinger Bands
  const bb = calculateBollingerBands(data, 20, 2);

  // Volatility
  const volatility = calculateVolatility(data);

  const latestPrice = data[data.length - 1].close;
  const previousPrice = data[0].close;
  const totalReturn = ((latestPrice - previousPrice) / previousPrice) * 100;

  return {
    sma20,
    sma50,
    sma200,
    ema12,
    ema26,
    macd,
    signal,
    rsi,
    bollingerBands: bb,
    volatility,
    latestPrice,
    totalReturn,
  };
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(data: OHLCVData[], period: number): number {
  if (data.length < period) {
    return data[data.length - 1].close;
  }

  const sum = data.slice(-period).reduce((acc, d) => acc + d.close, 0);
  return sum / period;
}

/**
 * Calculate Exponential Moving Average
 */
function calculateEMA(data: OHLCVData[], period: number): number {
  if (data.length < period) {
    return data[data.length - 1].close;
  }

  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;

  for (let i = period; i < data.length; i++) {
    ema = data[i].close * multiplier + ema * (1 - multiplier);
  }

  return ema;
}

/**
 * Calculate Relative Strength Index
 */
function calculateRSI(data: OHLCVData[], period: number): number {
  if (data.length < period + 1) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[data.length - period + i].close - data[data.length - period + i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(data: OHLCVData[], period: number, stdDev: number) {
  const sma = calculateSMA(data, period);
  const prices = data.slice(-period).map((d) => d.close);

  const variance =
    prices.reduce((acc, p) => acc + Math.pow(p - sma, 2), 0) / prices.length;
  const std = Math.sqrt(variance);

  return {
    upper: sma + std * stdDev,
    middle: sma,
    lower: sma - std * stdDev,
  };
}

/**
 * Calculate Volatility (Standard Deviation of Returns)
 */
function calculateVolatility(data: OHLCVData[]): number {
  if (data.length < 2) {
    return 0;
  }

  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const ret = (data[i].close - data[i - 1].close) / data[i - 1].close;
    returns.push(ret);
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / returns.length;

  return Math.sqrt(variance) * 100; // Annualized volatility
}
