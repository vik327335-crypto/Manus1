import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

/**
 * Alert Conditions
 * Define conditions for real-time alerts on watchlist items
 */
export const alertConditions = mysqlTable("alert_conditions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  assetId: int("assetId").notNull().references(() => cryptoAssets.id),
  // Alert types
  alertType: mysqlEnum("alertType", [
    "price_above",
    "price_below",
    "price_change_percent",
    "score_above",
    "score_below",
    "volume_surge",
    "sentiment_change",
  ]).notNull(),
  // Threshold values
  threshold: int("threshold"), // Price in cents, score 0-100, volume in millions, etc.
  secondaryThreshold: int("secondaryThreshold"), // For range conditions
  // Configuration
  enabled: int("enabled").default(1), // 1 = enabled, 0 = disabled
  notifyEmail: int("notifyEmail").default(1), // 1 = send email
  notifyPush: int("notifyPush").default(1), // 1 = send push notification
  notifyWebsocket: int("notifyWebsocket").default(1), // 1 = send websocket alert
  // Cooldown to avoid spam (in minutes)
  cooldownMinutes: int("cooldownMinutes").default(60),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  // Metadata
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertCondition = typeof alertConditions.$inferSelect;
export type InsertAlertCondition = typeof alertConditions.$inferInsert;

/**
 * Alert History
 * Track triggered alerts for history and debugging
 */
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  conditionId: int("conditionId").notNull().references(() => alertConditions.id),
  userId: int("userId").notNull().references(() => users.id),
  assetId: int("assetId").notNull().references(() => cryptoAssets.id),
  // Alert details
  alertType: varchar("alertType", { length: 64 }).notNull(),
  message: text("message"),
  // Trigger values
  triggerValue: int("triggerValue"), // Actual value that triggered the alert
  thresholdValue: int("thresholdValue"), // Threshold that was set
  // Notification status
  emailSent: int("emailSent").default(0),
  pushSent: int("pushSent").default(0),
  websocketSent: int("websocketSent").default(0),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

/**
 * User Portfolios
 * Stores user's crypto portfolios
 */
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAllocation: json("targetAllocation").$type<Record<string, number>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

/**
 * Portfolio Holdings
 * Stores individual holdings in a portfolio
 */
export const portfolioHoldings = mysqlTable("portfolio_holdings", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  ticker: varchar("ticker", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: int("quantity"), // stored as integer (multiply by 10000 for decimals)
  entryPrice: int("entryPrice"), // in cents
  currentPrice: int("currentPrice"), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type InsertPortfolioHolding = typeof portfolioHoldings.$inferInsert;

/**
 * Scan Results
 * Stores results of CAN SLIM scans
 */
export const scanResults = mysqlTable("scan_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scanName: varchar("scanName", { length: 255 }).notNull(),
  minScore: int("minScore"),
  maxScore: int("maxScore"),
  minMarketCap: int("minMarketCap"),
  maxMarketCap: int("maxMarketCap"),
  minVolume24h: int("minVolume24h"),
  maxVolume24h: int("maxVolume24h"),
  resultCount: int("resultCount"),
  results: json("results").$type<Array<any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScanResult = typeof scanResults.$inferSelect;
export type InsertScanResult = typeof scanResults.$inferInsert;

/**
 * Backtesting Results
 * Stores results of strategy backtests
 */
export const backtests = mysqlTable("backtests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  strategyId: varchar("strategyId", { length: 255 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  initialCapital: int("initialCapital").notNull(), // in cents
  totalReturn: int("totalReturn").notNull(), // basis points (10000 = 100%)
  annualizedReturn: int("annualizedReturn"),
  sharpeRatio: int("sharpeRatio").notNull(), // multiplied by 100
  maxDrawdown: int("maxDrawdown").notNull(), // basis points
  winRate: int("winRate").notNull(), // basis points (10000 = 100%)
  profitFactor: int("profitFactor").notNull(), // multiplied by 100
  totalTrades: int("totalTrades").notNull(),
  winningTrades: int("winningTrades").notNull(),
  losingTrades: int("losingTrades").notNull(),
  averageWin: int("averageWin"), // in cents
  averageLoss: int("averageLoss"), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = typeof backtests.$inferInsert;

/**
 * Social Trading - Traders
 * Stores trader profiles for social trading feature
 */
export const traders = mysqlTable("traders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  avatar: varchar("avatar", { length: 512 }),
  winRate: int("winRate").notNull(), // basis points (10000 = 100%)
  totalTrades: int("totalTrades").notNull(),
  profitableTrades: int("profitableTrades").notNull(),
  avgReturn: int("avgReturn").notNull(), // basis points
  maxDrawdown: int("maxDrawdown").notNull(), // basis points
  followers: int("followers").default(0).notNull(),
  copiedTrades: int("copiedTrades").default(0).notNull(),
  rating: int("rating").notNull(), // 1-5 stars * 100
  verified: int("verified").default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trader = typeof traders.$inferSelect;
export type InsertTrader = typeof traders.$inferInsert;

/**
 * Social Trading - Copied Trades
 * Tracks trades copied from other traders
 */
export const copiedTrades = mysqlTable("copied_trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  traderId: int("traderId").notNull().references(() => traders.id),
  tradeId: varchar("tradeId", { length: 255 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  entryPrice: int("entryPrice").notNull(), // in cents
  exitPrice: int("exitPrice"),
  quantity: int("quantity").notNull(),
  pnl: int("pnl"), // in cents
  status: varchar("status", { length: 20 }).notNull().default("OPEN"), // OPEN, CLOSED, CANCELLED
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type CopiedTrade = typeof copiedTrades.$inferSelect;
export type InsertCopiedTrade = typeof copiedTrades.$inferInsert;

/**
 * Social Trading - Trader Followers
 * Tracks followers of traders
 */
export const traderFollowers = mysqlTable("trader_followers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  traderId: int("traderId").notNull().references(() => traders.id),
  followedAt: timestamp("followedAt").defaultNow().notNull(),
});

export type TraderFollower = typeof traderFollowers.$inferSelect;
export type InsertTraderFollower = typeof traderFollowers.$inferInsert;


/**
 * Tutorials System
 * Interactive tutorials for new users
 */
export const tutorials = mysqlTable("tutorials", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // "getting-started", "scanning", "trading", "portfolio"
  difficulty: varchar("difficulty", { length: 20 }).notNull().default("beginner"), // beginner, intermediate, advanced
  estimatedTime: int("estimatedTime").notNull(), // in minutes
  order: int("order").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = typeof tutorials.$inferInsert;

/**
 * Tutorial Steps
 * Individual steps within a tutorial
 */
export const tutorialSteps = mysqlTable("tutorial_steps", {
  id: int("id").autoincrement().primaryKey(),
  tutorialId: int("tutorialId").notNull().references(() => tutorials.id),
  stepNumber: int("stepNumber").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  action: varchar("action", { length: 255 }), // "click", "fill", "navigate"
  targetElement: varchar("targetElement", { length: 255 }), // CSS selector
  highlightArea: varchar("highlightArea", { length: 255 }), // JSON for highlight coordinates
  tips: text("tips"),
  order: int("order").notNull(),
});

export type TutorialStep = typeof tutorialSteps.$inferSelect;
export type InsertTutorialStep = typeof tutorialSteps.$inferInsert;

/**
 * Tutorial Progress
 * Tracks user progress through tutorials
 */
export const tutorialProgress = mysqlTable("tutorial_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tutorialId: int("tutorialId").notNull().references(() => tutorials.id),
  currentStep: int("currentStep").notNull().default(0),
  completedSteps: int("completedSteps").notNull().default(0),
  isCompleted: int("isCompleted").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type InsertTutorialProgress = typeof tutorialProgress.$inferInsert;

/**
 * Paper Trading Accounts
 * Virtual trading accounts for practice
 */
export const paperTradingAccounts = mysqlTable("paper_trading_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  initialBalance: int("initialBalance").notNull(), // in cents
  currentBalance: int("currentBalance").notNull(),
  totalProfit: int("totalProfit").notNull().default(0),
  totalReturn: int("totalReturn").notNull().default(0), // basis points
  trades: int("trades").notNull().default(0),
  winRate: int("winRate").notNull().default(0), // basis points
  maxDrawdown: int("maxDrawdown").notNull().default(0), // basis points
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaperTradingAccount = typeof paperTradingAccounts.$inferSelect;
export type InsertPaperTradingAccount = typeof paperTradingAccounts.$inferInsert;

/**
 * Paper Trades
 * Virtual trades in paper trading accounts
 */
export const paperTrades = mysqlTable("paper_trades", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull().references(() => paperTradingAccounts.id),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // "BUY", "SELL"
  entryPrice: int("entryPrice").notNull(), // in cents
  exitPrice: int("exitPrice"),
  quantity: int("quantity").notNull(),
  pnl: int("pnl"), // in cents
  pnlPercent: int("pnlPercent"), // basis points
  status: varchar("status", { length: 20 }).notNull().default("OPEN"), // OPEN, CLOSED, CANCELLED
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type PaperTrade = typeof paperTrades.$inferSelect;
export type InsertPaperTrade = typeof paperTrades.$inferInsert;

/**
 * Quests
 * Learning quests and challenges
 */
export const quests = mysqlTable("quests", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // "learning", "trading", "social"
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  reward: int("reward").notNull(), // points
  badge: varchar("badge", { length: 100 }), // badge name
  requirements: text("requirements"), // JSON with requirements
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = typeof quests.$inferInsert;

/**
 * Quest Progress
 * Tracks user progress on quests
 */
export const questProgress = mysqlTable("quest_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  questId: int("questId").notNull().references(() => quests.id),
  progress: int("progress").notNull().default(0), // percentage
  isCompleted: int("isCompleted").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
});

export type QuestProgress = typeof questProgress.$inferSelect;
export type InsertQuestProgress = typeof questProgress.$inferInsert;

/**
 * User Achievements
 * Badges and achievements earned by users
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  badge: varchar("badge", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  points: int("points").notNull().default(0),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;
