import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { exchangeApiKeys, exchangeBalances as _exchangeBalances } from "../../drizzle/schema";
import { eq, and as _and } from "drizzle-orm";
import BinanceApiService from "../services/binanceApiService";
import CoinbaseApiService from "../services/coinbaseApiService";
import KrakenApiService from "../services/krakenApiService";

/**
 * Exchange Router
 * Unified interface for multiple crypto exchanges
 */

type ExchangeType = "binance" | "coinbase" | "kraken";

interface ExchangePrice {
  exchange: ExchangeType;
  symbol: string;
  price: number;
  timestamp: number;
}

interface ExchangeBalance {
  exchange: ExchangeType;
  asset: string;
  free: string;
  locked: string;
  total: string;
  usdValue?: number;
}

export const exchangeRouter = router({
  /**
   * Get price from a specific exchange
   */
  getPriceFromExchange: publicProcedure
    .input(
      z.object({
        exchange: z.enum(["binance", "coinbase", "kraken"]),
        symbol: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        let price = 0;

        if (input.exchange === "binance") {
          const service = new BinanceApiService({
            apiKey: "",
            apiSecret: "",
          });
          price = await service.getSymbolPrice(input.symbol);
        } else if (input.exchange === "coinbase") {
          const service = new CoinbaseApiService({
            apiKey: "",
            apiSecret: "",
            passphrase: "",
          });
          price = await service.getProductPrice(input.symbol);
        } else if (input.exchange === "kraken") {
          const service = new KrakenApiService({
            apiKey: "",
            apiSecret: "",
          });
          price = await service.getPairPrice(input.symbol);
        }

        return {
          exchange: input.exchange,
          symbol: input.symbol,
          price,
          timestamp: Date.now(),
        } as ExchangePrice;
      } catch (error) {
        console.error(
          `Error fetching price from ${input.exchange}:`,
          error
        );
        throw new Error(
          `Failed to fetch price from ${input.exchange}`
        );
      }
    }),

  /**
   * Get prices from multiple exchanges
   */
  getPricesFromMultipleExchanges: publicProcedure
    .input(
      z.object({
        exchanges: z.array(z.enum(["binance", "coinbase", "kraken"])),
        symbol: z.string(),
      })
    )
    .query(async ({ input }) => {
      const prices: ExchangePrice[] = [];

      for (const exchange of input.exchanges) {
        try {
          let price = 0;

          if (exchange === "binance") {
            const service = new BinanceApiService({
              apiKey: "",
              apiSecret: "",
            });
            price = await service.getSymbolPrice(input.symbol);
          } else if (exchange === "coinbase") {
            const service = new CoinbaseApiService({
              apiKey: "",
              apiSecret: "",
              passphrase: "",
            });
            price = await service.getProductPrice(input.symbol);
          } else if (exchange === "kraken") {
            const service = new KrakenApiService({
              apiKey: "",
              apiSecret: "",
            });
            price = await service.getPairPrice(input.symbol);
          }

          prices.push({
            exchange,
            symbol: input.symbol,
            price,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error(
            `Error fetching price from ${exchange}:`,
            error
          );
        }
      }

      return prices;
    }),

  /**
   * Get account balance from all connected exchanges
   */
  getAllBalances: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const credentials = await db
      .select()
      .from(exchangeApiKeys)
      .where(eq(exchangeApiKeys.userId, ctx.user.id));

    const allBalances: Record<ExchangeType, ExchangeBalance[]> = {
      binance: [],
      coinbase: [],
      kraken: [],
    };

    for (const cred of credentials) {
      try {
        const exchange = cred.exchange as ExchangeType;

        if (exchange === "binance") {
          const service = new BinanceApiService({
            apiKey: cred.apiKey,
            apiSecret: cred.apiSecret,
          });

          const accountInfo = await service.getAccountBalance();
          const balances = accountInfo.balances.filter(
            (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
          );

          allBalances.binance = balances.map((b) => ({
            exchange: "binance",
            asset: b.asset,
            free: b.free,
            locked: b.locked,
            total: (parseFloat(b.free) + parseFloat(b.locked)).toString(),
          }));
        } else if (exchange === "coinbase") {
          const service = new CoinbaseApiService({
            apiKey: cred.apiKey,
            apiSecret: cred.apiSecret,
            passphrase: cred.passphrase || "",
          });

          const accounts = await service.getAccounts();
          const balances = accounts.filter(
            (a) => parseFloat(a.balance) > 0
          );

          allBalances.coinbase = balances.map((a) => ({
            exchange: "coinbase",
            asset: a.currency,
            free: a.available,
            locked: a.hold,
            total: a.balance,
          }));
        } else if (exchange === "kraken") {
          const service = new KrakenApiService({
            apiKey: cred.apiKey,
            apiSecret: cred.apiSecret,
          });

          const balance = await service.getBalance();
          const balances: ExchangeBalance[] = [];

          for (const [asset, amount] of Object.entries(balance)) {
            if (parseFloat(amount as string) > 0) {
              balances.push({
                exchange: "kraken",
                asset,
                free: amount as string,
                locked: "0",
                total: amount as string,
              });
            }
          }

          allBalances.kraken = balances;
        }
      } catch (error) {
        console.error(`Error fetching balance from ${cred.exchange}:`, error);
      }
    }

    return allBalances;
  }),

  /**
   * Compare prices across exchanges
   */
  comparePrices: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
      })
    )
    .query(async ({ input }) => {
      const exchanges: ExchangeType[] = ["binance", "coinbase", "kraken"];
      const prices: ExchangePrice[] = [];

      for (const exchange of exchanges) {
        try {
          let price = 0;

          if (exchange === "binance") {
            const service = new BinanceApiService({
              apiKey: "",
              apiSecret: "",
            });
            price = await service.getSymbolPrice(input.symbol);
          } else if (exchange === "coinbase") {
            const service = new CoinbaseApiService({
              apiKey: "",
              apiSecret: "",
              passphrase: "",
            });
            price = await service.getProductPrice(input.symbol);
          } else if (exchange === "kraken") {
            const service = new KrakenApiService({
              apiKey: "",
              apiSecret: "",
            });
            price = await service.getPairPrice(input.symbol);
          }

          prices.push({
            exchange,
            symbol: input.symbol,
            price,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error(
            `Error fetching price from ${exchange}:`,
            error
          );
        }
      }

      // Calculate statistics
      const validPrices = prices.filter((p) => p.price > 0);
      if (validPrices.length === 0) {
        throw new Error("No prices available");
      }

      const avgPrice =
        validPrices.reduce((sum, p) => sum + p.price, 0) /
        validPrices.length;
      const minPrice = Math.min(...validPrices.map((p) => p.price));
      const maxPrice = Math.max(...validPrices.map((p) => p.price));
      const spread = ((maxPrice - minPrice) / avgPrice) * 100;

      return {
        symbol: input.symbol,
        prices,
        statistics: {
          averagePrice: avgPrice,
          minPrice,
          maxPrice,
          spread: spread.toFixed(2),
        },
      };
    }),

  /**
   * Get arbitrage opportunities
   */
  getArbitrageOpportunities: publicProcedure
    .input(
      z.object({
        symbols: z.array(z.string()),
        minSpread: z.number().default(0.5), // minimum 0.5% spread
      })
    )
    .query(async ({ input }) => {
      const opportunities = [];

      for (const symbol of input.symbols) {
        try {
          const exchanges: ExchangeType[] = ["binance", "coinbase", "kraken"];
          const prices: ExchangePrice[] = [];

          for (const exchange of exchanges) {
            try {
              let price = 0;

              if (exchange === "binance") {
                const service = new BinanceApiService({
                  apiKey: "",
                  apiSecret: "",
                });
                price = await service.getSymbolPrice(symbol);
              } else if (exchange === "coinbase") {
                const service = new CoinbaseApiService({
                  apiKey: "",
                  apiSecret: "",
                  passphrase: "",
                });
                price = await service.getProductPrice(symbol);
              } else if (exchange === "kraken") {
                const service = new KrakenApiService({
                  apiKey: "",
                  apiSecret: "",
                });
                price = await service.getPairPrice(symbol);
              }

              prices.push({
                exchange,
                symbol,
                price,
                timestamp: Date.now(),
              });
            } catch (_error) {
              // Skip this exchange if price fetch fails
            }
          }

          if (prices.length >= 2) {
            const avgPrice =
              prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
            const minPrice = Math.min(...prices.map((p) => p.price));
            const maxPrice = Math.max(...prices.map((p) => p.price));
            const spread = ((maxPrice - minPrice) / avgPrice) * 100;

            if (spread >= input.minSpread) {
              const buyExchange = prices.find((p) => p.price === minPrice);
              const sellExchange = prices.find((p) => p.price === maxPrice);

              opportunities.push({
                symbol,
                spread: spread.toFixed(2),
                buyExchange: buyExchange?.exchange,
                buyPrice: minPrice,
                sellExchange: sellExchange?.exchange,
                sellPrice: maxPrice,
                profit: (maxPrice - minPrice).toFixed(2),
              });
            }
          }
        } catch (error) {
          console.error(`Error checking arbitrage for ${symbol}:`, error);
        }
      }

      return opportunities;
    }),
});

export default exchangeRouter;
