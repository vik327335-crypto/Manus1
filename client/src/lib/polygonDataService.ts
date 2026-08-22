import { OHLCVPoint } from './polygonClient';

/**
 * Service for fetching real OHLCV data from Polygon.io via backend API
 * Handles caching, error handling, and data transformation
 */

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
const cache = new Map<string, { data: OHLCVPoint[]; timestamp: number }>();

/**
 * Get cache key for ticker and period
 */
function getCacheKey(ticker: string, years: number): string {
  return `${ticker}-${years}y`;
}

/**
 * Check if cache is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

/**
 * Fetch OHLCV data from backend API
 * The backend calls Polygon.io and returns aggregated data
 */
export async function fetchOHLCVData(
  ticker: string,
  years: number
): Promise<{ success: boolean; data?: OHLCVPoint[]; error?: string }> {
  try {
    const cacheKey = getCacheKey(ticker, years);

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      console.info(`[PolygonDataService] Using cached data for ${cacheKey}`);
      return { success: true, data: cached.data };
    }

    // Call backend endpoint to fetch from Polygon.io
    const response = await fetch('/api/trpc/historicalData.getMultiYear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          ticker: ticker.toUpperCase(),
          years,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    // Extract OHLCV data from response
    if (result.result?.data?.success && result.result.data.ohlcvData) {
      const ohlcvData: OHLCVPoint[] = result.result.data.ohlcvData;

      // Validate data
      if (!Array.isArray(ohlcvData) || ohlcvData.length === 0) {
        throw new Error('No OHLCV data returned from API');
      }

      // Cache the data
      cache.set(cacheKey, {
        data: ohlcvData,
        timestamp: Date.now(),
      });

      console.info(`[PolygonDataService] Fetched ${ohlcvData.length} data points for ${ticker}`);
      return { success: true, data: ohlcvData };
    }

    throw new Error('Invalid response format from API');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PolygonDataService] Error fetching data:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch technical indicators for ticker
 */
export async function fetchTechnicalIndicators(
  ticker: string,
  years: number
): Promise<{ success: boolean; indicators?: any; error?: string }> {
  try {
    const response = await fetch('/api/trpc/historicalData.getTechnicalIndicators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          ticker: ticker.toUpperCase(),
          years,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.result?.data?.success && result.result.data.indicators) {
      return {
        success: true,
        indicators: result.result.data.indicators,
      };
    }

    throw new Error('Invalid response format from API');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PolygonDataService] Error fetching indicators:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Clear cache for specific ticker or all
 */
export function clearCache(ticker?: string): void {
  if (ticker) {
    // Clear cache for specific ticker across all periods
    const keysToDelete: string[] = [];
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      if (key.startsWith(ticker.toUpperCase())) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => cache.delete(key));
    console.info(`[PolygonDataService] Cleared cache for ${ticker}`);
  } else {
    // Clear all cache
    cache.clear();
    console.info('[PolygonDataService] Cleared all cache');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
  totalSize: number;
} {
  const keys = Array.from(cache.keys());
  let totalSize = 0;

  const entries = Array.from(cache.entries());
  for (const [, value] of entries) {
    totalSize += value.data.length;
  }

  return {
    size: cache.size,
    keys,
    totalSize,
  };
}

/**
 * Validate ticker format
 */
export function isValidTicker(ticker: string): boolean {
  // Support crypto tickers (BTC, ETH, etc.) and stock tickers
  const tickerRegex = /^[A-Z]{1,5}$/;
  return tickerRegex.test(ticker.toUpperCase());
}

/**
 * Format ticker for display
 */
export function formatTicker(ticker: string): string {
  return ticker.toUpperCase();
}

/**
 * Get supported cryptocurrencies
 */
export const SUPPORTED_CRYPTOS = [
  'BTC', 'ETH', 'ADA', 'SOL', 'XRP', 'DOGE',
  'MATIC', 'AVAX', 'LINK', 'UNI', 'AAVE', 'SUSHI',
];

/**
 * Check if ticker is a supported crypto
 */
export function isSupportedCrypto(ticker: string): boolean {
  return SUPPORTED_CRYPTOS.includes(ticker.toUpperCase());
}
