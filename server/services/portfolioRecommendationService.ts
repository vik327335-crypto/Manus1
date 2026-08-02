/**
 * Portfolio Recommendation Service
 * Provides ML-powered recommendations for portfolio optimization
 */

import { invokeLLM } from '../_core/llm';

export interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  gain: number;
  gainPercent: number;
  marketCap: number;
  volatility: number;
  rarity?: number; // For NFTs
  floorPrice?: number; // For NFTs
  dayVolume: number;
  correlation?: number; // Correlation with portfolio
}

export interface RecommendationResult {
  assetId: string;
  symbol: string;
  action: 'SELL' | 'HOLD' | 'BUY_MORE';
  confidence: number;
  reason: string;
  targetPrice?: number;
  timeframe: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  potentialGain?: number;
}

export interface PortfolioOptimizationResult {
  currentAllocation: Record<string, number>;
  recommendedAllocation: Record<string, number>;
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  recommendations: RecommendationResult[];
  summary: string;
}

export class PortfolioRecommendationService {
  /**
   * Generate sell recommendations based on multiple factors
   */
  static async generateSellRecommendations(
    assets: PortfolioAsset[],
    portfolioValue: number
  ): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    for (const asset of assets) {
      // Calculate various metrics
      const gainPercent = asset.gainPercent;
      const volatilityScore = asset.volatility * 100;
      const volumeRatio = asset.dayVolume / portfolioValue;
      const concentration = (asset.currentPrice * asset.quantity) / portfolioValue;

      // Determine if asset should be sold
      let shouldSell = false;
      let reason = '';
      let confidence = 0;

      // Rule 1: High volatility with negative returns
      if (asset.gainPercent < -20 && asset.volatility > 0.3) {
        shouldSell = true;
        reason = `High volatility (${volatilityScore.toFixed(1)}%) with significant losses (-${Math.abs(gainPercent).toFixed(1)}%). Risk of further downside.`;
        confidence = Math.min(95, 50 + Math.abs(gainPercent) / 2);
      }

      // Rule 2: Low volume and declining trend
      if (volumeRatio < 0.001 && gainPercent < -10) {
        shouldSell = true;
        reason = `Low trading volume (${(volumeRatio * 100).toFixed(2)}% of portfolio) with declining trend. Liquidity risk.`;
        confidence = Math.min(85, 40 + Math.abs(gainPercent) / 3);
      }

      // Rule 3: Extreme concentration with high gains (take profits)
      if (concentration > 0.3 && gainPercent > 100) {
        shouldSell = true;
        reason = `Extreme concentration (${(concentration * 100).toFixed(1)}% of portfolio) with exceptional gains (${gainPercent.toFixed(1)}%). Rebalance to reduce risk.`;
        confidence = 75;
      }

      // Rule 4: Market cap too small (penny stock risk)
      if (asset.marketCap < 100000000 && gainPercent < 0) {
        shouldSell = true;
        reason = `Small market cap ($${(asset.marketCap / 1000000).toFixed(1)}M) with negative returns. Higher risk of manipulation.`;
        confidence = 70;
      }

      // Rule 5: NFT rarity too low (for NFTs)
      if (asset.rarity !== undefined && asset.rarity < 30 && asset.gainPercent < -15) {
        shouldSell = true;
        reason = `Low rarity score (${asset.rarity.toFixed(0)}) with significant losses. Limited upside potential.`;
        confidence = 65;
      }

      if (shouldSell) {
        recommendations.push({
          assetId: asset.id,
          symbol: asset.symbol,
          action: 'SELL',
          confidence: Math.round(confidence),
          reason,
          timeframe: 'IMMEDIATE',
          riskLevel: asset.volatility > 0.4 ? 'HIGH' : 'MEDIUM',
          potentialGain: gainPercent,
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate buy recommendations for undervalued assets
   */
  static async generateBuyRecommendations(
    assets: PortfolioAsset[],
    portfolioValue: number,
    marketData: any[]
  ): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    for (const asset of assets) {
      let shouldBuyMore = false;
      let reason = '';
      let confidence = 0;
      let targetPrice = asset.currentPrice;

      // Rule 1: Strong performer with low concentration
      const concentration = (asset.currentPrice * asset.quantity) / portfolioValue;
      if (asset.gainPercent > 50 && concentration < 0.1 && asset.volatility < 0.25) {
        shouldBuyMore = true;
        reason = `Strong performer (${asset.gainPercent.toFixed(1)}% gain) with low concentration (${(concentration * 100).toFixed(1)}%). Increase position.`;
        confidence = 80;
        targetPrice = asset.currentPrice * 1.2; // 20% upside target
      }

      // Rule 2: Recovered from dip with strong fundamentals
      if (asset.gainPercent > -5 && asset.gainPercent < 10 && asset.dayVolume > 0) {
        const recoveryStrength = Math.abs(asset.gainPercent);
        if (recoveryStrength > 0 && asset.volatility < 0.2) {
          shouldBuyMore = true;
          reason = `Asset recovering from dip with stable volume. Good accumulation opportunity.`;
          confidence = 70;
          targetPrice = asset.currentPrice * 1.15;
        }
      }

      // Rule 3: High correlation with portfolio winners
      if (asset.correlation !== undefined && asset.correlation > 0.7 && asset.gainPercent < 20) {
        shouldBuyMore = true;
        reason = `High correlation (${(asset.correlation * 100).toFixed(0)}%) with portfolio winners. Diversification opportunity.`;
        confidence = 65;
        targetPrice = asset.currentPrice * 1.1;
      }

      if (shouldBuyMore) {
        recommendations.push({
          assetId: asset.id,
          symbol: asset.symbol,
          action: 'BUY_MORE',
          confidence: Math.round(confidence),
          reason,
          targetPrice,
          timeframe: 'NEXT_7_DAYS',
          riskLevel: asset.volatility > 0.3 ? 'MEDIUM' : 'LOW',
          potentialGain: ((targetPrice - asset.currentPrice) / asset.currentPrice) * 100,
        });
      }
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate comprehensive portfolio optimization recommendations
   */
  static async generatePortfolioOptimization(
    assets: PortfolioAsset[],
    portfolioValue: number
  ): Promise<PortfolioOptimizationResult> {
    // Calculate current allocation
    const currentAllocation: Record<string, number> = {};
    let totalValue = 0;

    for (const asset of assets) {
      const assetValue = asset.currentPrice * asset.quantity;
      currentAllocation[asset.symbol] = assetValue / portfolioValue;
      totalValue += assetValue;
    }

    // Calculate portfolio metrics
    const avgGain = assets.reduce((sum, a) => sum + a.gainPercent, 0) / assets.length;
    const avgVolatility = assets.reduce((sum, a) => sum + a.volatility, 0) / assets.length;
    const sharpeRatio = avgGain / (avgVolatility * 100 + 0.01); // Avoid division by zero

    // Generate recommendations
    const sellRecs = await this.generateSellRecommendations(assets, portfolioValue);
    const buyRecs = await this.generateBuyRecommendations(assets, portfolioValue, []);

    const allRecommendations = [...sellRecs, ...buyRecs];

    // Calculate recommended allocation
    const recommendedAllocation: Record<string, number> = { ...currentAllocation };

    for (const rec of sellRecs) {
      const symbol = rec.symbol;
      if (recommendedAllocation[symbol]) {
        recommendedAllocation[symbol] *= 0.7; // Reduce by 30%
      }
    }

    for (const rec of buyRecs) {
      const symbol = rec.symbol;
      if (recommendedAllocation[symbol]) {
        recommendedAllocation[symbol] *= 1.2; // Increase by 20%
      }
    }

    // Normalize allocations to sum to 1
    const allocSum = Object.values(recommendedAllocation).reduce((a, b) => a + b, 0);
    for (const symbol in recommendedAllocation) {
      recommendedAllocation[symbol] /= allocSum;
    }

    // Generate summary using LLM
    const summary = await this.generateRecommendationSummary(
      assets,
      allRecommendations,
      avgGain,
      avgVolatility
    );

    return {
      currentAllocation,
      recommendedAllocation,
      expectedReturn: avgGain,
      expectedVolatility: avgVolatility * 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      recommendations: allRecommendations,
      summary,
    };
  }

  /**
   * Generate AI-powered recommendation summary
   */
  private static async generateRecommendationSummary(
    assets: PortfolioAsset[],
    recommendations: RecommendationResult[],
    expectedReturn: number,
    expectedVolatility: number
  ): Promise<string> {
    try {
      const topAssets = assets
        .sort((a, b) => b.gainPercent - a.gainPercent)
        .slice(0, 3)
        .map((a) => `${a.symbol} (${a.gainPercent.toFixed(1)}%)`)
        .join(', ');

      const sellCount = recommendations.filter((r) => r.action === 'SELL').length;
      const buyCount = recommendations.filter((r) => r.action === 'BUY_MORE').length;

      const prompt = `
        Analyze this portfolio and provide a brief, actionable recommendation summary:
        
        Portfolio Statistics:
        - Expected Return: ${expectedReturn.toFixed(2)}%
        - Volatility: ${expectedVolatility.toFixed(2)}%
        - Top Performers: ${topAssets}
        - Assets to Sell: ${sellCount}
        - Assets to Buy More: ${buyCount}
        
        Recommendations:
        ${recommendations
          .slice(0, 5)
          .map((r) => `- ${r.action}: ${r.symbol} (${r.confidence}% confidence) - ${r.reason}`)
          .join('\n')}
        
        Provide a concise 2-3 sentence summary with actionable next steps.
      `;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content:
              'You are a professional portfolio analyst. Provide concise, actionable recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const summary = typeof content === 'string' ? content : 'Unable to generate summary at this time.';
      return summary;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return 'Portfolio analysis complete. Review recommendations above for next steps.';
    }
  }

  /**
   * Calculate portfolio correlation matrix
   */
  static calculateCorrelationMatrix(assets: PortfolioAsset[]): Record<string, Record<string, number>> {
    const correlations: Record<string, Record<string, number>> = {};

    for (let i = 0; i < assets.length; i++) {
      correlations[assets[i].symbol] = {};
      for (let j = 0; j < assets.length; j++) {
        if (i === j) {
          correlations[assets[i].symbol][assets[j].symbol] = 1.0;
        } else {
          // Simplified correlation based on gain similarity
          const gainDiff = Math.abs(assets[i].gainPercent - assets[j].gainPercent);
          const correlation = Math.max(0, 1 - gainDiff / 100);
          correlations[assets[i].symbol][assets[j].symbol] = correlation;
        }
      }
    }

    return correlations;
  }

  /**
   * Detect portfolio concentration risk
   */
  static detectConcentrationRisk(
    assets: PortfolioAsset[],
    portfolioValue: number
  ): { symbol: string; concentration: number; risk: string }[] {
    const risks: { symbol: string; concentration: number; risk: string }[] = [];

    for (const asset of assets) {
      const concentration = (asset.currentPrice * asset.quantity) / portfolioValue;

      if (concentration > 0.3) {
        risks.push({
          symbol: asset.symbol,
          concentration,
          risk: `CRITICAL: ${(concentration * 100).toFixed(1)}% of portfolio`,
        });
      } else if (concentration > 0.15) {
        risks.push({
          symbol: asset.symbol,
          concentration,
          risk: `HIGH: ${(concentration * 100).toFixed(1)}% of portfolio`,
        });
      } else if (concentration > 0.08) {
        risks.push({
          symbol: asset.symbol,
          concentration,
          risk: `MEDIUM: ${(concentration * 100).toFixed(1)}% of portfolio`,
        });
      }
    }

    return risks.sort((a, b) => b.concentration - a.concentration);
  }
}

export default PortfolioRecommendationService;
