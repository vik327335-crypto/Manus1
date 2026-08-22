/**
 * Email Notification Router
 * Handles email notification delivery and preferences
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import EmailNotificationService from '../services/emailNotificationService';
import { getDb as _getDb } from '../db';

export const emailNotificationRouter = router({
  /**
   * Send price alert email
   */
  sendPriceAlertEmail: protectedProcedure
    .input(z.object({
      symbol: z.string(),
      currentPrice: z.number(),
      threshold: z.number(),
      direction: z.enum(['above', 'below']),
      change24h: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await EmailNotificationService.sendPriceAlertEmail(
          ctx.user.email || '',
          (ctx.user.id as unknown) as string,
          'token', // In production, generate a proper unsubscribe token
          {
            symbol: input.symbol,
            currentPrice: input.currentPrice,
            threshold: input.threshold,
            direction: input.direction,
            change24h: input.change24h,
          }
        );

        return {
          success,
          message: success ? 'Email sent successfully' : 'Failed to send email',
        };
      } catch (error) {
        throw new Error(`Failed to send price alert email: ${String(error)}`);
      }
    }),

  /**
   * Send trading signal email
   */
  sendTradingSignalEmail: protectedProcedure
    .input(z.object({
      symbol: z.string(),
      signal: z.enum(['BUY', 'SELL', 'HOLD']),
      confidence: z.number(),
      entryPrice: z.number(),
      reason: z.string(),
      technicalAnalysis: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await EmailNotificationService.sendTradingSignalEmail(
          ctx.user.email || '',
          (ctx.user.id as unknown) as string,
          'token',
          {
            symbol: input.symbol,
            signal: input.signal,
            confidence: Math.round(input.confidence) as number,
            entryPrice: input.entryPrice,
            reason: input.reason,
            technicalAnalysis: input.technicalAnalysis,
          }
        );

        return {
          success,
          message: success ? 'Email sent successfully' : 'Failed to send email',
        };
      } catch (error) {
        throw new Error(`Failed to send trading signal email: ${String(error)}`);
      }
    }),

  /**
   * Send portfolio update email
   */
  sendPortfolioUpdateEmail: protectedProcedure
    .input(z.object({
      totalValue: z.number(),
      dayChange: z.number(),
      dayChangePercent: z.number(),
      topGainer: z.object({ symbol: z.string(), change: z.number() }),
      topLoser: z.object({ symbol: z.string(), change: z.number() }),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await EmailNotificationService.sendPortfolioUpdateEmail(
          ctx.user.email || '',
          (ctx.user.id as unknown) as string,
          'token',
          {
            totalValue: input.totalValue,
            dayChange: input.dayChange,
            dayChangePercent: input.dayChangePercent,
            topGainer: input.topGainer,
            topLoser: input.topLoser,
          }
        );

        return {
          success,
          message: success ? 'Email sent successfully' : 'Failed to send email',
        };
      } catch (error) {
        throw new Error(`Failed to send portfolio update email: ${String(error)}`);
      }
    }),

  /**
   * Send backtest completion email
   */
  sendBacktestCompletionEmail: protectedProcedure
    .input(z.object({
      strategyName: z.string(),
      totalReturn: z.number(),
      sharpeRatio: z.number(),
      winRate: z.number(),
      maxDrawdown: z.number(),
      trades: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await EmailNotificationService.sendBacktestCompletionEmail(
          ctx.user.email || '',
          (ctx.user.id as unknown) as string,
          'token',
          {
            strategyName: input.strategyName,
            totalReturn: input.totalReturn,
            sharpeRatio: input.sharpeRatio,
            winRate: input.winRate,
            maxDrawdown: input.maxDrawdown,
            trades: input.trades,
          }
        );

        return {
          success,
          message: success ? 'Email sent successfully' : 'Failed to send email',
        };
      } catch (error) {
        throw new Error(`Failed to send backtest completion email: ${String(error)}`);
      }
    }),

  /**
   * Send weekly digest email
   */
  sendWeeklyDigestEmail: protectedProcedure
    .input(z.object({
      weekStart: z.string(),
      weekEnd: z.string(),
      portfolioGain: z.number(),
      topTrade: z.object({ symbol: z.string(), gain: z.number() }),
      alerts: z.number(),
      signals: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await EmailNotificationService.sendWeeklyDigestEmail(
          ctx.user.email || '',
          (ctx.user.id as unknown) as string,
          'token',
          {
            weekStart: input.weekStart,
            weekEnd: input.weekEnd,
            portfolioGain: input.portfolioGain,
            topTrade: input.topTrade,
            alerts: input.alerts,
            signals: input.signals,
          }
        );

        return {
          success,
          message: success ? 'Email sent successfully' : 'Failed to send email',
        };
      } catch (error) {
        throw new Error(`Failed to send weekly digest email: ${String(error)}`);
      }
    }),

  /**
   * Test email delivery
   */
  sendTestEmail: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const success = await EmailNotificationService.sendEmail({
        to: ctx.user.email || '',
        subject: 'Test Email from CAN SLIM Crypto Scanner',
        htmlContent: `
          <table width="100%" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <tr>
              <td style="padding: 24px; background-color: #f8fafc;">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px; font-weight: 600;">
                        ✅ Test Email Successful
                      </h1>
                      <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        This is a test email to verify that email notifications are working correctly.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `,
      });

      return {
        success,
        message: success ? 'Test email sent successfully' : 'Failed to send test email',
      };
    } catch (error) {
      throw new Error(`Failed to send test email: ${String(error)}`);
    }
  }),
});

export default emailNotificationRouter;
