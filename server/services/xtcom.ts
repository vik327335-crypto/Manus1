import crypto from "crypto";

/**
 * XT.COM API Сервис
 * Интеграция с биржей XT.COM для импорта позиций и торговли
 */

interface XTComConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

interface XTComPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface XTComBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

interface XTComTrade {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  commission: number;
  timestamp: number;
}

export class XTComService {
  private config: XTComConfig;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string) {
    this.config = {
      apiKey,
      apiSecret,
    };
    this.baseUrl = "https://api.xt.com/v4";
  }

  /**
   * Генерирует подпись для API запроса
   */
  private generateSignature(
    method: string,
    path: string,
    query: string,
    body: string,
    timestamp: number
  ): string {
    const message = `${method}\n${path}\n${query}\n${body}\n${timestamp}`;
    return crypto
      .createHmac("sha256", this.config.apiSecret)
      .update(message)
      .digest("hex");
  }

  /**
   * Выполняет API запрос к XT.COM
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const timestamp = Date.now();
    const path = `/v4${endpoint}`;
    const query = params ? new URLSearchParams(params).toString() : "";
    const body = method === "POST" ? JSON.stringify(params || {}) : "";

    const signature = this.generateSignature(method, path, query, body, timestamp);

    const headers: Record<string, string> = {
      "X-XT-KEY": this.config.apiKey,
      "X-XT-TIMESTAMP": timestamp.toString(),
      "X-XT-SIGN": signature,
      "Content-Type": "application/json",
    };

    const url = `${this.baseUrl}${endpoint}${query ? "?" + query : ""}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method === "POST" ? body : undefined,
      });

      if (!response.ok) {
        throw new Error(`XT.COM API Error: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error("XT.COM API Error:", error);
      throw error;
    }
  }

  /**
   * Получает балансы аккаунта
   */
  async getBalances(): Promise<XTComBalance[]> {
    const response = await this.makeRequest<{
      result: Array<{
        asset: string;
        free: string;
        locked: string;
      }>;
    }>("GET", "/account/balances");

    return response.result.map((item) => ({
      asset: item.asset,
      free: parseFloat(item.free),
      locked: parseFloat(item.locked),
      total: parseFloat(item.free) + parseFloat(item.locked),
    }));
  }

  /**
   * Получает открытые позиции
   */
  async getOpenPositions(): Promise<XTComPosition[]> {
    const response = await this.makeRequest<{
      result: Array<{
        symbol: string;
        quantity: string;
        entryPrice: string;
        currentPrice: string;
        pnl: string;
        pnlPercent: string;
      }>;
    }>("GET", "/account/positions");

    return response.result.map((item) => ({
      symbol: item.symbol,
      quantity: parseFloat(item.quantity),
      entryPrice: parseFloat(item.entryPrice),
      currentPrice: parseFloat(item.currentPrice),
      pnl: parseFloat(item.pnl),
      pnlPercent: parseFloat(item.pnlPercent),
    }));
  }

  /**
   * Получает историю сделок
   */
  async getTrades(symbol?: string, limit: number = 100): Promise<XTComTrade[]> {
    const params: Record<string, any> = { limit };
    if (symbol) params.symbol = symbol;

    const response = await this.makeRequest<{
      result: Array<{
        id: string;
        symbol: string;
        side: "BUY" | "SELL";
        price: string;
        quantity: string;
        commission: string;
        timestamp: number;
      }>;
    }>("GET", "/account/trades", params);

    return response.result.map((item) => ({
      id: item.id,
      symbol: item.symbol,
      side: item.side,
      price: parseFloat(item.price),
      quantity: parseFloat(item.quantity),
      commission: parseFloat(item.commission),
      timestamp: item.timestamp,
    }));
  }

  /**
   * Получает текущую цену актива
   */
  async getPrice(symbol: string): Promise<number> {
    const response = await this.makeRequest<{
      result: {
        price: string;
      };
    }>("GET", `/market/ticker/price`, { symbol });

    return parseFloat(response.result.price);
  }

  /**
   * Получает информацию о рынке
   */
  async getMarketInfo(symbol: string): Promise<{
    symbol: string;
    price: number;
    volume24h: number;
    change24h: number;
  }> {
    const response = await this.makeRequest<{
      result: {
        symbol: string;
        lastPrice: string;
        volume: string;
        priceChangePercent: string;
      };
    }>("GET", `/market/ticker`, { symbol });

    return {
      symbol: response.result.symbol,
      price: parseFloat(response.result.lastPrice),
      volume24h: parseFloat(response.result.volume),
      change24h: parseFloat(response.result.priceChangePercent),
    };
  }

  /**
   * Размещает ордер на покупку
   */
  async placeBuyOrder(
    symbol: string,
    quantity: number,
    price?: number
  ): Promise<{ orderId: string; status: string }> {
    const params = {
      symbol,
      quantity: quantity.toString(),
      side: "BUY",
      type: price ? "LIMIT" : "MARKET",
      ...(price && { price: price.toString() }),
    };

    const response = await this.makeRequest<{
      result: {
        orderId: string;
        status: string;
      };
    }>("POST", "/account/order", params);

    return response.result;
  }

  /**
   * Размещает ордер на продажу
   */
  async placeSellOrder(
    symbol: string,
    quantity: number,
    price?: number
  ): Promise<{ orderId: string; status: string }> {
    const params = {
      symbol,
      quantity: quantity.toString(),
      side: "SELL",
      type: price ? "LIMIT" : "MARKET",
      ...(price && { price: price.toString() }),
    };

    const response = await this.makeRequest<{
      result: {
        orderId: string;
        status: string;
      };
    }>("POST", "/account/order", params);

    return response.result;
  }

  /**
   * Отменяет ордер
   */
  async cancelOrder(symbol: string, orderId: string): Promise<{ status: string }> {
    const response = await this.makeRequest<{
      result: {
        status: string;
      };
    }>("DELETE", "/account/order", { symbol, orderId });

    return response.result;
  }

  /**
   * Получает статус ордера
   */
  async getOrderStatus(symbol: string, orderId: string): Promise<{
    orderId: string;
    status: string;
    filledQuantity: number;
    averagePrice: number;
  }> {
    const response = await this.makeRequest<{
      result: {
        orderId: string;
        status: string;
        filledQuantity: string;
        averagePrice: string;
      };
    }>("GET", "/account/order", { symbol, orderId });

    return {
      orderId: response.result.orderId,
      status: response.result.status,
      filledQuantity: parseFloat(response.result.filledQuantity),
      averagePrice: parseFloat(response.result.averagePrice),
    };
  }
}

/**
 * Создаёт экземпляр XT.COM сервиса
 */
export function createXTComService(apiKey: string, apiSecret: string): XTComService {
  return new XTComService(apiKey, apiSecret);
}
