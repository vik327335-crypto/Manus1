import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { exchangeApiKeys, exchangeBalances, ExchangeApiKey } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import BinanceApiService from "../services/binanceApiService";

/**
 * Binance API Router
 * Handles all Binance API integrations
 */

export const binanceApiRouter = router({
  /**
   * Add Binance API credentials
   */
  addApiCredentials: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        apiSecret: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Validate credentials by making a test request
        const service = new BinanceApiService({
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
        });

        // Test the credentials
        await service.getAccountBalance();

        // Store the credentials
        await db.insert(exchangeApiKeys).values({
          userId: ctx.user.id,
          exchange: "binance",
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
          isActive: 1,
        });

        return {
          success: true,
          message: "API credentials added successfully",
        };
      } catch (error) {
        console.error("Error adding Binance API credentials:", error);
        throw new Error("Failed to validate or store API credentials");
      }
    }),

  /**
   * Get all API credentials for user
   */
  getApiCredentials: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const credentials = await db
      .select()
      .from(exchangeApiKeys)
      .where(
        and(
          eq(exchangeApiKeys.userId, ctx.user.id),
          eq(exchangeApiKeys.exchange, "binance")
        )
      );

    return credentials.map((cred) => ({
      id: cred.id,
      exchange: cred.exchange,
      isActive: cred.isActive,
      createdAt: cred.createdAt,
      lastUsedAt: cred.lastUsedAt,
    }));
  }),

  /**
   * Remove API credentials
   */
  removeApiCredentials: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(exchangeApiKeys)
        .where(
          and(
            eq(exchangeApiKeys.id, input.id),
            eq(exchangeApiKeys.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get current price for a symbol
   */
  getSymbolPrice: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      try {
        const service = new BinanceApiService({
          apiKey: "",
          apiSecret: "",
        });

        const price = await service.getSymbolPrice(input.symbol);
        return { symbol: input.symbol, price };
      } catch (error) {
        console.error("Error fetching symbol price:", error);
        throw new Error("Failed to fetch symbol price");
      }
    }),

  /**
   * Get klines (candlestick) data
   */
  getSymbolKlines: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        interval: z.string().default("1h"),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const service = new BinanceApiService({
          apiKey: "",
          apiSecret: "",
        });

        const klines = await service.getSymbolKlines(
          input.symbol,
          input.interval,
          input.limit
        );

        return { symbol: input.symbol, klines };
      } catch (error) {
        console.error("Error fetching klines:", error);
        throw new Error("Failed to fetch klines data");
      }
    }),

  /**
   * Get account balance (requires API credentials)
   */
  getAccountBalance: protectedProcedure
    .input(z.object({ apiKeyId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get API credentials
        const credentials = await db
          .select()
          .from(exchangeApiKeys)
          .where(
            and(
              eq(exchangeApiKeys.id, input.apiKeyId),
              eq(exchangeApiKeys.userId, ctx.user.id)
            )
          );

        if (credentials.length === 0) {
          throw new Error("API credentials not found");
        }

        const cred: ExchangeApiKey = credentials[0];
        const service = new BinanceApiService({
          apiKey: cred.apiKey,
          apiSecret: cred.apiSecret,
        });

        const accountInfo = await service.getAccountBalance();

        // Update last used timestamp
        await db
          .update(exchangeApiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(exchangeApiKeys.id, input.apiKeyId)).execute();

        return accountInfo;
      } catch (error) {
        console.error("Error fetching account balance:", error);
        throw new Error("Failed to fetch account balance");
      }
    }),

  /**
   * Sync account balances to database
   */
  syncBalances: protectedProcedure
    .input(z.object({ apiKeyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get API credentials
        const credentials = await db
          .select()
          .from(exchangeApiKeys)
          .where(
            and(
              eq(exchangeApiKeys.id, input.apiKeyId),
              eq(exchangeApiKeys.userId, ctx.user.id)
            )
          );

        if (credentials.length === 0) {
          throw new Error("API credentials not found");
        }

        const cred: ExchangeApiKey = credentials[0];
        const service = new BinanceApiService({
          apiKey: cred.apiKey,
          apiSecret: cred.apiSecret,
        });

        const accountInfo = await service.getAccountBalance();
        const now = new Date();

        // Get prices for USD conversion
        const balances = accountInfo.balances.filter(
          (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
        );

        // Store balances
        for (const balance of balances) {
          // Get price for USD conversion
          let usdValue = 0;
          if (balance.asset !== "USDT" && balance.asset !== "BUSD") {
            try {
              const price = await service.getSymbolPrice(
                `${balance.asset}USDT`
              );
              const total = parseFloat(balance.free) + parseFloat(balance.locked);
              usdValue = Math.round(total * price * 100);
            } catch (e) {
              // If price fetch fails, skip USD value
            }
          } else {
            const total = parseFloat(balance.free) + parseFloat(balance.locked);
            usdValue = Math.round(total * 100);
          }

          // Delete existing balance first
          await db
            .delete(exchangeBalances)
            .where(
              and(
                eq(exchangeBalances.userId, ctx.user.id),
                eq(exchangeBalances.apiKeyId, input.apiKeyId),
                eq(exchangeBalances.asset, balance.asset)
              )
            );

          // Insert new balance
          await db
            .insert(exchangeBalances)
            .values({
              userId: ctx.user.id,
              apiKeyId: input.apiKeyId,
              exchange: "binance",
              asset: balance.asset,
              free: balance.free,
              locked: balance.locked,
              total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
              usdValue,
              lastSyncedAt: now,
            });
        }

        return { success: true, balanceCount: balances.length };
      } catch (error) {
        console.error("Error syncing balances:", error);
        throw new Error("Failed to sync balances");
      }
    }),

  /**
   * Get synced balances from database
   */
  getSyncedBalances: protectedProcedure
    .input(z.object({ apiKeyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const balances = await db
        .select()
        .from(exchangeBalances)
        .where(
          and(
            eq(exchangeBalances.userId, ctx.user.id),
            eq(exchangeBalances.apiKeyId, input.apiKeyId)
          )
        );

      return balances;
    }),

  /**
   * Get 24h ticker data
   */
  get24hTicker: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      try {
        const service = new BinanceApiService({
          apiKey: "",
          apiSecret: "",
        });

        const ticker = await service.get24hTicker(input.symbol);
        return ticker;
      } catch (error) {
        console.error("Error fetching 24h ticker:", error);
        throw new Error("Failed to fetch 24h ticker");
      }
    }),

  /**
   * Get exchange info
   */
  getExchangeInfo: publicProcedure.query(async () => {
    try {
      const service = new BinanceApiService({
        apiKey: "",
        apiSecret: "",
      });

      const info = await service.getExchangeInfo();
      return info;
    } catch (error) {
      console.error("Error fetching exchange info:", error);
      throw new Error("Failed to fetch exchange info");
    }
  }),
});

export default binanceApiRouter;
