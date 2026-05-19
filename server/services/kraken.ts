import crypto from "crypto";

/**
 * Kraken API сервис
 * Поддерживает получение балансов, позиций, ордеров и сделок
 */
export class KrakenService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = "https://api.kraken.com";

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Генерирует подпись для запроса
   */
  private generateSignature(
    urlPath: string,
    data: Record<string, any>,
    nonce: string
  ): string {
    const postData = new URLSearchParams(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ).toString();

    const message = urlPath + crypto.createHash("sha256").update(nonce + postData).digest();
    const hmac = crypto.createHmac("sha512", Buffer.from(this.apiSecret, "base64"));
    hmac.update(message);
    return hmac.digest("base64");
  }

  /**
   * Выполняет приватный запрос к Kraken API
   */
  private async privateRequest(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    try {
      const nonce = Date.now().toString();
      const data = { ...params, nonce };
      const urlPath = `/0/private/${endpoint}`;
      const signature = this.generateSignature(urlPath, data, nonce);

      const response = await fetch(`${this.baseUrl}${urlPath}`, {
        method: "POST",
        headers: {
          "API-Key": this.apiKey,
          "API-Sign": signature,
        },
        body: new URLSearchParams(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      });

      const result = await response.json();
      if (result.error && result.error.length > 0) {
        throw new Error(`Kraken API error: ${result.error.join(", ")}`);
      }
      return result.result;
    } catch (error) {
      console.error("Kraken API request failed:", error);
      throw error;
    }
  }

  /**
   * Выполняет публичный запрос к Kraken API
   */
  private async publicRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const query = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString();
      const url = `${this.baseUrl}/0/public/${endpoint}?${query}`;

      const response = await fetch(url);
      const result = await response.json();
      if (result.error && result.error.length > 0) {
        throw new Error(`Kraken API error: ${result.error.join(", ")}`);
      }
      return result.result;
    } catch (error) {
      console.error("Kraken API request failed:", error);
      throw error;
    }
  }

  /**
   * Получает информацию об аккаунте
   */
  async getAccountInfo(): Promise<any> {
    return this.privateRequest("Balance");
  }

  /**
   * Получает балансы
   */
  async getBalances(): Promise<
    Array<{ asset: string; free: number; locked: number; total: number }>
  > {
    const balances = await this.getAccountInfo();
    return Object.entries(balances).map(([asset, balance]: [string, any]) => ({
      asset: asset.replace(/^X/, "").replace(/^Z/, ""),
      free: parseFloat(balance),
      locked: 0,
      total: parseFloat(balance),
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
      const openOrders = await this.privateRequest("OpenOrders");
      return Object.values(openOrders).map((order: any) => ({
        symbol: order.descr.pair,
        quantity: parseFloat(order.vol),
        entryPrice: parseFloat(order.descr.price),
        currentPrice: parseFloat(order.descr.price),
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
      const trades = await this.privateRequest("TradesHistory", {
        trades: true,
      });

      return Object.entries(trades)
        .filter(([_, trade]: [string, any]) => !symbol || trade.pair === symbol)
        .slice(0, limit)
        .map(([id, trade]: [string, any]) => ({
          id,
          symbol: trade.pair,
          side: trade.type === "buy" ? "BUY" : "SELL",
          price: parseFloat(trade.price),
          quantity: parseFloat(trade.vol),
          commission: parseFloat(trade.fee),
          timestamp: Math.floor(trade.time * 1000),
        }));
    } catch (error) {
      console.error("Failed to get trades:", error);
      return [];
    }
  }

  /**
   * Получает текущую цену актива
   */
  async getPrice(pair: string): Promise<number> {
    try {
      const ticker = await this.publicRequest("Ticker", { pair });
      const key = Object.keys(ticker)[0];
      return parseFloat(ticker[key].c[0]);
    } catch (error) {
      console.error(`Failed to get price for ${pair}:`, error);
      return 0;
    }
  }

  /**
   * Размещает ордер
   */
  async placeOrder(
    pair: string,
    side: "buy" | "sell",
    volume: number,
    price?: number
  ): Promise<{ orderId: string; status: string }> {
    try {
      const params: Record<string, any> = {
        pair,
        type: side,
        ordertype: price ? "limit" : "market",
        volume,
      };

      if (price) {
        params.price = price;
      }

      const result = await this.privateRequest("AddOrder", params);
      return {
        orderId: result.txid[0],
        status: "PENDING",
      };
    } catch (error) {
      console.error("Failed to place order:", error);
      throw error;
    }
  }

  /**
   * Отменяет ордер
   */
  async cancelOrder(txid: string): Promise<boolean> {
    try {
      await this.privateRequest("CancelOrder", { txid });
      return true;
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return false;
    }
  }

  /**
   * Получает статус ордера
   */
  async getOrderStatus(txid: string): Promise<{
    status: string;
    filledQuantity: number;
    averagePrice: number;
  }> {
    try {
      const orders = await this.privateRequest("QueryOrders", { txid });
      const order = orders[txid];
      return {
        status: order.status,
        filledQuantity: parseFloat(order.vol_exec),
        averagePrice: parseFloat(order.cost) / parseFloat(order.vol_exec) || 0,
      };
    } catch (error) {
      console.error("Failed to get order status:", error);
      throw error;
    }
  }
}

/**
 * Создаёт экземпляр KrakenService
 */
export function createKrakenService(apiKey: string, apiSecret: string): KrakenService {
  return new KrakenService(apiKey, apiSecret);
}
