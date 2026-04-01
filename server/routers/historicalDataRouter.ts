import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  getHistoricalOHLCV,
  getMultiYearHistoricalData,
  calculateTechnicalIndicators,
  type HistoricalDataResponse,
} from '../services/polygonService';

export const historicalDataRouter = router({
  // Get historical OHLCV data for a ticker
  getOHLCV: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        timeframe: z.enum(['day', 'week', 'month']).default('day'),
      })
    )
    .query(async ({ input }) => {
      try {
        const data = await getHistoricalOHLCV(
          input.ticker,
          input.startDate,
          input.endDate,
          input.timeframe
        );

        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error('[HistoricalDataRouter] Error fetching OHLCV:', error);
        return {
          success: false,
          error: 'Failed to fetch historical data',
          data: null,
        };
      }
    }),

  // Get multi-year historical data
  getMultiYear: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        years: z.number().min(1).max(5).default(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const data = await getMultiYearHistoricalData(input.ticker, input.years);

        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error('[HistoricalDataRouter] Error fetching multi-year data:', error);
        return {
          success: false,
          error: 'Failed to fetch multi-year historical data',
          data: null,
        };
      }
    }),

  // Get technical indicators for a ticker
  getTechnicalIndicators: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        years: z.number().min(1).max(5).default(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const historicalData = await getMultiYearHistoricalData(input.ticker, input.years);
        const indicators = calculateTechnicalIndicators(historicalData.data);

        return {
          success: true,
          ticker: input.ticker,
          indicators,
          dataPoints: historicalData.dataPoints,
        };
      } catch (error) {
        console.error('[HistoricalDataRouter] Error calculating indicators:', error);
        return {
          success: false,
          error: 'Failed to calculate technical indicators',
          indicators: null,
        };
      }
    }),

  // Get backtesting data (1-5 years of historical data)
  getBacktestingData: protectedProcedure
    .input(
      z.object({
        tickers: z.array(z.string()),
        years: z.number().min(1).max(5).default(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const results: Record<string, HistoricalDataResponse> = {};

        for (const ticker of input.tickers) {
          const data = await getMultiYearHistoricalData(ticker, input.years);
          results[ticker] = data;
        }

        return {
          success: true,
          data: results,
          tickerCount: input.tickers.length,
          totalDataPoints: Object.values(results).reduce((sum, r) => sum + r.dataPoints, 0),
        };
      } catch (error) {
        console.error('[HistoricalDataRouter] Error fetching backtesting data:', error);
        return {
          success: false,
          error: 'Failed to fetch backtesting data',
          data: null,
        };
      }
    }),

  // Get price at specific date
  getPriceAtDate: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ input }) => {
      try {
        // Get data for the date and a few days before/after
        const startDate = new Date(input.date);
        startDate.setDate(startDate.getDate() - 5);
        const endDate = new Date(input.date);
        endDate.setDate(endDate.getDate() + 5);

        const data = await getHistoricalOHLCV(
          input.ticker,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          'day'
        );

        // Find the exact date or closest date
        const exactDate = data.data.find((d) => d.date === input.date);
        const closestDate = data.data.reduce((prev, curr) => {
          const prevDiff = Math.abs(new Date(prev.date).getTime() - new Date(input.date).getTime());
          const currDiff = Math.abs(new Date(curr.date).getTime() - new Date(input.date).getTime());
          return currDiff < prevDiff ? curr : prev;
        });

        return {
          success: true,
          ticker: input.ticker,
          requestedDate: input.date,
          data: exactDate || closestDate,
          isExactDate: !!exactDate,
        };
      } catch (error) {
        console.error('[HistoricalDataRouter] Error fetching price at date:', error);
        return {
          success: false,
          error: 'Failed to fetch price data',
          data: null,
        };
      }
    }),

  // Get price range for period
  getPriceRange: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ input }) => {
      try {
        const data = await getHistoricalOHLCV(input.ticker, input.startDate, input.endDate, 'day');

        if (data.data.length === 0) {
          return {
            success: false,
            error: 'No data found for the specified period',
          };
        }

        const closes = data.data.map((d) => d.close);
        const highs = data.data.map((d) => d.high);
        const lows = data.data.map((d) => d.low);

        const highest = Math.max(...highs);
        const lowest = Math.min(...lows);
        const startPrice = data.data[0].close;
        const endPrice = data.data[data.data.length - 1].close;
        const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
        const return_ = ((endPrice - startPrice) / startPrice) * 100;

        return {
          success: true,
          ticker: input.ticker,
          period: {
            startDate: input.startDate,
            endDate: input.endDate,
          },
          prices: {
            start: startPrice,
            end: endPrice,
            high: highest,
            low: lowest,
            average: Math.round(avgPrice * 100) / 100,
          },
          return: Math.round(return_ * 100) / 100,
          dataPoints: data.dataPoints,
        };
      } catch (error) {
        console.error('[HistoricalDataRouter] Error fetching price range:', error);
        return {
          success: false,
          error: 'Failed to fetch price range data',
        };
      }
    }),
});
