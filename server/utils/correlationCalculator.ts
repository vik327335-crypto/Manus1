/**
 * Correlation calculator for portfolio analysis
 * Computes Pearson correlation coefficient between asset price series
 */

export interface PriceData {
  date: Date;
  price: number;
}

export interface CorrelationResult {
  asset1: string;
  asset2: string;
  correlation: number;
  dataPoints: number;
  period: string;
}

/**
 * Calculate mean of array
 */
function calculateMean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(data: number[]): number {
  const mean = calculateMean(data);
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
}

/**
 * Calculate Pearson correlation coefficient
 * Returns value between -1 and 1
 * 1 = perfect positive correlation
 * 0 = no correlation
 * -1 = perfect negative correlation
 */
export function calculateCorrelation(
  series1: number[],
  series2: number[]
): number {
  if (series1.length !== series2.length || series1.length < 2) {
    return 0;
  }

  const mean1 = calculateMean(series1);
  const mean2 = calculateMean(series2);
  const stdDev1 = calculateStdDev(series1);
  const stdDev2 = calculateStdDev(series2);

  if (stdDev1 === 0 || stdDev2 === 0) {
    return 0; // No variation in one of the series
  }

  let covariance = 0;
  for (let i = 0; i < series1.length; i++) {
    covariance += (series1[i] - mean1) * (series2[i] - mean2);
  }
  covariance /= series1.length;

  const correlation = covariance / (stdDev1 * stdDev2);
  return Math.max(-1, Math.min(1, correlation)); // Clamp to [-1, 1]
}

/**
 * Calculate returns from price series
 * Returns = (Price_t - Price_t-1) / Price_t-1
 */
export function calculateReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(ret);
  }
  return returns;
}

/**
 * Calculate correlation matrix for multiple assets
 */
export function calculateCorrelationMatrix(
  assetPrices: Record<string, number[]>
): Record<string, Record<string, number>> {
  const assets = Object.keys(assetPrices);
  const matrix: Record<string, Record<string, number>> = {};

  for (const asset1 of assets) {
    matrix[asset1] = {};
    const returns1 = calculateReturns(assetPrices[asset1]);

    for (const asset2 of assets) {
      if (asset1 === asset2) {
        matrix[asset1][asset2] = 1.0; // Perfect correlation with itself
      } else if (!matrix[asset2] || !matrix[asset2][asset1]) {
        const returns2 = calculateReturns(assetPrices[asset2]);
        const corr = calculateCorrelation(returns1, returns2);
        matrix[asset1][asset2] = corr;
      } else {
        // Use already calculated value
        matrix[asset1][asset2] = matrix[asset2][asset1];
      }
    }
  }

  return matrix;
}

/**
 * Calculate portfolio volatility
 * σ_p = sqrt(w^T * Σ * w)
 * where w = weights, Σ = covariance matrix
 */
export function calculatePortfolioVolatility(
  weights: number[],
  returns: Record<string, number[]>
): number {
  const assets = Object.keys(returns);
  if (assets.length === 0 || weights.length !== assets.length) {
    return 0;
  }

  // Calculate covariance matrix
  const assetReturns = assets.map((asset) => calculateReturns(returns[asset]));
  const n = Math.min(...assetReturns.map((r) => r.length));

  if (n < 2) return 0;

  // Simplified portfolio volatility calculation
  let variance = 0;

  for (let i = 0; i < assets.length; i++) {
    for (let j = 0; j < assets.length; j++) {
      const returns_i = assetReturns[i];
      const returns_j = assetReturns[j];

      let covariance = 0;
      const mean_i = calculateMean(returns_i);
      const mean_j = calculateMean(returns_j);

      for (let k = 0; k < n; k++) {
        covariance += (returns_i[k] - mean_i) * (returns_j[k] - mean_j);
      }
      covariance /= n;

      variance += weights[i] * weights[j] * covariance;
    }
  }

  return Math.sqrt(Math.max(0, variance));
}

/**
 * Calculate Sharpe ratio
 * Sharpe = (Return - Risk-free rate) / Volatility
 */
export function calculateSharpeRatio(
  portfolioReturn: number,
  portfolioVolatility: number,
  riskFreeRate: number = 0.02
): number {
  if (portfolioVolatility === 0) return 0;
  return (portfolioReturn - riskFreeRate) / portfolioVolatility;
}

/**
 * Recommend optimal weights using equal-weight strategy
 * (More advanced: Markowitz optimization would be used in production)
 */
export function recommendEqualWeights(assetCount: number): number[] {
  const weight = 1 / assetCount;
  return Array(assetCount).fill(weight);
}

/**
 * Recommend weights based on inverse volatility
 * Higher weight to less volatile assets
 */
export function recommendInverseVolatilityWeights(
  volatilities: number[]
): number[] {
  const inverseVols = volatilities.map((v) => (v > 0 ? 1 / v : 0));
  const sum = inverseVols.reduce((a, b) => a + b, 0);

  if (sum === 0) {
    return recommendEqualWeights(volatilities.length);
  }

  return inverseVols.map((v) => v / sum);
}

/**
 * Validate correlation matrix
 */
export function validateCorrelationMatrix(
  matrix: Record<string, Record<string, number>>
): boolean {
  const assets = Object.keys(matrix);

  for (const asset1 of assets) {
    for (const asset2 of assets) {
      const corr = matrix[asset1]?.[asset2];
      if (corr === undefined || corr < -1 || corr > 1) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get correlation interpretation
 */
export function interpretCorrelation(correlation: number): string {
  if (correlation > 0.7) return "Strong positive";
  if (correlation > 0.3) return "Moderate positive";
  if (correlation > -0.3) return "Weak/No";
  if (correlation > -0.7) return "Moderate negative";
  return "Strong negative";
}
