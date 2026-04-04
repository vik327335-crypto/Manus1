import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { exportRouter } from "./routers/exportRouter";
import { marketRouter } from "./routers/marketRouter";
import { newsRouter } from "./routers/newsRouter";
import { adminRouter } from "./routers/adminRouter";
import { notificationRouter } from "./routers/notificationRouter";
import { backtestRouter } from "./routers/backtestRouter";
import { realTimeRouter } from "./routers/realTimeRouter";
import { historicalDataRouter } from "./routers/historicalDataRouter";
import { strategyExportRouter } from "./routers/strategyExportRouter";
import { polygonRouter } from "./routers/polygonRouter";
import { alertsRouter } from "./routers/alertsRouter";
import { filterRouter } from "./routers/filterRouter";
import {
  getAssetsWithScores,
  getLatestMarketTrend,
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getAssetSentiment,
  getAssetById,
  getAssetByTicker,
  searchAssets,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  market: marketRouter,
  news: newsRouter,
  admin: adminRouter,
  notifications: notificationRouter,
  backtest: backtestRouter,
  realTime: realTimeRouter,
  historicalData: historicalDataRouter,
  strategyExport: strategyExportRouter,
  polygon: polygonRouter,
  alerts: alertsRouter,
  filters: filterRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // CAN SLIM Scanner routes
  assets: router({
    list: publicProcedure.query(async () => {
      return await getAssetsWithScores();
    }),
    detail: publicProcedure
      .input((val: any) => ({
        id: val.id as number | undefined,
        ticker: val.ticker as string | undefined,
      }))
      .query(async ({ input }) => {
        if (input.id) {
          return await getAssetById(input.id);
        }
        if (input.ticker) {
          return await getAssetByTicker(input.ticker);
        }
        return null;
      }),
    search: publicProcedure
      .input((val: any) => ({
        query: val.query as string,
      }))
      .query(async ({ input }) => {
        if (!input.query || input.query.length < 1) {
          return [];
        }
        return await searchAssets(input.query);
      }),
  }),

  watchlist: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserWatchlist(ctx.user.id);
    }),
    add: protectedProcedure
      .input((val: any) => ({
        assetId: val.assetId as number,
        alertThreshold: val.alertThreshold as number | undefined,
      }))
      .mutation(async ({ ctx, input }) => {
        return await addToWatchlist(
          ctx.user.id,
          input.assetId,
          input.alertThreshold
        );
      }),
    remove: protectedProcedure
      .input((val: any) => ({
        assetId: val.assetId as number,
      }))
      .mutation(async ({ ctx, input }) => {
        return await removeFromWatchlist(ctx.user.id, input.assetId);
      }),
  }),

  sentiment: router({
    getForAsset: publicProcedure
      .input((val: any) => ({
        assetId: val.assetId as number,
      }))
      .query(async ({ input }) => {
        return await getAssetSentiment(input.assetId);
      }),
  }),

  export: exportRouter,
});

export type AppRouter = typeof appRouter;
