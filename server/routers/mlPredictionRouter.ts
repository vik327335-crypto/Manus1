import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import MLPredictionService, { PriceData } from "../services/mlPredictionService";

const priceDataSchema = z.object({
  timestamp: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

export const mlPredictionRouter = router({
  /**
   * Predict price movement for a single ticker
   */
  predictPriceMovement: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        priceHistory: z.array(priceDataSchema),
        sentiment: z.number().min(-1).max(1),
        technicalIndicators: z.object({
          sma20: z.number(),
          sma50: z.number(),
          rsi: z.number(),
          macd: z.number(),
          bollingerBands: z.object({
            upper: z.number(),
            lower: z.number(),
          }),
        }),
        marketCap: z.number().optional(),
        volume24h: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const prediction = MLPredictionService.predictPriceMovement(input);
        return {
          success: true,
          data: prediction,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Predict multiple timeframes
   */
  predictMultipleTimeframes: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        priceHistory: z.array(priceDataSchema),
        sentiment: z.number().min(-1).max(1),
        technicalIndicators: z.object({
          sma20: z.number(),
          sma50: z.number(),
          rsi: z.number(),
          macd: z.number(),
          bollingerBands: z.object({
            upper: z.number(),
            lower: z.number(),
          }),
        }),
      })
    )
    .query(async ({ input }) => {
      try {
        const predictions = MLPredictionService.predictMultipleTimeframes(input);
        return {
          success: true,
          data: predictions,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Ensemble prediction combining multiple models
   */
  ensemblePrediction: protectedProcedure
    .input(
      z.array(
        z.object({
          ticker: z.string(),
          priceHistory: z.array(priceDataSchema),
          sentiment: z.number().min(-1).max(1),
          technicalIndicators: z.object({
            sma20: z.number(),
            sma50: z.number(),
            rsi: z.number(),
            macd: z.number(),
            bollingerBands: z.object({
              upper: z.number(),
              lower: z.number(),
            }),
          }),
        })
      )
    )
    .query(async ({ input }) => {
      try {
        if (input.length === 0) {
          return {
            success: false,
            error: "No inputs provided",
          };
        }
        const prediction = MLPredictionService.ensemblePrediction(input);
        return {
          success: true,
          data: prediction,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Backtest prediction model
   */
  backtestModel: protectedProcedure
    .input(
      z.object({
        priceHistory: z.array(priceDataSchema),
        sentiment: z.number().min(-1).max(1),
        windowSize: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const results = MLPredictionService.backtestModel(
          input.priceHistory,
          input.sentiment,
          input.windowSize || 50
        );
        return {
          success: true,
          data: results,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Get prediction confidence levels
   */
  getPredictionConfidence: protectedProcedure
    .input(
      z.object({
        ticker: z.string(),
        priceHistory: z.array(priceDataSchema),
        sentiment: z.number().min(-1).max(1),
        technicalIndicators: z.object({
          sma20: z.number(),
          sma50: z.number(),
          rsi: z.number(),
          macd: z.number(),
          bollingerBands: z.object({
            upper: z.number(),
            lower: z.number(),
          }),
        }),
      })
    )
    .query(async ({ input }) => {
      try {
        const prediction = MLPredictionService.predictPriceMovement(input);
        return {
          success: true,
          data: {
            ticker: prediction.ticker,
            prediction: prediction.prediction,
            confidence: Math.round(prediction.confidence * 100),
            riskLevel: prediction.riskLevel,
            reasoning: prediction.reasoning,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Batch predictions for multiple tickers
   */
  batchPredictions: protectedProcedure
    .input(
      z.array(
        z.object({
          ticker: z.string(),
          priceHistory: z.array(priceDataSchema),
          sentiment: z.number().min(-1).max(1),
          technicalIndicators: z.object({
            sma20: z.number(),
            sma50: z.number(),
            rsi: z.number(),
            macd: z.number(),
            bollingerBands: z.object({
              upper: z.number(),
              lower: z.number(),
            }),
          }),
        })
      )
    )
    .query(async ({ input }) => {
      try {
        const predictions = input.map((item) => MLPredictionService.predictPriceMovement(item));
        return {
          success: true,
          data: predictions,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),
});
