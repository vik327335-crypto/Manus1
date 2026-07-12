/**
 * WebSocket Service
 * Manages real-time connections and broadcasts price updates, alerts, and notifications
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server } from "http";

export interface PriceUpdate {
  ticker: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: Date;
}

export interface AlertNotification {
  id: string;
  type: "PRICE_ALERT" | "SIGNAL_ALERT" | "PORTFOLIO_ALERT" | "NEWS_ALERT";
  ticker: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: Date;
}

export interface SentimentUpdate {
  ticker: string;
  sentiment: number;
  confidence: number;
  source: string;
  timestamp: Date;
}

export interface PortfolioUpdate {
  userId: string;
  totalValue: number;
  totalGain: number;
  gainPercent: number;
  positions: Array<{
    ticker: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    gain: number;
  }>;
  timestamp: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private userConnections: Map<string, Set<string>> = new Map();
  private priceSubscriptions: Map<string, Set<string>> = new Map();

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.setupConnectionHandlers();
  }

  /**
   * Setup connection handlers
   */
  private setupConnectionHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Handle user identification
      socket.on("identify", (userId: string) => {
        if (!this.userConnections.has(userId)) {
          this.userConnections.set(userId, new Set());
        }
        this.userConnections.get(userId)!.add(socket.id);
        socket.data.userId = userId;
        console.log(`[WebSocket] User ${userId} identified with socket ${socket.id}`);
      });

      // Handle price subscription
      socket.on("subscribe_price", (ticker: string) => {
        if (!this.priceSubscriptions.has(ticker)) {
          this.priceSubscriptions.set(ticker, new Set());
        }
        this.priceSubscriptions.get(ticker)!.add(socket.id);
        socket.join(`price:${ticker}`);
        console.log(`[WebSocket] Socket ${socket.id} subscribed to ${ticker}`);
      });

      // Handle price unsubscription
      socket.on("unsubscribe_price", (ticker: string) => {
        this.priceSubscriptions.get(ticker)?.delete(socket.id);
        socket.leave(`price:${ticker}`);
      });

      // Handle portfolio subscription
      socket.on("subscribe_portfolio", (userId: string) => {
        socket.join(`portfolio:${userId}`);
      });

      // Handle sentiment subscription
      socket.on("subscribe_sentiment", (ticker: string) => {
        socket.join(`sentiment:${ticker}`);
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        const userId = socket.data.userId;
        if (userId) {
          this.userConnections.get(userId)?.delete(socket.id);
        }
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error(`[WebSocket] Error from ${socket.id}:`, error);
      });
    });
  }

  /**
   * Broadcast price update to all subscribers
   */
  broadcastPriceUpdate(update: PriceUpdate) {
    this.io.to(`price:${update.ticker}`).emit("price_update", update);
  }

  /**
   * Broadcast alert notification
   */
  broadcastAlert(userId: string, alert: AlertNotification) {
    this.io.to(`user:${userId}`).emit("alert_notification", alert);
  }

  /**
   * Broadcast sentiment update
   */
  broadcastSentimentUpdate(update: SentimentUpdate) {
    this.io.to(`sentiment:${update.ticker}`).emit("sentiment_update", update);
  }

  /**
   * Broadcast portfolio update
   */
  broadcastPortfolioUpdate(update: PortfolioUpdate) {
    this.io.to(`portfolio:${update.userId}`).emit("portfolio_update", update);
  }

  /**
   * Send notification to specific user
   */
  notifyUser(userId: string, message: string, data?: any) {
    const socketIds = this.userConnections.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.io.to(socketId).emit("notification", { message, data });
      });
    }
  }

  /**
   * Broadcast to all connected users
   */
  broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get subscribers count for a ticker
   */
  getTickerSubscribersCount(ticker: string): number {
    return this.priceSubscriptions.get(ticker)?.size || 0;
  }

  /**
   * Get all subscribed tickers
   */
  getSubscribedTickers(): string[] {
    return Array.from(this.priceSubscriptions.keys());
  }

  /**
   * Broadcast market status
   */
  broadcastMarketStatus(status: {
    isOpen: boolean;
    nextOpen?: Date;
    nextClose?: Date;
  }) {
    this.io.emit("market_status", status);
  }

  /**
   * Broadcast trading signal
   */
  broadcastTradingSignal(signal: {
    ticker: string;
    signal: "BUY" | "SELL" | "HOLD";
    strength: number;
    timestamp: Date;
  }) {
    this.io.to(`price:${signal.ticker}`).emit("trading_signal", signal);
  }

  /**
   * Broadcast leaderboard update
   */
  broadcastLeaderboardUpdate(leaderboard: any[]) {
    this.io.emit("leaderboard_update", leaderboard);
  }

  /**
   * Broadcast strategy shared event
   */
  broadcastStrategyShared(strategy: {
    id: string;
    name: string;
    author: string;
    description: string;
    timestamp: Date;
  }) {
    this.io.emit("strategy_shared", strategy);
  }

  /**
   * Broadcast backtesting completion
   */
  broadcastBacktestComplete(userId: string, result: {
    strategyId: string;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalReturn: number;
    timestamp: Date;
  }) {
    this.io.to(`user:${userId}`).emit("backtest_complete", result);
  }

  /**
   * Broadcast optimization progress
   */
  broadcastOptimizationProgress(userId: string, progress: {
    jobId: string;
    progress: number;
    currentIteration: number;
    totalIterations: number;
    bestScore: number;
    timestamp: Date;
  }) {
    this.io.to(`user:${userId}`).emit("optimization_progress", progress);
  }

  /**
   * Close all connections
   */
  close() {
    this.io.close();
  }
}

export default WebSocketService;
