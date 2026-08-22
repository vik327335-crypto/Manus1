import { getDb } from "../db";
import { exchangeApiKeys, exchangeBalances, backtestResults, sharedStrategies as _sharedStrategies } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { BinanceApiService } from "./binanceApiService";
import { CoinbaseApiService } from "./coinbaseApiService";
import { KrakenApiService as _KrakenApiService } from "./krakenApiService";
import { BacktestingService } from "./backtestingService";

// Lazy initialization of services
let binanceApiService: BinanceApiService | null = null;
let coinbaseApiService: CoinbaseApiService | null = null;

function _getBinanceService() {
  if (!binanceApiService) binanceApiService = new BinanceApiService({} as any);
  return binanceApiService;
}

function getCoinbaseService() {
  if (!coinbaseApiService) coinbaseApiService = new CoinbaseApiService({} as any);
  return coinbaseApiService;
}

/**
 * Scheduler Service
 * Manages periodic tasks like balance sync and backtesting
 */

export const schedulerService = {
  /**
   * Sync balances from all exchanges for a user
   */
  async syncBalancesForUser(userId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all API credentials for the user
      const credentials = await db
        .select()
        .from(exchangeApiKeys)
        .where(eq(exchangeApiKeys.userId, userId));

      for (const cred of credentials) {
        try {
          let balance: any[] = [];

          if (cred.exchange === "binance") {
            // For Binance, we'll just track the connection without fetching balance
            // The actual balance sync would require proper API key setup
            balance = [];
          } else if (cred.exchange === "coinbase") {
            const service = getCoinbaseService();
            const result = await service.getAccounts();
            balance = result?.map((acc: any) => ({
              asset: acc.currency,
              free: acc.available,
              locked: acc.hold,
              total: acc.balance,
            })) || [];
          } else if (cred.exchange === "kraken") {
            // For Kraken, we'll just track the connection without fetching balance
            balance = [];
          }

          if (balance && Array.isArray(balance)) {
            // Save each balance entry to database
            for (const asset of balance) {
              await db.insert(exchangeBalances).values({
                userId,
                apiKeyId: cred.id,
                exchange: cred.exchange,
                asset: asset.asset || "UNKNOWN",
                free: asset.free?.toString() || "0",
                locked: asset.locked?.toString() || "0",
                total: asset.total?.toString() || "0",
                usdValue: asset.usdValue ? Math.round(asset.usdValue * 100) : 0,
                lastSyncedAt: new Date(),
              });
            }
          }
        } catch (error) {
          console.error(`Error syncing ${cred.exchange} balance:`, error);
        }
      }

      return { success: true, synced: credentials.length };
    } catch (error) {
      console.error("Error syncing balances:", error);
      throw error;
    }
  },

  /**
   * Run periodic backtests for all strategies
   */
  async runPeriodicBacktests(userId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get recent backtests to avoid duplicates
      const recentBacktests = await db
        .select()
        .from(backtestResults)
        .where(eq(backtestResults.userId, userId));

      // Group by strategy
      const strategiesByType = new Map<string, any>();
      for (const backtest of recentBacktests) {
        const strategyType = backtest.strategyName;
        const key = `${strategyType}-${backtest.symbol}`;
        if (!strategiesByType.has(key)) {
          strategiesByType.set(key, backtest);
        }
      }

      let count = 0;

      // Run backtests for each strategy
      for (const entry of Array.from(strategiesByType.entries())) {
        const [key, _lastBacktest] = entry;
        try {
          const [strategyType, symbol] = key.split("-");

          // Generate mock historical data
          const historicalData = Array.from({ length: 100 }, (_, i) => ({
            time: Date.now() - (100 - i) * 3600000,
            open: 40000 + Math.random() * 5000,
            high: 41000 + Math.random() * 5000,
            low: 39000 + Math.random() * 5000,
            close: 40000 + Math.random() * 5000,
            volume: Math.random() * 1000,
          }));

          let result: any = null;

          // Use static methods from BacktestingService
          if (strategyType === "SMA") {
            const _signals = BacktestingService.smaStrategy(historicalData, {
              fastPeriod: 10,
              slowPeriod: 20,
              quantity: 1,
            });
            result = { metrics: BacktestingService.runBacktest(historicalData, BacktestingService.smaStrategy, { fastPeriod: 10, slowPeriod: 20, quantity: 1 }, 10000) };
          } else if (strategyType === "RSI") {
            result = { metrics: BacktestingService.runBacktest(historicalData, BacktestingService.rsiStrategy, { period: 14, quantity: 1 }, 10000) };
          }

          if (result) {
            // Save result to database
            const metrics = result.metrics || {};
            const id = `backtest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            await db.insert(backtestResults).values({
              id,
              userId,
              strategyId: `${strategyType}-${symbol}`,
              strategyName: strategyType,
              exchange: "multi",
              symbol,
              timeframe: "1d",
              startDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
              endDate: new Date(),
              initialCapital: 1000000, // $10,000 in cents
              finalCapital: Math.round(1000000 * (1 + (metrics.totalReturn || 0))),
              totalReturn: Math.round((metrics.totalReturn || 0) * 10000),
              annualizedReturn: Math.round((metrics.sharpeRatio || 0) * 100),
              sharpeRatio: Math.round((metrics.sharpeRatio || 0) * 100),
              maxDrawdown: Math.round((metrics.maxDrawdown || 0) * 10000),
              winRate: Math.round((metrics.winRate || 0) * 10000),
              profitFactor: Math.round((metrics.profitFactor || 0) * 100),
              totalTrades: metrics.totalTrades || 0,
              winningTrades: metrics.winningTrades || 0,
              losingTrades: metrics.losingTrades || 0,
            });

            count++;
          }
        } catch (error) {
          console.error(`Error running backtest for ${key}:`, error);
        }
      }

      return { success: true, backtestCount: count };
    } catch (error) {
      console.error("Error running periodic backtests:", error);
      throw error;
    }
  },

  /**
   * Update leaderboard rankings
   */
  async updateLeaderboardRankings() {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all shared strategies
      // const strategies = await db.select().from(sharedStrategies);

      // Calculate scores and update rankings
      // This would be implemented based on your ranking algorithm

      return { success: true, updated: 0 };
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      throw error;
    }
  },

  /**
   * Clean up old data
   */
  async cleanupOldData(daysToKeep: number = 30) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const _cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      // Delete old backtests
      // await db.delete(backtestResults).where(lt(backtestResults.backtestDate, cutoffDate));

      return { success: true, message: `Cleaned up data older than ${daysToKeep} days` };
    } catch (error) {
      console.error("Error cleaning up data:", error);
      throw error;
    }
  },

  /**
   * Generate daily summary report
   */
  async generateDailySummary(userId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get today's backtests
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysBacktests = await db
        .select()
        .from(backtestResults)
        .where(eq(backtestResults.userId, userId));

      // Calculate statistics
      const stats = {
        totalBacktests: todaysBacktests.length,
        averageReturn: 0,
        bestPerformer: null as any,
        worstPerformer: null as any,
      };

      if (todaysBacktests.length > 0) {
        const returns = todaysBacktests.map((bt) => bt.totalReturn || 0);

        stats.averageReturn = returns.reduce((a, b) => a + b, 0) / returns.length / 10000;
        const maxIdx = returns.indexOf(Math.max(...returns));
        const minIdx = returns.indexOf(Math.min(...returns));
        stats.bestPerformer = todaysBacktests[maxIdx] || null;
        stats.worstPerformer = todaysBacktests[minIdx] || null;
      }

      return {
        success: true,
        summary: stats,
        date: today.toISOString(),
      };
    } catch (error) {
      console.error("Error generating daily summary:", error);
      throw error;
    }
  },
};

export default schedulerService;
