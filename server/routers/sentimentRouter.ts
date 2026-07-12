import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import SentimentAnalysisService from "../services/sentimentAnalysisService";

export const sentimentRouter = router({
  /**
   * Analyze sentiment from text
   */
  analyzeSentiment: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      try {
        const result = SentimentAnalysisService.analyzeSentiment(input.text);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Extract ticker mentions
   */
  extractTickerMentions: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      try {
        const tickers = SentimentAnalysisService.extractTickerMentions(input.text);
        return { success: true, data: { tickers } };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Score news impact
   */
  scoreNewsImpact: publicProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        sentiment: z.enum(["POSITIVE", "NEGATIVE", "NEUTRAL"]),
      })
    )
    .query(({ input }) => {
      try {
        const impact = SentimentAnalysisService.scoreNewsImpact(
          input.title,
          input.content,
          input.sentiment
        );
        return { success: true, data: { impact } };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Aggregate sentiments
   */
  aggregateSentiments: protectedProcedure
    .input(
      z.array(
        z.object({
          source: z.enum(["twitter", "reddit", "news", "telegram", "discord"]),
          ticker: z.string(),
          sentiment: z.enum([
            "VERY_POSITIVE",
            "POSITIVE",
            "NEUTRAL",
            "NEGATIVE",
            "VERY_NEGATIVE",
          ]),
          score: z.number(),
          confidence: z.number(),
          timestamp: z.date(),
          sampleSize: z.number(),
          keywords: z.array(z.string()),
        })
      )
    )
    .query(({ input }) => {
      try {
        const result = SentimentAnalysisService.aggregateSentiments(input);
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate sentiment trend
   */
  calculateSentimentTrend: protectedProcedure
    .input(
      z.object({
        sentiments: z.array(
          z.object({
            source: z.enum(["twitter", "reddit", "news", "telegram", "discord"]),
            ticker: z.string(),
            sentiment: z.enum([
              "VERY_POSITIVE",
              "POSITIVE",
              "NEUTRAL",
              "NEGATIVE",
              "VERY_NEGATIVE",
            ]),
            score: z.number(),
            confidence: z.number(),
            timestamp: z.date(),
            sampleSize: z.number(),
            keywords: z.array(z.string()),
          })
        ),
        period: z.enum(["1H", "4H", "1D", "7D", "30D"]),
      })
    )
    .query(({ input }) => {
      try {
        const trend = SentimentAnalysisService.calculateSentimentTrend(
          input.sentiments,
          input.period
        );
        return { success: true, data: trend };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate momentum
   */
  calculateMomentum: protectedProcedure
    .input(
      z.array(
        z.object({
          source: z.enum(["twitter", "reddit", "news", "telegram", "discord"]),
          ticker: z.string(),
          sentiment: z.enum([
            "VERY_POSITIVE",
            "POSITIVE",
            "NEUTRAL",
            "NEGATIVE",
            "VERY_NEGATIVE",
          ]),
          score: z.number(),
          confidence: z.number(),
          timestamp: z.date(),
          sampleSize: z.number(),
          keywords: z.array(z.string()),
        })
      )
    )
    .query(({ input }) => {
      try {
        const momentum = SentimentAnalysisService.calculateMomentum(input);
        return { success: true, data: { momentum } };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Get sentiment by source
   */
  getSentimentBySource: protectedProcedure
    .input(
      z.array(
        z.object({
          source: z.enum(["twitter", "reddit", "news", "telegram", "discord"]),
          ticker: z.string(),
          sentiment: z.enum([
            "VERY_POSITIVE",
            "POSITIVE",
            "NEUTRAL",
            "NEGATIVE",
            "VERY_NEGATIVE",
          ]),
          score: z.number(),
          confidence: z.number(),
          timestamp: z.date(),
          sampleSize: z.number(),
          keywords: z.array(z.string()),
        })
      )
    )
    .query(({ input }) => {
      try {
        const bySource = SentimentAnalysisService.getSentimentBySource(input);
        return { success: true, data: bySource };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Predict price movement
   */
  predictPriceMovement: protectedProcedure
    .input(
      z.object({
        sentiment: z.number(),
        volatility: z.number(),
        momentum: z.number(),
      })
    )
    .query(({ input }) => {
      try {
        const prediction = SentimentAnalysisService.predictPriceMovement(
          input.sentiment,
          input.volatility,
          input.momentum
        );
        return { success: true, data: prediction };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate sentiment report
   */
  generateSentimentReport: protectedProcedure
    .input(
      z.array(
        z.object({
          source: z.enum(["twitter", "reddit", "news", "telegram", "discord"]),
          ticker: z.string(),
          sentiment: z.enum([
            "VERY_POSITIVE",
            "POSITIVE",
            "NEUTRAL",
            "NEGATIVE",
            "VERY_NEGATIVE",
          ]),
          score: z.number(),
          confidence: z.number(),
          timestamp: z.date(),
          sampleSize: z.number(),
          keywords: z.array(z.string()),
        })
      )
    )
    .query(({ input }) => {
      try {
        const report = SentimentAnalysisService.generateSentimentReport(input);
        return { success: true, data: report };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),
});
