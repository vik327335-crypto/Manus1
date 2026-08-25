import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  calculateTechnicalIndicators,
  getHistoricalOHLCV,
  getHistoricalOHLCVProviderHealth,
  getMultiYearHistoricalData,
  type HistoricalDataResponse,
} from "../services/polygonService";

const tickerSchema = z.string().trim().regex(/^[A-Za-z0-9]{2,12}$/);
const utcDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function unavailableResponse(data: HistoricalDataResponse) {
  return {
    success: false,
    data: null,
    provider: data.source,
    availability: data.availability,
    error: data.error?.message ?? "Historical OHLCV is unavailable.",
    errorCode: data.error?.code ?? "provider_error",
    retryAfterMs: data.error?.retryAfterMs ?? null,
    freshness: {
      fetchedAt: data.fetchedAt,
      cacheAgeMs: data.cacheAgeMs,
      coverageStartDate: data.coverageStartDate,
      coverageEndDate: data.coverageEndDate,
    },
  };
}

export const historicalDataRouter = router({
  getProviderHealth: publicProcedure.query(() => getHistoricalOHLCVProviderHealth()),

  getOHLCV: publicProcedure
    .input(z.object({ ticker: tickerSchema, startDate: utcDateSchema, endDate: utcDateSchema, timeframe: z.enum(["day", "week", "month"]).default("day") }))
    .query(async ({ input }) => {
      const data = await getHistoricalOHLCV(input.ticker, input.startDate, input.endDate, input.timeframe);
      if (data.availability !== "available") return unavailableResponse(data);
      return { success: true, data, provider: data.source, availability: data.availability };
    }),

  getMultiYear: publicProcedure
    .input(z.object({ ticker: tickerSchema, years: z.number().min(1).max(2).default(1) }))
    .query(async ({ input }) => {
      const data = await getMultiYearHistoricalData(input.ticker, input.years);
      if (data.availability !== "available") return unavailableResponse(data);
      return { success: true, data, provider: data.source, availability: data.availability };
    }),

  getTechnicalIndicators: publicProcedure
    .input(z.object({ ticker: tickerSchema, years: z.number().min(1).max(2).default(1) }))
    .query(async ({ input }) => {
      const historicalData = await getMultiYearHistoricalData(input.ticker, input.years);
      if (historicalData.availability !== "available") return unavailableResponse(historicalData);
      return {
        success: true,
        ticker: historicalData.ticker,
        provider: historicalData.source,
        freshness: {
          fetchedAt: historicalData.fetchedAt,
          cacheAgeMs: historicalData.cacheAgeMs,
          coverageStartDate: historicalData.coverageStartDate,
          coverageEndDate: historicalData.coverageEndDate,
        },
        indicators: calculateTechnicalIndicators(historicalData.data),
        dataPoints: historicalData.dataPoints,
      };
    }),

  getBacktestingData: protectedProcedure
    .input(z.object({ tickers: z.array(tickerSchema).min(1), years: z.number().min(1).max(2).default(1) }))
    .query(async ({ input }) => {
      const results: Record<string, HistoricalDataResponse> = {};
      const unavailable: Record<string, ReturnType<typeof unavailableResponse>> = {};

      for (const ticker of input.tickers) {
        const data = await getMultiYearHistoricalData(ticker, input.years);
        if (data.availability !== "available") unavailable[ticker] = unavailableResponse(data);
        else results[ticker] = data;
      }

      if (Object.keys(unavailable).length > 0) {
        return {
          success: false,
          error: "Historical OHLCV is unavailable for one or more requested assets.",
          data: null,
          unavailable,
          providerHealth: getHistoricalOHLCVProviderHealth(),
        };
      }

      return {
        success: true,
        data: results,
        tickerCount: input.tickers.length,
        totalDataPoints: Object.values(results).reduce((sum, result) => sum + result.dataPoints, 0),
        providerHealth: getHistoricalOHLCVProviderHealth(),
      };
    }),

  getPriceAtDate: publicProcedure
    .input(z.object({ ticker: tickerSchema, date: utcDateSchema }))
    .query(async ({ input }) => {
      const requested = new Date(`${input.date}T00:00:00.000Z`);
      const start = new Date(requested);
      const end = new Date(requested);
      start.setUTCDate(start.getUTCDate() - 5);
      end.setUTCDate(end.getUTCDate() + 5);
      const data = await getHistoricalOHLCV(input.ticker, start.toISOString().slice(0, 10), end.toISOString().slice(0, 10), "day");
      if (data.availability !== "available") return unavailableResponse(data);

      const exact = data.data.find((bar) => bar.date === input.date);
      const closest = data.data.reduce((previous, current) =>
        Math.abs(new Date(current.date).getTime() - requested.getTime()) < Math.abs(new Date(previous.date).getTime() - requested.getTime())
          ? current
          : previous
      );
      return { success: true, ticker: data.ticker, requestedDate: input.date, data: exact ?? closest, isExactDate: Boolean(exact), provider: data.source, freshness: { fetchedAt: data.fetchedAt, cacheAgeMs: data.cacheAgeMs } };
    }),

  getPriceRange: publicProcedure
    .input(z.object({ ticker: tickerSchema, startDate: utcDateSchema, endDate: utcDateSchema }))
    .query(async ({ input }) => {
      const data = await getHistoricalOHLCV(input.ticker, input.startDate, input.endDate, "day");
      if (data.availability !== "available") return unavailableResponse(data);
      const closes = data.data.map((bar) => bar.close);
      const highs = data.data.map((bar) => bar.high);
      const lows = data.data.map((bar) => bar.low);
      const startPrice = closes[0];
      const endPrice = closes[closes.length - 1];
      return {
        success: true,
        ticker: data.ticker,
        provider: data.source,
        period: { startDate: input.startDate, endDate: input.endDate, coverageStartDate: data.coverageStartDate, coverageEndDate: data.coverageEndDate },
        prices: {
          start: startPrice,
          end: endPrice,
          high: Math.max(...highs),
          low: Math.min(...lows),
          average: closes.reduce((sum, price) => sum + price, 0) / closes.length,
        },
        return: ((endPrice - startPrice) / startPrice) * 100,
        dataPoints: data.dataPoints,
        freshness: { fetchedAt: data.fetchedAt, cacheAgeMs: data.cacheAgeMs },
      };
    }),
});
