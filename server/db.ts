import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, cryptoAssets, canslimScores, watchlist, sentimentAnalysis, marketTrend, alertConditions, alertHistory, AlertCondition, InsertAlertCondition, AlertHistory, InsertAlertHistory, backtests, Backtest, InsertBacktest, traders, Trader, InsertTrader, copiedTrades, CopiedTrade, InsertCopiedTrade, traderFollowers, TraderFollower, InsertTraderFollower, dayTradingSignals, DayTradingSignal, InsertDayTradingSignal, dayTradingPositions, DayTradingPosition, InsertDayTradingPosition, solanaPortfolios, SolanaPortfolio, InsertSolanaPortfolio, solanaCollections, SolanaCollection, InsertSolanaCollection, paperTradingMonitors } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Cron callbacks are resolved exclusively through their platform task UID,
 * never through request body data or a user-provided monitor identifier.
 */
export async function getPaperTradingMonitorByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(paperTradingMonitors)
    .where(eq(paperTradingMonitors.scheduleCronTaskUid, taskUid))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get all crypto assets with their latest CAN SLIM scores
 */
export async function getAssetsWithScores() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(cryptoAssets);

  return result;
}

/**
 * Get latest market trend
 */
export async function getLatestMarketTrend() {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(marketTrend)
    .orderBy((t) => desc(t.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get user's watchlist with asset details
 */
export async function getUserWatchlist(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(watchlist)
    .where(eq(watchlist.userId, userId));

  return result;
}

/**
 * Add asset to user's watchlist
 */
export async function addToWatchlist(
  userId: number,
  assetId: number,
  alertThreshold?: number
) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(watchlist).values({
    userId,
    assetId,
    alertThreshold,
  });

  return { success: true };
}

/**
 * Remove asset from watchlist
 */
export async function removeFromWatchlist(
  userId: number,
  assetId: number
) {
  const db = await getDb();
  if (!db) return null;

  await db
    .delete(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.assetId, assetId)));

  return { success: true };
}

/**
 * Get a single asset by ID
 */
export async function getAssetById(assetId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(cryptoAssets)
    .where(eq(cryptoAssets.id, assetId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get a single asset by ticker
 */
export async function getAssetByTicker(ticker: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(cryptoAssets)
    .where(eq(cryptoAssets.ticker, ticker))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Search assets by name or ticker
 */
export async function searchAssets(query: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(cryptoAssets);

  return result.filter(
    (asset) =>
      asset.ticker.toLowerCase().includes(query.toLowerCase()) ||
      asset.name.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Get sentiment analysis for an asset
 */
export async function getAssetSentiment(assetId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(sentimentAnalysis)
    .where(eq(sentimentAnalysis.assetId, assetId))
    .orderBy((s) => desc(s.analyzedAt))
    .limit(10);

  return result;
}

/**
 * Get all alert conditions for a user
 */
export async function getUserAlertConditions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(alertConditions)
    .where(eq(alertConditions.userId, userId))
    .orderBy((a) => desc(a.createdAt));

  return result;
}

/**
 * Get alert conditions for a specific asset
 */
export async function getAssetAlertConditions(userId: number, assetId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(alertConditions)
    .where(and(eq(alertConditions.userId, userId), eq(alertConditions.assetId, assetId)));

  return result;
}

/**
 * Create a new alert condition
 */
export async function createAlertCondition(data: InsertAlertCondition) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(alertConditions).values(data);
  return result;
}

/**
 * Update an alert condition
 */
export async function updateAlertCondition(conditionId: number, data: Partial<AlertCondition>) {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(alertConditions)
    .set(data)
    .where(eq(alertConditions.id, conditionId));

  return { success: true };
}

/**
 * Delete an alert condition
 */
export async function deleteAlertCondition(conditionId: number) {
  const db = await getDb();
  if (!db) return null;

  await db
    .delete(alertConditions)
    .where(eq(alertConditions.id, conditionId));

  return { success: true };
}

/**
 * Get alert history for a user
 */
export async function getUserAlertHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(alertHistory)
    .where(eq(alertHistory.userId, userId))
    .orderBy((h) => desc(h.createdAt))
    .limit(limit);

  return result;
}

/**
 * Record an alert trigger in history
 */
export async function recordAlertTrigger(data: InsertAlertHistory) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(alertHistory).values(data);
  return result;
}
