/**
 * Email Digest Service
 * Handles scheduled email digests with portfolio performance and recommendations
 */

import { invokeLLM } from '../_core/llm';

export interface DigestFrequency {
  type: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time?: string; // HH:mm format
}

export interface PortfolioMetrics {
  totalValue: number;
  totalGain: number;
  gainPercent: number;
  dayChange: number;
  weekChange: number;
  monthChange: number;
  volatility: number;
  sharpeRatio: number;
}

export interface TopTrade {
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  gain: number;
  gainPercent: number;
  quantity: number;
}

export interface DigestContent {
  userId: string;
  period: string;
  metrics: PortfolioMetrics;
  topPerformers: TopTrade[];
  worstPerformers: TopTrade[];
  triggeredAlerts: number;
  recommendations: string[];
  summary: string;
  generatedAt: Date;
}

export class EmailDigestService {
  /**
   * Generate portfolio performance summary
   */
  static async generatePerformanceSummary(metrics: PortfolioMetrics): Promise<string> {
    try {
      const prompt = `
        Analyze this portfolio performance and provide a brief, professional summary:
        
        Portfolio Metrics:
        - Total Value: $${metrics.totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        - Total Gain: $${metrics.totalGain.toLocaleString('en-US', { maximumFractionDigits: 2 })} (${metrics.gainPercent.toFixed(2)}%)
        - Day Change: ${metrics.dayChange.toFixed(2)}%
        - Week Change: ${metrics.weekChange.toFixed(2)}%
        - Month Change: ${metrics.monthChange.toFixed(2)}%
        - Volatility: ${metrics.volatility.toFixed(2)}%
        - Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}
        
        Provide a 2-3 sentence professional summary highlighting key performance indicators and trends.
      `;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial analyst. Provide concise, actionable insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      return typeof content === 'string' ? content : 'Portfolio analysis complete.';
    } catch (error) {
      console.error('Failed to generate performance summary:', error);
      return 'Portfolio performance analysis available in your account.';
    }
  }

  /**
   * Generate trading insights
   */
  static async generateTradingInsights(
    topPerformers: TopTrade[],
    worstPerformers: TopTrade[]
  ): Promise<string> {
    try {
      const topSymbols = topPerformers.map((t) => `${t.symbol} (+${t.gainPercent.toFixed(1)}%)`).join(', ');
      const worstSymbols = worstPerformers.map((t) => `${t.symbol} (${t.gainPercent.toFixed(1)}%)`).join(', ');

      const prompt = `
        Analyze these trading results and provide insights:
        
        Top Performers: ${topSymbols}
        Worst Performers: ${worstSymbols}
        
        Provide 2-3 sentences of professional trading insights based on these results.
      `;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'You are an expert cryptocurrency trader. Provide actionable trading insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      return typeof content === 'string' ? content : 'Trading analysis available in your account.';
    } catch (error) {
      console.error('Failed to generate trading insights:', error);
      return 'Trading analysis available in your account.';
    }
  }

  /**
   * Generate personalized recommendations
   */
  static async generateRecommendations(
    metrics: PortfolioMetrics,
    topPerformers: TopTrade[],
    worstPerformers: TopTrade[]
  ): Promise<string[]> {
    try {
      const recommendations: string[] = [];

      // Rule 1: High volatility warning
      if (metrics.volatility > 30) {
        recommendations.push(
          `Your portfolio volatility is ${metrics.volatility.toFixed(1)}%. Consider rebalancing to reduce risk.`
        );
      }

      // Rule 2: Negative month performance
      if (metrics.monthChange < -10) {
        recommendations.push(
          `Portfolio down ${Math.abs(metrics.monthChange).toFixed(1)}% this month. Review your worst performers and consider rebalancing.`
        );
      }

      // Rule 3: Strong performers
      if (topPerformers.length > 0 && topPerformers[0].gainPercent > 50) {
        recommendations.push(
          `Your top performer ${topPerformers[0].symbol} is up ${topPerformers[0].gainPercent.toFixed(1)}%. Consider taking profits to lock in gains.`
        );
      }

      // Rule 4: Diversification
      if (topPerformers.length > 0 && topPerformers[0].gainPercent > metrics.gainPercent * 2) {
        recommendations.push(
          `Consider diversifying - your top performer is significantly outperforming the portfolio average.`
        );
      }

      // Rule 5: Recovery opportunity
      if (worstPerformers.length > 0 && worstPerformers[0].gainPercent < -20) {
        recommendations.push(
          `${worstPerformers[0].symbol} is down ${Math.abs(worstPerformers[0].gainPercent).toFixed(1)}%. Evaluate if this is a buying opportunity or if you should exit.`
        );
      }

      return recommendations.length > 0
        ? recommendations
        : ['Continue monitoring your portfolio. Your allocation appears well-balanced.'];
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return ['Review your portfolio allocation and consider rebalancing if needed.'];
    }
  }

