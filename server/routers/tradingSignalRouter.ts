import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import TradingSignalService from "../services/tradingSignalService";
import WebhookEventDispatcher from "../services/webhookEventDispatcher";

export const tradingSignalRouter = router({
  generateSignalAndDeliver: protectedProcedure
    .input(
      z.object({
        ticker: z.string().min(1).max(20),
        price: z.number().positive(),
        indicators: z.object({
          sma20: z.number(), sma50: z.number(), rsi: z.number(), macdValue: z.number(), macdSignal: z.number(), ema12: z.number(), ema26: z.number(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const signal = TradingSignalService.generateSignal(input.ticker, input.price, input.indicators);
      const summary = await WebhookEventDispatcher.dispatchForUser(ctx.user.id, {
        type: "trading_signal",
        title: `${signal.ticker} ${signal.signal} signal`,
        message: `Strength ${signal.strength.toFixed(0)} · confidence ${signal.confidence.toFixed(0)}% · price ${signal.price}`,
        data: { ticker: signal.ticker, signal: signal.signal, strength: signal.strength, confidence: signal.confidence, price: signal.price, reasoning: signal.reasoning },
        occurredAt: signal.timestamp,
      });
      return { success: true, signal, summary };
    }),

  /**
   * Generate trading signal based on indicators
   */
  generateSignal: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        price: z.number(),
        indicators: z.object({
          sma20: z.number(),
          sma50: z.number(),
          rsi: z.number(),
          macdValue: z.number(),
          macdSignal: z.number(),
          ema12: z.number(),
          ema26: z.number(),
        }),
      })
    )
    .query(({ input }) => {
      try {
        const signal = TradingSignalService.generateSignal(
          input.ticker,
          input.price,
          input.indicators
        );
        return { success: true, data: signal };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate signals for multiple tickers
   */
  generateSignalBasket: publicProcedure
    .input(
      z.array(
        z.object({
          ticker: z.string(),
          price: z.number(),
          indicators: z.object({
            sma20: z.number(),
            sma50: z.number(),
            rsi: z.number(),
            macdValue: z.number(),
            macdSignal: z.number(),
            ema12: z.number(),
            ema26: z.number(),
          }),
        })
      )
    )
    .query(({ input }) => {
      try {
        const signals = TradingSignalService.generateSignalBasket(input);
        return { success: true, data: signals };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Filter signals by criteria
   */
  filterSignals: publicProcedure
    .input(
      z.object({
        signals: z.array(
          z.object({
            id: z.string(),
            ticker: z.string(),
            signal: z.enum(["BUY", "SELL", "HOLD"]),
            strength: z.number(),
            confidence: z.number(),
            price: z.number(),
            timestamp: z.date(),
            indicators: z.any(),
            reasoning: z.array(z.string()),
          })
        ),
        criteria: z.object({
          signalType: z.enum(["BUY", "SELL", "HOLD"]).optional(),
          minStrength: z.number().optional(),
          minConfidence: z.number().optional(),
        }),
      })
    )
    .query(({ input }) => {
      try {
        const filtered = TradingSignalService.filterSignals(input.signals, input.criteria);
        return { success: true, data: filtered };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Rank signals by strength and confidence
   */
  rankSignals: publicProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          ticker: z.string(),
          signal: z.enum(["BUY", "SELL", "HOLD"]),
          strength: z.number(),
          confidence: z.number(),
          price: z.number(),
          timestamp: z.date(),
          indicators: z.any(),
          reasoning: z.array(z.string()),
        })
      )
    )
    .query(({ input }) => {
      try {
        const ranked = TradingSignalService.rankSignals(input);
        return { success: true, data: ranked };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate alert for strong signals
   */
  generateAlert: publicProcedure
    .input(
      z.object({
        id: z.string(),
        ticker: z.string(),
        signal: z.enum(["BUY", "SELL", "HOLD"]),
        strength: z.number(),
        confidence: z.number(),
        price: z.number(),
        timestamp: z.date(),
        indicators: z.any(),
        reasoning: z.array(z.string()),
      })
    )
    .query(({ input }) => {
      try {
        const alert = TradingSignalService.generateAlert(input);
        return { success: true, data: alert };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Analyze divergence between timeframes
   */
  analyzeDivergence: publicProcedure
    .input(
      z.object({
        shortTermSignal: z.object({
          id: z.string(),
          ticker: z.string(),
          signal: z.enum(["BUY", "SELL", "HOLD"]),
          strength: z.number(),
          confidence: z.number(),
          price: z.number(),
          timestamp: z.date(),
          indicators: z.any(),
          reasoning: z.array(z.string()),
        }),
        longTermSignal: z.object({
          id: z.string(),
          ticker: z.string(),
          signal: z.enum(["BUY", "SELL", "HOLD"]),
          strength: z.number(),
          confidence: z.number(),
          price: z.number(),
          timestamp: z.date(),
          indicators: z.any(),
          reasoning: z.array(z.string()),
        }),
      })
    )
    .query(({ input }) => {
      try {
        const divergence = TradingSignalService.analyzeDivergence(
          input.shortTermSignal,
          input.longTermSignal
        );
        return { success: true, data: divergence };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Calculate risk/reward ratio
   */
  calculateRiskReward: publicProcedure
    .input(
      z.object({
        entryPrice: z.number(),
        stopLoss: z.number(),
        takeProfit: z.number(),
      })
    )
    .query(({ input }) => {
      try {
        const riskReward = TradingSignalService.calculateRiskReward(
          input.entryPrice,
          input.stopLoss,
          input.takeProfit
        );
        return { success: true, data: riskReward };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Generate entry and exit levels
   */
  generateLevels: publicProcedure
    .input(
      z.object({
        price: z.number(),
        atr: z.number(),
      })
    )
    .query(({ input }) => {
      try {
        const levels = TradingSignalService.generateLevels(input.price, input.atr);
        return { success: true, data: levels };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),
});
