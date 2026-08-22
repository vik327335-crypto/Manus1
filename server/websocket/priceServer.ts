/**
 * WebSocket server for real-time price and news updates
 * Broadcasts market data to connected clients
 */

import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { getCoinData, getGlobalData } from "../services/coingeckoService";
import { getAllNews } from "../services/rssService";

export interface PriceUpdate {
  ticker: string;
  price: number;
  change24h: number;
  timestamp: number;
}

export interface NewsUpdate {
  id: string;
  title: string;
  source: "cointelegraph" | "theblock";
  link: string;
  publishedAt: number;
}

export interface MarketUpdate {
  btcDominance: number;
  fearGreedIndex: number | null;
  timestamp: number;
}

let ioInstance: SocketIOServer | null = null;
let priceUpdateInterval: NodeJS.Timeout | null = null;
let newsUpdateInterval: NodeJS.Timeout | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.VITE_FRONTEND_URL || "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.info(`[WebSocket] Client connected: ${socket.id}`);

    // Send initial market data
    socket.emit("connected", {
      message: "Connected to CAN SLIM Crypto Scanner",
      timestamp: Date.now(),
    });

    // Handle subscription to price updates
    socket.on("subscribe:prices", (tickers: string[]) => {
      socket.join(`prices:${tickers.join(",")}`);
      console.info(`[WebSocket] Client ${socket.id} subscribed to prices:`, tickers);
    });

    // Handle subscription to news updates
    socket.on("subscribe:news", (assets?: string[]) => {
      const room = assets ? `news:${assets.join(",")}` : "news:all";
      socket.join(room);
      console.info(`[WebSocket] Client ${socket.id} subscribed to ${room}`);
    });

    // Handle subscription to market updates
    socket.on("subscribe:market", () => {
      socket.join("market:global");
      console.info(`[WebSocket] Client ${socket.id} subscribed to market updates`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.info(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Start broadcasting price updates
 */
export async function startPriceUpdates(interval: number = 30000) {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
  }

  const broadcastPrices = async () => {
    if (!ioInstance) return;

    try {
      const tickers = ["bitcoin", "ethereum", "cardano", "solana", "ripple"];

      for (const ticker of tickers) {
        const data = await getCoinData(ticker);
        if (data && Number.isFinite(data.current_price) && data.current_price > 0 && Number.isFinite(data.price_change_percentage_24h)) {
          const update: PriceUpdate = {
            ticker,
            price: data.current_price,
            change24h: data.price_change_percentage_24h,
            timestamp: Date.now(),
          };

          // Broadcast to all clients subscribed to this ticker
          ioInstance.to(`prices:${ticker}`).emit("price:update", update);
          ioInstance.to("prices:all").emit("price:update", update);
        }
      }
    } catch (error) {
      console.error("[WebSocket] Error broadcasting prices:", error);
    }
  };

  // Initial broadcast
  await broadcastPrices();

  // Set up interval
  priceUpdateInterval = setInterval(broadcastPrices, interval);
  console.info(`[WebSocket] Price updates started (interval: ${interval}ms)`);
}

/**
 * Start broadcasting news updates
 */
export async function startNewsUpdates(interval: number = 600000) {
  // 10 minutes default
  if (newsUpdateInterval) {
    clearInterval(newsUpdateInterval);
  }

  const broadcastNews = async () => {
    if (!ioInstance) return;

    try {
      const allNews = await getAllNews();

      if (allNews && allNews.length > 0) {
        // Get latest 5 news items
        const latestNews = allNews.slice(0, 5);

        for (const item of latestNews) {
          const isCoinTelegraph = item.source.toLowerCase().includes("cointelegraph");
          const update: NewsUpdate = {
            id: item.id,
            title: item.title,
            source: isCoinTelegraph ? "cointelegraph" : "theblock",
            link: item.link,
            publishedAt: new Date(item.pubDate).getTime(),
          };

          // Broadcast to all clients subscribed to news
          ioInstance.to("news:all").emit("news:update", update);
        }
      }
    } catch (error) {
      console.error("[WebSocket] Error broadcasting news:", error);
    }
  };

  // Initial broadcast
  await broadcastNews();

  // Set up interval
  newsUpdateInterval = setInterval(broadcastNews, interval);
  console.info(`[WebSocket] News updates started (interval: ${interval}ms)`);
}

/**
 * Start broadcasting market updates
 */
export async function startMarketUpdates(interval: number = 60000) {
  // 1 minute default
  const broadcastMarket = async () => {
    if (!ioInstance) return;

    try {
      const globalData = await getGlobalData();

      if (globalData && Number.isFinite(globalData.btc_dominance) && globalData.btc_dominance > 0) {
        const update: MarketUpdate = {
          btcDominance: globalData.btc_dominance,
          fearGreedIndex: globalData.fear_greed_index,
          timestamp: Date.now(),
        };

        ioInstance.to("market:global").emit("market:update", update);
      }
    } catch (error) {
      console.error("[WebSocket] Error broadcasting market data:", error);
    }
  };

  // Initial broadcast
  await broadcastMarket();

  // Set up interval
  setInterval(broadcastMarket, interval);
  console.info(`[WebSocket] Market updates started (interval: ${interval}ms)`);
}

/**
 * Stop all broadcasts
 */
export function stopAllBroadcasts() {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
    priceUpdateInterval = null;
  }
  if (newsUpdateInterval) {
    clearInterval(newsUpdateInterval);
    newsUpdateInterval = null;
  }
  console.info("[WebSocket] All broadcasts stopped");
}

/**
 * Broadcast custom event to specific room
 */
export function broadcastToRoom(room: string, event: string, data: unknown) {
  if (ioInstance) {
    ioInstance.to(room).emit(event, data);
  }
}

/**
 * Broadcast to all connected clients
 */
export function broadcastToAll(event: string, data: unknown) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}
