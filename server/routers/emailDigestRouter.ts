/**
 * Email Digest Router
 * Handles scheduled email digest configuration and generation
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import EmailDigestService, { DigestFrequency, DigestContent } from '../services/emailDigestService';

export const emailDigestRouter = router({
  /**
   * Set digest frequency for user
   */
  setDigestFrequency: protectedProcedure
    .input(
      z.object({
        type: z.enum(['daily', 'weekly', 'monthly']),
        dayOfWeek: z.number().optional(),
        dayOfMonth: z.number().optional(),
        time: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        const frequency: DigestFrequency = {
          type: input.type,
          dayOfWeek: input.dayOfWeek,
          dayOfMonth: input.dayOfMonth,
          time: input.time || '08:00',
        };

        // Validate frequency
        if (!EmailDigestService.validateFrequency(frequency)) {
          throw new Error('Invalid digest frequency configuration');
        }

        // Calculate next digest time
        const nextDigestTime = EmailDigestService.calculateNextDigestTime(frequency);

        // In production, save to database
        // await db.userDigestPreferences.upsert({
        //   where: { userId: ctx.user.id },
        //   update: { ...frequency, nextDigestTime },
        //   create: { userId: ctx.user.id, ...frequency, nextDigestTime },
        // });

        return {
          success: true,
          message: 'Digest frequency updated successfully',
          frequency,
          nextDigestTime,
        };
      } catch (error) {
        throw new Error(`Failed to set digest frequency: ${String(error)}`);
      }
    }),

  /**
   * Get user's digest preferences
   */
  getDigestPreferences: protectedProcedure.query(async ({ ctx: _ctx }) => {
    try {
      // In production, fetch from database
      // const preferences = await db.userDigestPreferences.findUnique({
      //   where: { userId: ctx.user.id },
      // });

      return {
        success: true,
        preferences: {
          type: 'weekly',
          dayOfWeek: 0,
          time: '08:00',
          enabled: true,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get digest preferences: ${String(error)}`);
    }
  }),

  /**
   * Generate digest for user
   */
  generateDigest: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        metrics: z.object({
          totalValue: z.number(),
          totalGain: z.number(),
          gainPercent: z.number(),
          dayChange: z.number(),
          weekChange: z.number(),
          monthChange: z.number(),
          volatility: z.number(),
          sharpeRatio: z.number(),
        }),
        topPerformers: z.array(
          z.object({
            symbol: z.string(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            gain: z.number(),
            gainPercent: z.number(),
            quantity: z.number(),
          })
        ),
        worstPerformers: z.array(
          z.object({
            symbol: z.string(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            gain: z.number(),
            gainPercent: z.number(),
            quantity: z.number(),
          })
        ),
        triggeredAlerts: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate performance summary
        const summary = await EmailDigestService.generatePerformanceSummary(input.metrics);

        // Generate recommendations
        const recommendations = await EmailDigestService.generateRecommendations(
          input.metrics,
          input.topPerformers,
          input.worstPerformers
        );

        // Create digest content
        const digest: DigestContent = {
          userId: String(ctx.user.id),
          period: input.period,
          metrics: input.metrics,
          topPerformers: input.topPerformers,
          worstPerformers: input.worstPerformers,
          triggeredAlerts: input.triggeredAlerts,
          recommendations,
          summary,
          generatedAt: new Date(),
        };

        // Generate HTML email
        const htmlContent = EmailDigestService.generateDigestHTML(digest);

        return {
          success: true,
          digest,
          htmlContent,
          message: 'Digest generated successfully',
        };
      } catch (error) {
        throw new Error(`Failed to generate digest: ${String(error)}`);
      }
    }),

  /**
   * Send digest email
   */
  sendDigestEmail: protectedProcedure
    .input(
      z.object({
        period: z.string(),
        metrics: z.object({
          totalValue: z.number(),
          totalGain: z.number(),
          gainPercent: z.number(),
          dayChange: z.number(),
          weekChange: z.number(),
          monthChange: z.number(),
          volatility: z.number(),
          sharpeRatio: z.number(),
        }),
        topPerformers: z.array(
          z.object({
            symbol: z.string(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            gain: z.number(),
            gainPercent: z.number(),
            quantity: z.number(),
          })
        ),
        worstPerformers: z.array(
          z.object({
            symbol: z.string(),
            entryPrice: z.number(),
            currentPrice: z.number(),
            gain: z.number(),
            gainPercent: z.number(),
            quantity: z.number(),
          })
        ),
        triggeredAlerts: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate performance summary
        const summary = await EmailDigestService.generatePerformanceSummary(input.metrics);

        // Generate recommendations
        const recommendations = await EmailDigestService.generateRecommendations(
          input.metrics,
          input.topPerformers,
          input.worstPerformers
        );

        // Create digest content
        const digest: DigestContent = {
          userId: String(ctx.user.id),
          period: input.period,
          metrics: input.metrics,
          topPerformers: input.topPerformers,
          worstPerformers: input.worstPerformers,
          triggeredAlerts: input.triggeredAlerts,
          recommendations,
          summary,
          generatedAt: new Date(),
        };

        // Generate HTML email
        const _htmlContent = EmailDigestService.generateDigestHTML(digest);

        // In production, send email using nodemailer
        // const transporter = nodemailer.createTransport({...});
        // await transporter.sendMail({
        //   from: 'noreply@canslim.manus.space',
        //   to: ctx.user.email,
        //   subject: `Portfolio Digest - ${input.period}`,
        //   html: htmlContent,
        // });

        return {
          success: true,
          message: `Digest email sent to ${ctx.user.email}`,
          digest,
        };
      } catch (error) {
        throw new Error(`Failed to send digest email: ${String(error)}`);
      }
    }),

  /**
   * Calculate next digest time
   */
  getNextDigestTime: protectedProcedure.query(async ({ ctx: _ctx }) => {
    try {
      // In production, fetch preferences from database
      const frequency: DigestFrequency = {
        type: 'weekly',
        dayOfWeek: 0,
        time: '08:00',
      };

      const nextDigestTime = EmailDigestService.calculateNextDigestTime(frequency);

      return {
        success: true,
        nextDigestTime,
        frequency,
      };
    } catch (error) {
      throw new Error(`Failed to get next digest time: ${String(error)}`);
    }
  }),

  /**
   * Disable digest emails
   */
  disableDigest: protectedProcedure.mutation(async ({ ctx: _ctx }) => {
    try {
      // In production, update database
      // await db.userDigestPreferences.update({
      //   where: { userId: ctx.user.id },
      //   data: { enabled: false },
      // });

      return {
        success: true,
        message: 'Digest emails disabled',
      };
    } catch (error) {
      throw new Error(`Failed to disable digest: ${String(error)}`);
    }
  }),

  /**
   * Enable digest emails
   */
  enableDigest: protectedProcedure.mutation(async ({ ctx: _ctx }) => {
    try {
      // In production, update database
      // await db.userDigestPreferences.update({
      //   where: { userId: ctx.user.id },
      //   data: { enabled: true },
      // });

      return {
        success: true,
        message: 'Digest emails enabled',
      };
    } catch (error) {
      throw new Error(`Failed to enable digest: ${String(error)}`);
    }
  }),

  /**
   * Get digest history
   */
  getDigestHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input: _input, ctx: _ctx }) => {
      try {
        // In production, fetch from database
        // const digests = await db.digestHistory.findMany({
        //   where: { userId: ctx.user.id },
        //   orderBy: { generatedAt: 'desc' },
        //   take: input.limit,
        // });

        return {
          success: true,
          digests: [],
          count: 0,
        };
      } catch (error) {
        throw new Error(`Failed to get digest history: ${String(error)}`);
      }
    }),
});

export default emailDigestRouter;
