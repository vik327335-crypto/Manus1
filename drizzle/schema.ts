import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * CAN SLIM Crypto Assets
 * Stores cryptocurrency projects with their fundamental data
 */
export const cryptoAssets = mysqlTable("crypto_assets", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 20 }).notNull().unique(), // BTC, ETH, SOL, etc.
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logo: varchar("logo", { length: 512 }), // CDN URL
  category: varchar("category", { length: 64 }), // Layer1, Layer2, DeFi, AI, Gaming, etc.
  marketCap: int("marketCap"), // in millions
  currentPrice: int("currentPrice"), // in cents (1 = $0.01)
  priceChange24h: int("priceChange24h"), // in basis points (-1000 = -10%)
  volume24h: int("volume24h"), // in millions
  circulatingSupply: varchar("circulatingSupply", { length: 64 }),
  totalSupply: varchar("totalSupply", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CryptoAsset = typeof cryptoAssets.$inferSelect;
export type InsertCryptoAsset = typeof cryptoAssets.$inferInsert;

/**
 * CAN SLIM Scores
 * Individual scores for each CAN SLIM criterion per asset
 */
export const canslimScores = mysqlTable("canslim_scores", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull().references(() => cryptoAssets.id),
  // C: Current Growth (0-100)
  cScore: int("cScore").default(0),
  cReason: text("cReason"), // Why this score
  // A: Annual Growth (0-100)
  aScore: int("aScore").default(0),
  aReason: text("aReason"),
  // N: New Catalysts (0-100)
  nScore: int("nScore").default(0),
  nReason: text("nReason"),
  // S: Supply Dynamics (0-100)
  sScore: int("sScore").default(0),
  sReason: text("sReason"),
  // L: Relative Strength (0-100)
  lScore: int("lScore").default(0),
  lReason: text("lReason"),
  // I: Institutional Support (0-100)
  iScore: int("iScore").default(0),
  iReason: text("iReason"),
  // M: Market Trend (0-100)
  mScore: int("mScore").default(0),
  mReason: text("mReason"),
  // Overall score (average of all)
  totalScore: int("totalScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CanslimScore = typeof canslimScores.$inferSelect;
export type InsertCanslimScore = typeof canslimScores.$inferInsert;

/**
 * User Watchlist
 * Track favorite assets per user
 */
export const watchlist = mysqlTable("watchlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  assetId: int("assetId").notNull().references(() => cryptoAssets.id),
  alertThreshold: int("alertThreshold"), // Alert when score drops below this
  notes: text("notes"),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type Watchlist = typeof watchlist.$inferSelect;
export type InsertWatchlist = typeof watchlist.$inferInsert;

/**
 * Sentiment Analysis Results
 * Stores AI-analyzed news sentiment for catalyst detection
 */
export const sentimentAnalysis = mysqlTable("sentiment_analysis", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull().references(() => cryptoAssets.id),
  source: varchar("source", { length: 64 }), // twitter, news, reddit, etc.
  catalyst: varchar("catalyst", { length: 255 }), // mainnet launch, partnership, listing, etc.
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).notNull(),
  confidence: int("confidence"), // 0-100
  summary: text("summary"),
  sourceUrl: varchar("sourceUrl", { length: 512 }),
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
});

export type SentimentAnalysis = typeof sentimentAnalysis.$inferSelect;
export type InsertSentimentAnalysis = typeof sentimentAnalysis.$inferInsert;

/**
 * Market Trend Status
 * Global market indicators updated periodically
 */
export const marketTrend = mysqlTable("market_trend", {
  id: int("id").autoincrement().primaryKey(),
  btcPrice: int("btcPrice"), // in cents
  btc200EMA: int("btc200EMA"), // in cents
  btcAbove200EMA: int("btcAbove200EMA"), // 1 = above, 0 = below
  dominance: int("dominance"), // BTC dominance in basis points (5000 = 50%)
  fearGreedIndex: int("fearGreedIndex"), // 0-100
  stablecoinInflow: int("stablecoinInflow"), // in millions
  status: mysqlEnum("status", ["bullish", "neutral", "bearish"]).default("neutral"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketTrend = typeof marketTrend.$inferSelect;
export type InsertMarketTrend = typeof marketTrend.$inferInsert;