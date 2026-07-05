import crypto from "crypto";

/**
 * Coinbase API Service
 * Handles authentication and API calls to Coinbase
 */

interface CoinbaseApiConfig {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
}

interface CoinbaseProduct {
  id: string;
  base_currency: string;
  quote_currency: string;
  base_min_size: string;
  base_max_size: string;
  quote_increment: string;
  display_name: string;
  status: string;
  margin_enabled: boolean;
  post_only: boolean;
  limit_only: boolean;
  cancel_only: boolean;
}

interface CoinbaseAccount {
  id: string;
  currency: string;
  balance: string;
  available: string;
  hold: string;
  profile_id: string;
  trading_enabled: boolean;
}

interface CoinbaseCandle {
  time: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

export class CoinbaseApiService {
  private apiKey: string;
  private apiSecret: string;
  private passphrase: string;
  private baseUrl = "https://api.exchange.coinbase.com";

  constructor(config: CoinbaseApiConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.passphrase = config.passphrase;
  }

  /**
   * Generate signature for authenticated requests
   */
  private generateSignature(
    timestamp: string,
    method: string,
    path: string,
    body: string = ""
  ): string {
    const message = timestamp + method + path + body;
    const hmac = crypto.createHmac("sha256", Buffer.from(this.apiSecret, "base64"));
    return hmac.update(message).digest("base64");
  }

  /**
   * Make authenticated request to Coinbase API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: any
  ): Promise<T> {
    const timestamp = (Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : "";
    const signature = this.generateSignature(timestamp, method, endpoint, bodyString);

    const headers: Record<string, string> = {
      "CB-ACCESS-KEY": this.apiKey,
      "CB-ACCESS-SIGN": signature,
      "CB-ACCESS-TIMESTAMP": timestamp,
      "CB-ACCESS-PASSPHRASE": this.passphrase,
      "Content-Type": "application/json",
    };

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers,
      body: bodyString || undefined,
    });

    if (!response.ok) {
      throw new Error(`Coinbase API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current price for a product
   */
  async getProductPrice(productId: string): Promise<number> {
    const result = await this.makeRequest<any>(`/products/${productId}/ticker`);
    return parseFloat(result.price);
  }

  /**
   * Get multiple product prices
   */
  async getProductPrices(productIds: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    for (const productId of productIds) {
      try {
        prices[productId] = await this.getProductPrice(productId);
      } catch (error) {
        console.error(`Failed to fetch price for ${productId}:`, error);
      }
    }

    return prices;
  }

  /**
   * Get candles (OHLCV) data for a product
   */
  async getProductCandles(
    productId: string,
    granularity: number = 3600, // 1 hour in seconds
    limit: number = 100
  ): Promise<CoinbaseCandle[]> {
    const result = await this.makeRequest<any[]>(
      `/products/${productId}/candles?granularity=${granularity}&limit=${limit}`
    );

    return result.map((candle) => ({
      time: candle[0],
      low: candle[1],
      high: candle[2],
      open: candle[3],
      close: candle[4],
      volume: candle[5],
    }));
  }

  /**
   * Get account information
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    return this.makeRequest<CoinbaseAccount[]>("/accounts");
  }

  /**
   * Get specific account details
   */
  async getAccount(accountId: string): Promise<CoinbaseAccount> {
    return this.makeRequest<CoinbaseAccount>(`/accounts/${accountId}`);
  }

  /**
   * Get all products (trading pairs)
   */
  async getProducts(): Promise<CoinbaseProduct[]> {
    return this.makeRequest<CoinbaseProduct[]>("/products");
  }

  /**
   * Get product details
   */
  async getProduct(productId: string): Promise<CoinbaseProduct> {
    return this.makeRequest<CoinbaseProduct>(`/products/${productId}`);
  }

  /**
   * Get 24h ticker data
   */
  async get24hTicker(productId: string): Promise<any> {
    return this.makeRequest<any>(`/products/${productId}/ticker`);
  }

  /**
   * Get order book
   */
  async getOrderBook(productId: string, level: number = 1): Promise<any> {
    return this.makeRequest<any>(`/products/${productId}/book?level=${level}`);
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(productId: string, limit: number = 100): Promise<any[]> {
    return this.makeRequest<any[]>(`/products/${productId}/trades?limit=${limit}`);
  }

  /**
   * Place a test order
   */
  async testOrder(
    productId: string,
    side: "buy" | "sell",
    orderType: "market" | "limit",
    size: string,
    price?: string
  ): Promise<any> {
    const body = {
      product_id: productId,
      side,
      type: orderType,
      size,
      price,
    };

    return this.makeRequest("/orders", "POST", body);
  }

  /**
   * Place a real order
   */
  async placeOrder(
    productId: string,
    side: "buy" | "sell",
    orderType: "market" | "limit",
    size: string,
    price?: string
  ): Promise<any> {
    const body = {
      product_id: productId,
      side,
      type: orderType,
      size,
      price,
    };

    return this.makeRequest("/orders", "POST", body);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<any> {
    return this.makeRequest(`/orders/${orderId}`, "DELETE");
  }

  /**
   * Get open orders
   */
  async getOpenOrders(productId?: string): Promise<any[]> {
    const endpoint = productId
      ? `/orders?product_id=${productId}&status=open`
      : "/orders?status=open";
    return this.makeRequest<any[]>(endpoint);
  }

  /**
   * Get order history
   */
  async getOrderHistory(productId?: string, limit: number = 100): Promise<any[]> {
    const endpoint = productId
      ? `/orders?product_id=${productId}&limit=${limit}`
      : `/orders?limit=${limit}`;
    return this.makeRequest<any[]>(endpoint);
  }

  /**
   * Get fills (trade history)
   */
  async getFills(productId?: string, limit: number = 100): Promise<any[]> {
    const endpoint = productId
      ? `/fills?product_id=${productId}&limit=${limit}`
      : `/fills?limit=${limit}`;
    return this.makeRequest<any[]>(endpoint);
  }
}

export default CoinbaseApiService;
