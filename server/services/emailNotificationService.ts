/**
 * Email Notification Service
 * Manages HTML email templates and delivery for all notification types
 */

import nodemailer from 'nodemailer';

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
}

export class EmailNotificationService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  private static readonly FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@canslim.crypto';
  private static readonly BRAND_NAME = 'CAN SLIM Crypto Scanner';
  private static readonly BRAND_COLOR = '#3b82f6';
  private static readonly SUPPORT_EMAIL = 'support@canslim.crypto';

  /**
   * Send email notification
   */
  static async sendEmail(payload: EmailNotificationPayload): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `${this.BRAND_NAME} <${this.FROM_EMAIL}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.htmlContent,
        text: payload.textContent,
        replyTo: payload.replyTo || this.SUPPORT_EMAIL,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Generate unsubscribe link
   */
  private static generateUnsubscribeLink(userId: string, token: string): string {
    return `${process.env.FRONTEND_URL}/unsubscribe?userId=${userId}&token=${token}`;
  }

  /**
   * Generate footer with unsubscribe link
   */
  private static generateFooter(userId: string, token: string): string {
    const unsubscribeLink = this.generateUnsubscribeLink(userId, token);
    return `
      <tr>
        <td style="padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">
            © 2026 ${this.BRAND_NAME}. All rights reserved.
          </p>
          <p style="margin: 0;">
            <a href="${unsubscribeLink}" style="color: #3b82f6; text-decoration: none;">Unsubscribe from these emails</a>
          </p>
        </td>
      </tr>
    `;
  }

  /**
   * Send price alert email
   */
  static async sendPriceAlertEmail(
    email: string,
    userId: string,
    token: string,
    data: {
      symbol: string;
      currentPrice: number;
      threshold: number;
      direction: 'above' | 'below';
      change24h: number;
    }
  ): Promise<boolean> {
    const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <tr>
          <td style="padding: 24px; background-color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 24px; background: linear-gradient(135deg, ${this.BRAND_COLOR} 0%, #1e40af 100%);">
                  <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 600;">
                    💰 Price Alert
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
                    Hello,
                  </p>
                  <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Your price alert for <strong>${data.symbol}</strong> has been triggered!
                  </p>

                  <!-- Alert Card -->
                  <div style="background-color: #f8fafc; border-left: 4px solid ${this.BRAND_COLOR}; padding: 16px; margin: 24px 0; border-radius: 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Current Price</p>
                          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 24px; font-weight: 700;">$${data.currentPrice.toFixed(2)}</p>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">24h Change</p>
                          <p style="margin: 4px 0 0 0; color: ${data.change24h >= 0 ? '#10b981' : '#ef4444'}; font-size: 20px; font-weight: 700;">
                            ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
                          </p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Your alert was set to trigger when ${data.symbol} goes <strong>${data.direction}</strong> <strong>$${data.threshold.toFixed(2)}</strong>.
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="${process.env.FRONTEND_URL}/dashboard?symbol=${data.symbol}" style="display: inline-block; background-color: ${this.BRAND_COLOR}; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                          View in Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              ${this.generateFooter(userId, token)}
            </table>
          </td>
        </tr>
      </table>
    `;

    return this.sendEmail({
      to: email,
      subject: `🚨 ${data.symbol} Price Alert: $${data.currentPrice.toFixed(2)}`,
      htmlContent,
    });
  }

  /**
   * Send trading signal email
   */
  static async sendTradingSignalEmail(
    email: string,
    userId: string,
    token: string,
    data: {
      symbol: string;
      signal: 'BUY' | 'SELL' | 'HOLD';
      confidence: number;
      entryPrice: number;
      reason: string;
      technicalAnalysis: string;
    }
  ): Promise<boolean> {
    const signalColor = data.signal === 'BUY' ? '#10b981' : data.signal === 'SELL' ? '#ef4444' : '#f59e0b';
    const signalEmoji = data.signal === 'BUY' ? '📈' : data.signal === 'SELL' ? '📉' : '➡️';

    const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <tr>
          <td style="padding: 24px; background-color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 24px; background: linear-gradient(135deg, ${signalColor} 0%, ${signalColor}dd 100%);">
                  <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 600;">
                    ${signalEmoji} ${data.signal} Signal: ${data.symbol}
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
                    Hello,
                  </p>
                  <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    A new <strong>${data.signal}</strong> signal has been generated for <strong>${data.symbol}</strong>.
                  </p>

                  <!-- Signal Details -->
                  <div style="background-color: #f8fafc; padding: 16px; margin: 24px 0; border-radius: 8px; border-left: 4px solid ${signalColor};">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; width: 50%;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Confidence</p>
                          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 18px; font-weight: 700;">${data.confidence}%</p>
                        </td>
                        <td style="padding: 8px 0; width: 50%; text-align: right;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Entry Price</p>
                          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 18px; font-weight: 700;">$${data.entryPrice.toFixed(2)}</p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <h3 style="margin: 24px 0 12px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Reason</h3>
                  <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.6;">${data.reason}</p>

                  <h3 style="margin: 24px 0 12px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Technical Analysis</h3>
                  <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.6;">${data.technicalAnalysis}</p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="${process.env.FRONTEND_URL}/signals?symbol=${data.symbol}" style="display: inline-block; background-color: ${signalColor}; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                          View Full Analysis
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              ${this.generateFooter(userId, token)}
            </table>
          </td>
        </tr>
      </table>
    `;

    return this.sendEmail({
      to: email,
      subject: `${signalEmoji} ${data.signal} Signal: ${data.symbol} (${data.confidence}% confidence)`,
      htmlContent,
    });
  }

  /**
   * Send portfolio update email
   */
  static async sendPortfolioUpdateEmail(
    email: string,
    userId: string,
    token: string,
    data: {
      totalValue: number;
      dayChange: number;
      dayChangePercent: number;
      topGainer: { symbol: string; change: number };
      topLoser: { symbol: string; change: number };
    }
  ): Promise<boolean> {
    const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <tr>
          <td style="padding: 24px; background-color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 24px; background: linear-gradient(135deg, ${this.BRAND_COLOR} 0%, #1e40af 100%);">
                  <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 600;">
                    📊 Daily Portfolio Update
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <p style="margin: 0 0 24px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Here's your portfolio summary for today.
                  </p>

                  <!-- Portfolio Stats -->
                  <div style="background-color: #f8fafc; padding: 16px; margin: 24px 0; border-radius: 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Portfolio Value</p>
                          <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 22px; font-weight: 700;">$${data.totalValue.toFixed(2)}</p>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">24h Change</p>
                          <p style="margin: 4px 0 0 0; color: ${data.dayChangePercent >= 0 ? '#10b981' : '#ef4444'}; font-size: 20px; font-weight: 700;">
                            ${data.dayChangePercent >= 0 ? '+' : ''}${data.dayChangePercent.toFixed(2)}%
                          </p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Top Performers -->
                  <h3 style="margin: 24px 0 12px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Top Performers</h3>
                  <div style="background-color: #f0fdf4; padding: 12px; margin: 0 0 12px 0; border-radius: 8px; border-left: 4px solid #10b981;">
                    <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                      ${data.topGainer.symbol}: <span style="color: #10b981;">+${data.topGainer.change.toFixed(2)}%</span>
                    </p>
                  </div>

                  <!-- Top Losers -->
                  <h3 style="margin: 24px 0 12px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Top Losers</h3>
                  <div style="background-color: #fef2f2; padding: 12px; margin: 0 0 24px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                      ${data.topLoser.symbol}: <span style="color: #ef4444;">${data.topLoser.change.toFixed(2)}%</span>
                    </p>
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="${process.env.FRONTEND_URL}/portfolio" style="display: inline-block; background-color: ${this.BRAND_COLOR}; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                          View Full Portfolio
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              ${this.generateFooter(userId, token)}
            </table>
          </td>
        </tr>
      </table>
    `;

    return this.sendEmail({
      to: email,
      subject: `📊 Portfolio Update: ${data.dayChangePercent >= 0 ? '+' : ''}${data.dayChangePercent.toFixed(2)}%`,
      htmlContent,
    });
  }

  /**
   * Send backtest completion email
   */
  static async sendBacktestCompletionEmail(
    email: string,
    userId: string,
    token: string,
    data: {
      strategyName: string;
      totalReturn: number;
      sharpeRatio: number;
      winRate: number;
      maxDrawdown: number;
      trades: number;
    }
  ): Promise<boolean> {
    const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <tr>
          <td style="padding: 24px; background-color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 24px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
                  <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 600;">
                    ✅ Backtest Complete
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <p style="margin: 0 0 16px 0; color: #1e293b; font-size: 16px;">
                    Your backtest for <strong>${data.strategyName}</strong> has completed successfully!
                  </p>

                  <!-- Results Grid -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                    <tr>
                      <td style="padding: 12px; background-color: #f8fafc; border-radius: 8px; margin-bottom: 8px;">
                        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Total Return</p>
                        <p style="margin: 4px 0 0 0; color: ${data.totalReturn >= 0 ? '#10b981' : '#ef4444'}; font-size: 20px; font-weight: 700;">
                          ${data.totalReturn >= 0 ? '+' : ''}${data.totalReturn.toFixed(2)}%
                        </p>
                      </td>
                      <td style="padding: 12px; background-color: #f8fafc; border-radius: 8px; margin-left: 8px; margin-bottom: 8px;">
                        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Sharpe Ratio</p>
                        <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: 700;">${data.sharpeRatio.toFixed(2)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f8fafc; border-radius: 8px;">
                        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Win Rate</p>
                        <p style="margin: 4px 0 0 0; color: #10b981; font-size: 20px; font-weight: 700;">${data.winRate.toFixed(1)}%</p>
                      </td>
                      <td style="padding: 12px; background-color: #f8fafc; border-radius: 8px; margin-left: 8px;">
                        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Max Drawdown</p>
                        <p style="margin: 4px 0 0 0; color: #ef4444; font-size: 20px; font-weight: 700;">-${data.maxDrawdown.toFixed(2)}%</p>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                    Total trades executed: <strong>${data.trades}</strong>
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                    <tr>
                      <td>
                        <a href="${process.env.FRONTEND_URL}/backtesting?strategy=${data.strategyName}" style="display: inline-block; background-color: #8b5cf6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                          View Backtest Results
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              ${this.generateFooter(userId, token)}
            </table>
          </td>
        </tr>
      </table>
    `;

    return this.sendEmail({
      to: email,
      subject: `✅ Backtest Complete: ${data.strategyName} (${data.totalReturn >= 0 ? '+' : ''}${data.totalReturn.toFixed(2)}%)`,
      htmlContent,
    });
  }

  /**
   * Send weekly digest email
   */
  static async sendWeeklyDigestEmail(
    email: string,
    userId: string,
    token: string,
    data: {
      weekStart: string;
      weekEnd: string;
      portfolioGain: number;
      topTrade: { symbol: string; gain: number };
      alerts: number;
      signals: number;
    }
  ): Promise<boolean> {
    const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <tr>
          <td style="padding: 24px; background-color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 24px; background: linear-gradient(135deg, ${this.BRAND_COLOR} 0%, #1e40af 100%);">
                  <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 600;">
                    📋 Weekly Digest
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                    ${data.weekStart} - ${data.weekEnd}
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 18px; font-weight: 600;">
                    This Week's Performance
                  </h2>

                  <!-- Stats -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                    <tr>
                      <td style="padding: 16px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
                        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Portfolio Gain</p>
                        <p style="margin: 8px 0 0 0; color: #10b981; font-size: 24px; font-weight: 700;">
                          +${data.portfolioGain.toFixed(2)}%
                        </p>
                      </td>
                    </tr>
                  </table>

                  <h3 style="margin: 24px 0 12px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Top Trade</h3>
                  <div style="background-color: #f8fafc; padding: 12px; margin: 0 0 24px 0; border-radius: 8px; border-left: 4px solid #10b981;">
                    <p style="margin: 0; color: #1e293b; font-size: 14px;">
                      <strong>${data.topTrade.symbol}</strong>: <span style="color: #10b981;">+${data.topTrade.gain.toFixed(2)}%</span>
                    </p>
                  </div>

                  <h3 style="margin: 24px 0 12px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Activity Summary</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px;">
                    <li style="margin: 8px 0;">Price alerts triggered: <strong>${data.alerts}</strong></li>
                    <li style="margin: 8px 0;">Trading signals received: <strong>${data.signals}</strong></li>
                  </ul>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                    <tr>
                      <td>
                        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: ${this.BRAND_COLOR}; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                          View Full Dashboard
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              ${this.generateFooter(userId, token)}
            </table>
          </td>
        </tr>
      </table>
    `;

    return this.sendEmail({
      to: email,
      subject: `📋 Weekly Digest: ${data.portfolioGain >= 0 ? '+' : ''}${data.portfolioGain.toFixed(2)}% gain`,
      htmlContent,
    });
  }
}

export default EmailNotificationService;
