import crypto from "crypto";

/**
 * Kraken API Service
 * Handles authentication and API calls to Kraken
 */

interface KrakenApiConfig {
  apiKey: string;
  apiSecret: string;
}

interface KrakenAsset {
  altname: string;
  aclass: string;
  decimals: number;
  display_decimals: number;
}

interface KrakenTicker {
  a: [string, string, string]; // ask price, ask whole lot volume, ask lot volume
  b: [string, string, string]; // bid price, bid whole lot volume, bid lot volume
  c: [string, string]; // last trade closed price, lot volume
  v: [string, string]; // volume today, volume last 24h
  p: [string, string]; // volume weighted average price today, volume weighted average price last 24h
  t: [number, number]; // number of trades today, number of trades last 24h
  l: [string, string]; // low price today, low price last 24h
  h: [string, string]; // high price today, high price last 24h
  o: [string, string]; // opening price today, opening price last 24h
}

interface KrakenOHLC {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  vwap: string;
  volume: string;
  count: number;
}

interface KrakenBalance {
  [currency: string]: string;
}

export class KrakenApiService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = "https://api.kraken.com";

  constructor(config: KrakenApiConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  /**
   * Generate signature for authenticated requests
   */
  private generateSignature(
    endpoint: string,
    params: Record<string, any>,
    nonce: string
  ): string {
    const postData = new URLSearchParams();
    postData.append("nonce", nonce);

    for (const [key, value] of Object.entries(params)) {
      postData.append(key, String(value));
    }

    const message = endpoint + crypto
      .createHash("sha256")
      .update(postData.toString())
      .digest("binary");

    const signature = crypto
      .createHmac("sha512", Buffer.from(this.apiSecret, "base64"))
      .update(message)
      .digest("base64");

    return signature;
  }

  /**
   * Make authenticated request to Kraken API
   */
  private async makeRequest<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const nonce = Date.now().toString();
    const signature = this.generateSignature(endpoint, params || {}, nonce);

    const postData = new URLSearchParams();
    postData.append("nonce", nonce);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        postData.append(key, String(value));
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "API-Key": this.apiKey,
        "API-Sign": signature,
      },
      body: postData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error && result.error.length > 0) {
      throw new Error(`Kraken API error: ${result.error.join(", ")}`);
    }

    return result.result;
  }

  /**
   * Make public request (no authentication required)
   */
  private async makePublicRequest<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const postData = new URLSearchParams();

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        postData.append(key, String(value));
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      body: postData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error && result.error.length > 0) {
      throw new Error(`Kraken API error: ${result.error.join(", ")}`);
    }

    return result.result;
  }

  /**
   * Get current price for a pair
   */
  async getPairPrice(pair: string): Promise<number> {
    const result = await this.makePublicRequest<Record<string, KrakenTicker>>(
      "/0/public/Ticker",
      { pair }
    );

    const ticker = result[pair];
    if (!ticker) {
      throw new Error(`Pair ${pair} not found`);
    }

    return parseFloat(ticker.c[0]);
  }

  /**
   * Get multiple pair prices
   */
  async getPairPrices(pairs: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    for (const pair of pairs) {
      try {
        prices[pair] = await this.getPairPrice(pair);
      } catch (error) {
        console.error(`Failed to fetch price for ${pair}:`, error);
      }
    }

    return prices;
  }

  /**
   * Get OHLC (candlestick) data
   */
  async getPairOHLC(
    pair: string,
    interval: number = 60, // 1 minute in minutes
    since?: number
  ): Promise<KrakenOHLC[]> {
    const params: Record<string, any> = {
      pair,
      interval,
    };

    if (since) {
      params.since = since;
    }

    const result = await this.makePublicRequest<any>(
      "/0/public/OHLC",
      params
    );

    const ohlcData = result[pair];
    if (!ohlcData) {
      throw new Error(`Pair ${pair} not found`);
    }

    return ohlcData.map((candle: any[]) => ({
      time: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      vwap: candle[5],
      volume: candle[6],
      count: candle[7],
    }));
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<KrakenBalance> {
    return this.makeRequest<KrakenBalance>("/0/private/Balance");
  }

  /**
   * Get extended balance information
   */
  async getExtendedBalance(): Promise<any> {
    return this.makeRequest("/0/private/BalanceEx");
  }

  /**
   * Get ticker information for pairs
   */
  async getTicker(pairs: string[]): Promise<Record<string, KrakenTicker>> {
    return this.makePublicRequest<Record<string, KrakenTicker>>(
      "/0/public/Ticker",
      { pair: pairs.join(",") }
    );
  }

  /**
   * Get asset information
   */
  async getAssets(): Promise<Record<string, KrakenAsset>> {
    return this.makePublicRequest<Record<string, KrakenAsset>>(
      "/0/public/Assets"
    );
  }

  /**
   * Get asset pairs information
   */
  async getAssetPairs(): Promise<any> {
    return this.makePublicRequest("/0/public/AssetPairs");
  }

  /**
   * Get order book
   */
  async getOrderBook(pair: string, count?: number): Promise<any> {
    const params: Record<string, any> = { pair };
    if (count) {
      params.count = count;
    }

    return this.makePublicRequest("/0/public/Depth", params);
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(pair: string, since?: number): Promise<any> {
    const params: Record<string, any> = { pair };
    if (since) {
      params.since = since;
    }

    return this.makePublicRequest("/0/public/Trades", params);
  }

  /**
   * Get spread data
   */
  async getSpread(pair: string, since?: number): Promise<any> {
    const params: Record<string, any> = { pair };
    if (since) {
      params.since = since;
    }

    return this.makePublicRequest("/0/public/Spread", params);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(trades?: boolean): Promise<any> {
    const params: Record<string, any> = {};
    if (trades !== undefined) {
      params.trades = trades;
    }

    return this.makeRequest("/0/private/OpenOrders", params);
  }

  /**
   * Get closed orders
   */
  async getClosedOrders(
    trades?: boolean,
    userref?: number,
    closetime?: string
  ): Promise<any> {
    const params: Record<string, any> = {};
    if (trades !== undefined) {
      params.trades = trades;
    }
    if (userref !== undefined) {
      params.userref = userref;
    }
    if (closetime) {
      params.closetime = closetime;
    }

    return this.makeRequest("/0/private/ClosedOrders", params);
  }

  /**
   * Get trade history
   */
  async getTradeHistory(trades?: boolean, userref?: number): Promise<any> {
    const params: Record<string, any> = {};
    if (trades !== undefined) {
      params.trades = trades;
    }
    if (userref !== undefined) {
      params.userref = userref;
    }

    return this.makeRequest("/0/private/TradesHistory", params);
  }

  /**
   * Place a test order
   */
  async testOrder(
    pair: string,
    type: "buy" | "sell",
    ordertype: string,
    volume: string,
    price?: string
  ): Promise<any> {
    const params: Record<string, any> = {
      pair,
      type,
      ordertype,
      volume,
    };

    if (price) {
      params.price = price;
    }

    return this.makeRequest("/0/private/AddOrder", {
      ...params,
      validate: true,
    });
  }

  /**
   * Place a real order
   */
  async placeOrder(
    pair: string,
    type: "buy" | "sell",
    ordertype: string,
    volume: string,
    price?: string
  ): Promise<any> {
    const params: Record<string, any> = {
      pair,
      type,
      ordertype,
      volume,
    };

    if (price) {
      params.price = price;
    }

    return this.makeRequest("/0/private/AddOrder", params);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(txid: string): Promise<any> {
    return this.makeRequest("/0/private/CancelOrder", { txid });
  }
}

export default KrakenApiService;
