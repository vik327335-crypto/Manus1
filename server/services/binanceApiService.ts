import crypto from "crypto";

/**
 * Binance API Service
 * Handles authentication and API calls to Binance
 */

interface BinanceApiConfig {
  apiKey: string;
  apiSecret: string;
}

interface BinanceSymbolPrice {
  symbol: string;
  price: string;
}

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

interface BinanceAccountInfo {
  balances: BinanceBalance[];
  canTrade: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
}

export class BinanceApiService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = "https://api.binance.com/api";

  constructor(config: BinanceApiConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  /**
   * Generate signature for authenticated requests
   */
  private generateSignature(queryString: string): string {
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(queryString)
      .digest("hex");
  }

  /**
   * Make authenticated request to Binance API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    params?: Record<string, any>
  ): Promise<T> {
    const timestamp = Date.now();
    const queryParams: Record<string, string> = {
      ...Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>
      ),
      timestamp: String(timestamp),
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = this.generateSignature(queryString);

    const url = `${this.baseUrl}${endpoint}?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      method,
      headers: {
        "X-MBX-APIKEY": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make public request (no authentication required)
   */
  private async makePublicRequest<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const queryString = new URLSearchParams(params || {}).toString();
    const url = `${this.baseUrl}${endpoint}?${queryString}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current price for a symbol
   */
  async getSymbolPrice(symbol: string): Promise<number> {
    const result = await this.makePublicRequest<BinanceSymbolPrice>(
      "/v3/ticker/price",
      { symbol }
    );
    return parseFloat(result.price);
  }

  /**
   * Get multiple symbol prices
   */
  async getSymbolPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    for (const symbol of symbols) {
      try {
        prices[symbol] = await this.getSymbolPrice(symbol);
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    }

    return prices;
  }

  /**
   * Get klines (candlestick) data for a symbol
   */
  async getSymbolKlines(
    symbol: string,
    interval: string = "1h",
    limit: number = 100
  ): Promise<BinanceKline[]> {
    const result = await this.makePublicRequest<any[]>(
      "/v3/klines",
      { symbol, interval, limit }
    );

    return result.map((kline) => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
      quoteAssetVolume: kline[7],
      numberOfTrades: kline[8],
      takerBuyBaseAssetVolume: kline[9],
      takerBuyQuoteAssetVolume: kline[10],
    }));
  }

  /**
   * Get account balance information
   */
  async getAccountBalance(): Promise<BinanceAccountInfo> {
    const result = await this.makeRequest<BinanceAccountInfo>(
      "/v3/account",
      "GET"
    );
    return result;
  }

  /**
   * Get balance for specific asset
   */
  async getAssetBalance(asset: string): Promise<BinanceBalance | null> {
    const accountInfo = await this.getAccountBalance();
    return (
      accountInfo.balances.find((b) => b.asset === asset) || null
    );
  }

  /**
   * Get all balances
   */
  async getAllBalances(): Promise<BinanceBalance[]> {
    const accountInfo = await this.getAccountBalance();
    return accountInfo.balances.filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
  }

  /**
   * Get 24h ticker data for a symbol
   */
  async get24hTicker(symbol: string): Promise<any> {
    return this.makePublicRequest("/v3/ticker/24hr", { symbol });
  }

  /**
   * Get exchange info (trading pairs, filters, etc.)
   */
  async getExchangeInfo(): Promise<any> {
    return this.makePublicRequest("/v3/exchangeInfo");
  }

  /**
   * Get recent trades for a symbol
   */
  async getRecentTrades(symbol: string, limit: number = 100): Promise<any[]> {
    return this.makePublicRequest("/v3/trades", { symbol, limit });
  }

  /**
   * Get order book for a symbol
   */
  async getOrderBook(symbol: string, limit: number = 100): Promise<any> {
    return this.makePublicRequest("/v3/depth", { symbol, limit });
  }

  /**
   * Place a test order (no actual order is placed)
   */
  async testOrder(
    symbol: string,
    side: "BUY" | "SELL",
    quantity: number,
    price: number
  ): Promise<any> {
    return this.makeRequest("/v3/order/test", "POST", {
      symbol,
      side,
      type: "LIMIT",
      timeInForce: "GTC",
      quantity,
      price,
    });
  }

  /**
   * Place a real order
   */
  async placeOrder(
    symbol: string,
    side: "BUY" | "SELL",
    quantity: number,
    price: number
  ): Promise<any> {
    return this.makeRequest("/v3/order", "POST", {
      symbol,
      side,
      type: "LIMIT",
      timeInForce: "GTC",
      quantity,
      price,
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    return this.makeRequest("/v3/order", "DELETE", {
      symbol,
      orderId,
    });
  }

  /**
   * Get open orders for a symbol
   */
  async getOpenOrders(symbol?: string): Promise<any[]> {
    return this.makeRequest("/v3/openOrders", "GET", symbol ? { symbol } : {});
  }

  /**
   * Get order history for a symbol
   */
  async getOrderHistory(symbol: string, limit: number = 100): Promise<any[]> {
    return this.makeRequest("/v3/allOrders", "GET", {
      symbol,
      limit,
    });
  }

  /**
   * Get trade history
   */
  async getTradeHistory(symbol: string, limit: number = 100): Promise<any[]> {
    return this.makeRequest("/v3/myTrades", "GET", {
      symbol,
      limit,
    });
  }
}

export default BinanceApiService;
