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
import { backtestingRouter } from './routers/backtestingRouter';
import { socialTradingRouter } from './routers/socialTradingRouter';
import { tutorialRouter } from './routers/tutorialRouter';
import { paperTradingRouter } from './routers/paperTradingRouter';
import { strategyDataRouter } from './routers/strategyDataRouter';
import { realTimeRouter } from "./routers/realTimeRouter";
import { historicalDataRouter } from "./routers/historicalDataRouter";
import { strategyExportRouter } from "./routers/strategyExportRouter";
import { reportExportRouter } from "./routers/reportExportRouter";
import { websocketRouter } from "./routers/websocketRouter";
import { strategyComparisonRouter } from "./routers/strategyComparisonRouter";
import { polygonRouter } from "./routers/polygonRouter";
import { alertsRouter } from "./routers/alertsRouter";
import { filterRouter } from "./routers/filterRouter";
import { scannerRouter } from "./routers/scannerRouter";
import { portfolioRouter } from "./routers/portfolioRouter";
import { glassnodeRouter } from "./routers/glassnodeRouter";
import { coingeckoRouter } from "./routers/coingeckoRouter";
import { xtcomRouter } from "./routers/xtcomRouter";
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

import { strategyHistoryRouter } from './routers/strategyHistoryRouter';
import { recommendationsRouter } from './routers/recommendationsRouter';
import { binanceApiRouter } from './routers/binanceApiRouter';
import { exchangeRouter } from './routers/exchangeRouter';
import { backtestingEngineRouter } from './routers/backtestingEngineRouter';
import { parameterOptimizationRouter } from './routers/parameterOptimizationRouter';
import { socialRouter } from './routers/socialRouter';
import { communityRouter } from './routers/communityRouter';
import { schedulerRouter } from './routers/schedulerRouter';
import { solanaRouter } from './routers/solanaRouter';
import { pushNotificationRouter } from './routers/pushNotificationRouter';
import { nftAnalyticsRouter } from './routers/nftAnalyticsRouter';
import { mlPredictionRouter } from './routers/mlPredictionRouter';
import { tradingSignalRouter } from './routers/tradingSignalRouter';
import { portfolioManagementRouter } from './routers/portfolioManagementRouter';
import { alertRouter } from './routers/alertRouter';
import { sentimentRouter } from './routers/sentimentRouter';
import { autoTradingRouter } from './routers/autoTradingRouter';
import { defiIntegrationRouter } from './routers/defiIntegrationRouter';
import { socialCopyTradingRouter } from './routers/socialCopyTradingRouter';
import { nftPortfolioRouter } from './routers/nftPortfolioRouter';
import { telegramBotRouter } from './routers/telegramBotRouter';
import { emailNotificationRouter } from './routers/emailNotificationRouter';
import { portfolioRecommendationRouter } from './routers/portfolioRecommendationRouter';
import { walletIntegrationRouter } from './routers/walletIntegrationRouter';
import { emailDigestRouter } from './routers/emailDigestRouter';
import { backtestingAnalyticsRouter } from './routers/backtestingAnalyticsRouter';
import { cachingRouter } from './routers/cachingRouter';
import { riskManagementRouter } from './routers/riskManagementRouter';
import { notificationsManagementRouter } from './routers/notificationsManagementRouter';
import { performanceMonitoringRouter } from './routers/performanceMonitoringRouter';
import { portfolioRebalancingRouter } from './routers/portfolioRebalancingRouter';

export const appRouter = router({
  system: systemRouter,
  market: marketRouter,
  news: newsRouter,
  admin: adminRouter,
  notifications: notificationRouter,
  backtest: backtestRouter,
  backtesting: backtestingRouter,
  socialTrading: socialTradingRouter,
  tutorial: tutorialRouter,
  paperTrading: paperTradingRouter,
  strategyData: strategyDataRouter,
  realTime: realTimeRouter,
  historicalData: historicalDataRouter,
  strategyExport: strategyExportRouter,
  reportExport: reportExportRouter,
  websocket: websocketRouter,
  strategyComparison: strategyComparisonRouter,
  strategyHistory: strategyHistoryRouter,
  recommendations: recommendationsRouter,
  polygon: polygonRouter,
  alerts: alertsRouter,
  filters: filterRouter,
  scanner: scannerRouter,
  portfolio: portfolioRouter,
  glassnode: glassnodeRouter,
  coingecko: coingeckoRouter,
  xtcom: xtcomRouter,
  binanceApi: binanceApiRouter,
  exchange: exchangeRouter,
  backtestingEngine: backtestingEngineRouter,
  parameterOptimization: parameterOptimizationRouter,
  social: socialRouter,
  community: communityRouter,
  scheduler: schedulerRouter,
  tradingSignal: tradingSignalRouter,
  portfolioManagement: portfolioManagementRouter,
  alertsManagement: alertRouter,
  sentiment: sentimentRouter,
  mlPrediction: mlPredictionRouter,
  autoTrading: autoTradingRouter,
  defiIntegration: defiIntegrationRouter,
  socialCopyTrading: socialCopyTradingRouter,
  nftPortfolio: nftPortfolioRouter,
  telegramBot: telegramBotRouter,
  solana: solanaRouter,
  pushNotifications: pushNotificationRouter,
  nftAnalytics: nftAnalyticsRouter,
  emailNotifications: emailNotificationRouter,
  portfolioRecommendations: portfolioRecommendationRouter,
  walletIntegration: walletIntegrationRouter,
  emailDigests: emailDigestRouter,
  backtestingAnalytics: backtestingAnalyticsRouter,
  caching: cachingRouter,
  riskManagement: riskManagementRouter,
  notificationsManagement: notificationsManagementRouter,
  performanceMonitoring: performanceMonitoringRouter,
  portfolioRebalancing: portfolioRebalancingRouter,
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

  export: exportRouter,
});

export type AppRouter = typeof appRouter;
