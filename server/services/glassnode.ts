/**
 * Glassnode API Service
 * Provides on-chain metrics for CAN SLIM analysis
 */

interface _GlassnodeMetric {
  ticker: string;
  metric: string;
  value: number;
  timestamp: number;
}

interface CachedMetric {
  value: number;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache for metrics (5 minute TTL)
const metricsCache = new Map<string, CachedMetric>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cache key for a metric
 */
function getCacheKey(ticker: string, metric: string): string {
  return `${ticker}:${metric}`;
}

/**
 * Check if cached metric is still valid
 */
function isCacheValid(cached: CachedMetric): boolean {
  return Date.now() < cached.expiresAt;
}

/**
 * Fetch metric from Glassnode API
 * In production, this would call the actual Glassnode API
 * For now, returns mock data with realistic values
 */
async function fetchMetricFromAPI(ticker: string, metric: string): Promise<number> {
  // Mock data for demonstration
  // In production, replace with actual API call
  const mockData: Record<string, Record<string, number>> = {
    BTC: {
      ACTIVEADDRESSES: 28500000,
      NEWADDRESSES: 450000,
      TXS: 380000,
      TOTALVOLUME: 850000,
      MARKETCAP: 1200000,
      DIFFICULTY: 85000000000000,
      HASHRATE: 650000000000000000,
      SUPPLY: 21000000,
    },
    ETH: {
      ACTIVEADDRESSES: 45000000,
      NEWADDRESSES: 650000,
      TXS: 1200000,
      TOTALVOLUME: 2500000,
      MARKETCAP: 250000,
      SUPPLY: 120000000,
      STAKED: 32000000,
      VALIDATORS: 1000000,
    },
    SOL: {
      ACTIVEADDRESSES: 8000000,
      NEWADDRESSES: 120000,
      TXS: 450000,
      TOTALVOLUME: 500000,
      MARKETCAP: 75000,
      SUPPLY: 550000000,
      VALIDATORS: 3500,
    },
  };

  // Return mock value or 0 if not found
  return mockData[ticker]?.[metric] ?? 0;
}

/**
 * Get metric value with caching
 */
export async function getMetric(ticker: string, metric: string): Promise<number> {
  const cacheKey = getCacheKey(ticker, metric);
  const cached = metricsCache.get(cacheKey);

  // Return cached value if valid
  if (cached && isCacheValid(cached)) {
    return cached.value;
  }

  // Fetch from API
  const value = await fetchMetricFromAPI(ticker, metric);

  // Cache the result
  metricsCache.set(cacheKey, {
    value,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL,
  });

  return value;
}

/**
 * Get multiple metrics at once
 */
export async function getMetrics(
  ticker: string,
  metrics: string[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  for (const metric of metrics) {
    results[metric] = await getMetric(ticker, metric);
  }

  return results;
}

/**
 * Get active addresses metric
 */
export async function getActiveAddresses(ticker: string): Promise<number> {
  return getMetric(ticker, "ACTIVEADDRESSES");
}

/**
 * Get new addresses metric
 */
export async function getNewAddresses(ticker: string): Promise<number> {
  return getMetric(ticker, "NEWADDRESSES");
}

/**
 * Get transaction count metric
 */
export async function getTransactionCount(ticker: string): Promise<number> {
  return getMetric(ticker, "TXS");
}

/**
 * Get total volume metric
 */
export async function getTotalVolume(ticker: string): Promise<number> {
  return getMetric(ticker, "TOTALVOLUME");
}

/**
 * Get market cap metric
 */
export async function getMarketCap(ticker: string): Promise<number> {
  return getMetric(ticker, "MARKETCAP");
}

/**
 * Get difficulty metric (for PoW chains)
 */
export async function getDifficulty(ticker: string): Promise<number> {
  return getMetric(ticker, "DIFFICULTY");
}

/**
 * Get hash rate metric (for PoW chains)
 */
export async function getHashRate(ticker: string): Promise<number> {
  return getMetric(ticker, "HASHRATE");
}

/**
 * Get network activity metrics
 */
export async function getNetworkActivity(ticker: string): Promise<{
  activeAddresses: number;
  newAddresses: number;
  transactionCount: number;
  totalVolume: number;
}> {
  const metrics = await getMetrics(ticker, [
    "ACTIVEADDRESSES",
    "NEWADDRESSES",
    "TXS",
    "TOTALVOLUME",
  ]);

  return {
    activeAddresses: metrics.ACTIVEADDRESSES,
    newAddresses: metrics.NEWADDRESSES,
    transactionCount: metrics.TXS,
    totalVolume: metrics.TOTALVOLUME,
  };
}

/**
 * Get market metrics
 */
export async function getMarketMetrics(ticker: string): Promise<{
  marketCap: number;
  supply: number;
  difficulty: number;
  hashRate: number;
}> {
  const metrics = await getMetrics(ticker, [
    "MARKETCAP",
    "SUPPLY",
    "DIFFICULTY",
    "HASHRATE",
  ]);

  return {
    marketCap: metrics.MARKETCAP,
    supply: metrics.SUPPLY,
    difficulty: metrics.DIFFICULTY,
    hashRate: metrics.HASHRATE,
  };
}

/**
 * Get staking metrics (for PoS chains)
 */
export async function getStakingMetrics(ticker: string): Promise<{
  staked: number;
  validators: number;
}> {
  const staked = await getMetric(ticker, "STAKED");
  const validators = await getMetric(ticker, "VALIDATORS");

  return { staked, validators };
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  metricsCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  size: number;
  items: string[];
} {
  return {
    size: metricsCache.size,
    items: Array.from(metricsCache.keys()),
  };
}
