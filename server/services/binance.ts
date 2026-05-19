import crypto from "crypto";

/**
 * Binance API сервис
 * Поддерживает получение балансов, позиций, ордеров и сделок
 */
export class BinanceService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = "https://api.binance.com/api";

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Генерирует подпись для запроса
   */
  private generateSignature(params: Record<string, any>): string {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(query)
      .digest("hex");
  }

  /**
   * Выполняет запрос к Binance API
   */
  private async request(
    method: string,
    endpoint: string,
    params: Record<string, any> = {},
    signed: boolean = false
  ): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryParams: Record<string, any> = { ...params, timestamp };

      if (signed) {
        queryParams.signature = this.generateSignature(queryParams);
      }

      const query = new URLSearchParams(
        Object.entries(queryParams).map(([k, v]) => [k, String(v)])
      ).toString();
      const url = `${this.baseUrl}${endpoint}?${query}`;

      const response = await fetch(url, {
        method,
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Binance API request failed:", error);
      throw error;
    }
  }

  /**
   * Получает информацию об аккаунте
   */
  async getAccountInfo(): Promise<any> {
    return this.request("GET", "/v3/account", {}, true);
  }

  /**
   * Получает балансы
   */
  async getBalances(): Promise<
    Array<{ asset: string; free: number; locked: number; total: number }>
  > {
    const account = await this.getAccountInfo();
    return account.balances
      .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map((b: any) => ({
        asset: b.asset,
        free: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked),
      }));
  }

  /**
   * Получает открытые позиции (для фьючерсов)
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
      const positions = await this.request(
        "GET",
        "/v1/openOrders",
        {},
        true
      );
      return positions.map((p: any) => ({
        symbol: p.symbol,
        quantity: parseFloat(p.origQty),
        entryPrice: parseFloat(p.price),
        currentPrice: parseFloat(p.price),
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
    symbol?: string,
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
      const trades = await this.request(
        "GET",
        "/v3/myTrades",
        { limit },
        true
      );
      return trades
        .filter((t: any) => !symbol || t.symbol === symbol)
        .map((t: any) => ({
          id: t.id.toString(),
          symbol: t.symbol,
          side: t.isBuyer ? "BUY" : "SELL",
          price: parseFloat(t.price),
          quantity: parseFloat(t.qty),
          commission: parseFloat(t.commission),
          timestamp: t.time,
        }));
    } catch (error) {
      console.error("Failed to get trades:", error);
      return [];
    }
  }

  /**
   * Получает текущую цену актива
   */
  async getPrice(symbol: string): Promise<number> {
    try {
      const ticker = await this.request("GET", "/v3/ticker/price", {
        symbol,
      });
      return parseFloat(ticker.price);
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Размещает ордер
   */
  async placeOrder(
    symbol: string,
    side: "BUY" | "SELL",
    quantity: number,
    price?: number
  ): Promise<{ orderId: string; status: string }> {
    try {
      const params: Record<string, any> = {
        symbol,
        side,
        quantity,
        type: price ? "LIMIT" : "MARKET",
      };

      if (price) {
        params.price = price;
        params.timeInForce = "GTC";
      }

      const order = await this.request("POST", "/v3/order", params, true);
      return {
        orderId: order.orderId.toString(),
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
  async cancelOrder(symbol: string, orderId: string): Promise<boolean> {
    try {
      await this.request(
        "DELETE",
        "/v3/order",
        { symbol, orderId },
        true
      );
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  /**
   * Получает статус ордера
   */
  async getOrderStatus(
    symbol: string,
    orderId: string
  ): Promise<{ status: string; filledQuantity: number; averagePrice: number }> {
    try {
      const order = await this.request(
        "GET",
        "/v3/order",
        { symbol, orderId },
        true
      );
      return {
        status: order.status,
        filledQuantity: parseFloat(order.executedQty),
        averagePrice: parseFloat(order.cummulativeQuoteQty) / parseFloat(order.executedQty) || 0,
      };
    } catch (error) {
      console.error("Failed to get order status:", error);
      throw error;
    }
  }
}

/**
 * Создаёт экземпляр BinanceService
 */
export function createBinanceService(
  apiKey: string,
  apiSecret: string
): BinanceService {
  return new BinanceService(apiKey, apiSecret);
}