  /**
   * Generate HTML email template for digest
   */
  static generateDigestHTML(digest: DigestContent): string {
    const topPerformersHTML = digest.topPerformers
      .slice(0, 5)
      .map(
        (trade) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${trade.symbol}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">$${trade.currentPrice.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; color: #10b981;">+${trade.gainPercent.toFixed(2)}%</td>
        </tr>
      `
      )
      .join('');

    const worstPerformersHTML = digest.worstPerformers
      .slice(0, 5)
      .map(
        (trade) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${trade.symbol}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">$${trade.currentPrice.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; color: #ef4444;">${trade.gainPercent.toFixed(2)}%</td>
        </tr>
      `
      )
      .join('');

    const recommendationsHTML = digest.recommendations
      .map((rec) => `<li style="margin-bottom: 8px; line-height: 1.6;">${rec}</li>`)
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portfolio Digest</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Portfolio Digest</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Period: ${digest.period}</p>
          </div>

          <!-- Performance Summary -->
          <div style="padding: 30px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Performance Summary</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px;">
                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Portfolio Value</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #1f2937;">$${digest.metrics.totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              </div>
              <div style="background-color: ${digest.metrics.gainPercent >= 0 ? '#dcfce7' : '#fee2e2'}; padding: 15px; border-radius: 6px;">
                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Total Gain</p>
                <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: ${digest.metrics.gainPercent >= 0 ? '#16a34a' : '#dc2626'};">${digest.metrics.gainPercent >= 0 ? '+' : ''}${digest.metrics.gainPercent.toFixed(2)}%</p>
              </div>
            </div>
            <p style="margin: 0; line-height: 1.6; color: #4b5563; font-size: 14px;">${digest.summary}</p>
          </div>

          <!-- Top Performers -->
          <div style="padding: 30px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Top Performers</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Asset</th>
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Price</th>
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Return</th>
                </tr>
              </thead>
              <tbody>
                ${topPerformersHTML}
              </tbody>
            </table>
          </div>

          <!-- Worst Performers -->
          <div style="padding: 30px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Worst Performers</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Asset</th>
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Price</th>
                  <th style="padding: 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Return</th>
                </tr>
              </thead>
              <tbody>
                ${worstPerformersHTML}
              </tbody>
            </table>
          </div>

          <!-- Recommendations -->
          <div style="padding: 30px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Recommendations</h2>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
              ${recommendationsHTML}
            </ul>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              This is an automated digest from CAN SLIM Crypto Scanner. 
              <a href="https://canslim.manus.space/settings/notifications" style="color: #667eea; text-decoration: none;">Manage preferences</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #9ca3af;">
              Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Calculate digest schedule
   */
  static calculateNextDigestTime(frequency: DigestFrequency): Date {
    const now = new Date();
    const nextDigest = new Date(now);

    const [hours, minutes] = (frequency.time || '08:00').split(':').map(Number);
    nextDigest.setHours(hours, minutes, 0, 0);

    if (frequency.type === 'daily') {
      if (nextDigest <= now) {
        nextDigest.setDate(nextDigest.getDate() + 1);
      }
    } else if (frequency.type === 'weekly') {
      const dayOfWeek = frequency.dayOfWeek || 0;
      const currentDay = nextDigest.getDay();
      let daysUntilTarget = dayOfWeek - currentDay;

      if (daysUntilTarget <= 0 && (daysUntilTarget !== 0 || nextDigest <= now)) {
        daysUntilTarget += 7;
      }

      nextDigest.setDate(nextDigest.getDate() + daysUntilTarget);
    } else if (frequency.type === 'monthly') {
      const dayOfMonth = frequency.dayOfMonth || 1;
      nextDigest.setDate(dayOfMonth);

      if (nextDigest <= now) {
        nextDigest.setMonth(nextDigest.getMonth() + 1);
        nextDigest.setDate(dayOfMonth);
      }
    }

    return nextDigest;
  }

  /**
   * Validate digest frequency
   */
  static validateFrequency(frequency: DigestFrequency): boolean {
    if (!['daily', 'weekly', 'monthly'].includes(frequency.type)) {
      return false;
    }

    if (frequency.type === 'weekly' && (frequency.dayOfWeek === undefined || frequency.dayOfWeek < 0 || frequency.dayOfWeek > 6)) {
      return false;
    }

    if (frequency.type === 'monthly' && (frequency.dayOfMonth === undefined || frequency.dayOfMonth < 1 || frequency.dayOfMonth > 31)) {
      return false;
    }

    if (frequency.time && !/^\d{2}:\d{2}$/.test(frequency.time)) {
      return false;
    }

    return true;
  }
}

export default EmailDigestService;
