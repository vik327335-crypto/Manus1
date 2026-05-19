import crypto from "crypto";

/**
 * Coinbase API сервис
 * Поддерживает получение балансов, позиций, ордеров и сделок
 */
export class CoinbaseService {
  private apiKey: string;
  private apiSecret: string;
  private passphrase: string;
  private baseUrl = "https://api.exchange.coinbase.com";

  constructor(apiKey: string, apiSecret: string, passphrase: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.passphrase = passphrase;
  }

  /**
   * Генерирует подпись для запроса
   */
  private generateSignature(
    method: string,
    path: string,
    body: string,
    timestamp: string
  ): string {
    const message = timestamp + method + path + body;
    const hmac = crypto.createHmac("sha256", Buffer.from(this.apiSecret, "base64"));
    hmac.update(message);
    return hmac.digest("base64");
  }

  /**
   * Выполняет запрос к Coinbase API
   */
  private async request(
    method: string,
    path: string,
    body: Record<string, any> = {}
  ): Promise<any> {
    try {
      const timestamp = (Date.now() / 1000).toString();
      const bodyString = Object.keys(body).length > 0 ? JSON.stringify(body) : "";
      const signature = this.generateSignature(method, path, bodyString, timestamp);

      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "CB-ACCESS-KEY": this.apiKey,
          "CB-ACCESS-SIGN": signature,
          "CB-ACCESS-TIMESTAMP": timestamp,
          "CB-ACCESS-PASSPHRASE": this.passphrase,
          "Content-Type": "application/json",
        },
        body: bodyString || undefined,
      });

      if (!response.ok) {
        throw new Error(`Coinbase API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Coinbase API request failed:", error);
      throw error;
    }
  }

  /**
   * Получает информацию об аккаунте
   */
  async getAccountInfo(): Promise<any> {
    return this.request("GET", "/accounts");
  }

  /**
   * Получает балансы
   */
  async getBalances(): Promise<
    Array<{ asset: string; free: number; locked: number; total: number }>
  > {
    const accounts = await this.getAccountInfo();
    return accounts
      .filter((acc: any) => parseFloat(acc.available) > 0 || parseFloat(acc.hold) > 0)
      .map((acc: any) => ({
        asset: acc.currency,
        free: parseFloat(acc.available),
        locked: parseFloat(acc.hold),
        total: parseFloat(acc.balance),
      }));
  }

  /**
   * Получает открытые позиции
   */
  async getOpenPositions(): Promise<
    Array<{
      symbol: string;
      quantity: number;
      entryPrice: number;
      currentPrice: number;
      pnl: number;
      pnlPercent: number;
    }>
  > {
    try {
      const orders = await this.request("GET", "/orders?status=open");
      return orders.map((order: any) => ({
        symbol: order.product_id,
        quantity: parseFloat(order.size),
        entryPrice: parseFloat(order.price),
        currentPrice: parseFloat(order.price),
        pnl: 0,
        pnlPercent: 0,
      }));
    } catch (error) {
      console.error("Failed to get open positions:", error);
      return [];
    }
  }

  /**
   * Получает историю сделок
   */
  async getTrades(
    productId?: string,
    limit: number = 100
  ): Promise<
    Array<{
      id: string;
      symbol: string;
      side: "BUY" | "SELL";
      price: number;
      quantity: number;
      commission: number;
      timestamp: number;
    }>
  > {
    try {
      const fills = await this.request("GET", `/fills?limit=${limit}`);
      return fills
        .filter((fill: any) => !productId || fill.product_id === productId)
        .map((fill: any) => ({
          id: fill.trade_id,
          symbol: fill.product_id,
          side: fill.side === "buy" ? "BUY" : "SELL",
          price: parseFloat(fill.price),
          quantity: parseFloat(fill.size),
          commission: parseFloat(fill.fee),
          timestamp: new Date(fill.created_at).getTime(),
        }));
    } catch (error) {
      console.error("Failed to get trades:", error);
      return [];
    }
  }

  /**
   * Получает текущую цену актива
   */
  async getPrice(productId: string): Promise<number> {
    try {
      const ticker = await this.request("GET", `/products/${productId}/ticker`);
      return parseFloat(ticker.price);
    } catch (error) {
      console.error(`Failed to get price for ${productId}:`, error);
      return 0;
    }
  }

  /**
   * Размещает ордер
   */
  async placeOrder(
    productId: string,
    side: "buy" | "sell",
    size: number,
    price?: number
  ): Promise<{ orderId: string; status: string }> {
    try {
      const body: Record<string, any> = {
        product_id: productId,
        side,
        size,
        type: price ? "limit" : "market",
      };

      if (price) {
        body.price = price;
      }

      const order = await this.request("POST", "/orders", body);
      return {
        orderId: order.id,
        status: order.status,
      };
    } catch (error) {
      console.error("Failed to place order:", error);
      throw error;
    }
  }

  /**
   * Отменяет ордер
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.request("DELETE", `/orders/${orderId}`);
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  /**
   * Получает статус ордера
   */
  async getOrderStatus(orderId: string): Promise<{
    status: string;
    filledQuantity: number;
    averagePrice: number;
  }> {
    try {
      const order = await this.request("GET", `/orders/${orderId}`);
      return {
        status: order.status,
        filledQuantity: parseFloat(order.filled_size),
        averagePrice: parseFloat(order.executed_value) / parseFloat(order.filled_size) || 0,
      };
    } catch (error) {
      console.error("Failed to get order status:", error);
      throw error;
    }
  }
}

/**
 * Создаёт экземпляр CoinbaseService
 */
export function createCoinbaseService(
  apiKey: string,
  apiSecret: string,
  passphrase: string
): CoinbaseService {
  return new CoinbaseService(apiKey, apiSecret, passphrase);
}
