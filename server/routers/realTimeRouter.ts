import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getCoinData,
  getMultipleCoins,
  getPriceHistory,
  getBitcoin200EMA,
  getGlobalData,
} from "../services/coingeckoService";
import {
  getAllProtocolsTVL,
  getProtocolTVL,
  getChainsTVL,
  getProtocolTVLHistory,
} from "../services/defiLlamaService";
import {
  getActiveAddresses,
  getWhaleActivity,
  getAddressMetrics,
  getTransactionVolume,
  getNetworkFees,
  checkGlassnodeStatus,
} from "../services/glassnodeService";

export const realTimeRouter = router({
  // CoinGecko endpoints
  coin: publicProcedure
    .input(z.object({ coinId: z.string() }))
    .query(async ({ input }) => {
      const data = await getCoinData(input.coinId);
      return data || { error: "Failed to fetch coin data" };
    }),

  multipleCoins: publicProcedure
    .input(z.object({ coinIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      return await getMultipleCoins(input.coinIds);
    }),

  priceHistory: publicProcedure
    .input(z.object({ coinId: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getPriceHistory(input.coinId, input.days);
    }),

  btc200EMA: publicProcedure.query(async () => {
    return await getBitcoin200EMA();
  }),

  globalData: publicProcedure.query(async () => {
    return await getGlobalData();
  }),

  // DefiLlama endpoints
  allProtocolsTVL: publicProcedure.query(async () => {
    return await getAllProtocolsTVL();
  }),

  protocolTVL: publicProcedure
    .input(z.object({ protocolSlug: z.string() }))
    .query(async ({ input }) => {
      const data = await getProtocolTVL(input.protocolSlug);
      return data || { error: "Failed to fetch protocol TVL" };
    }),

  chainsTVL: publicProcedure.query(async () => {
    return await getChainsTVL();
  }),

  protocolTVLHistory: publicProcedure
    .input(z.object({ protocolSlug: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getProtocolTVLHistory(input.protocolSlug, input.days);
    }),

  // Glassnode endpoints
  activeAddresses: publicProcedure
    .input(z.object({ asset: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getActiveAddresses(input.asset, input.days);
    }),

  whaleActivity: publicProcedure
    .input(z.object({ asset: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getWhaleActivity(input.asset, input.days);
    }),

  addressMetrics: publicProcedure
    .input(z.object({ asset: z.string() }))
    .query(async ({ input }) => {
      return await getAddressMetrics(input.asset);
    }),

  transactionVolume: publicProcedure
    .input(z.object({ asset: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getTransactionVolume(input.asset, input.days);
    }),

  networkFees: publicProcedure
    .input(z.object({ asset: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getNetworkFees(input.asset, input.days);
    }),

  glassnodeStatus: publicProcedure.query(async () => {
    const isAvailable = await checkGlassnodeStatus();
    return { available: isAvailable };
  }),
});
