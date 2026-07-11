/**
 * Polygon.io API Service
 * Provides access to real-time and historical market data for cryptocurrencies
 */

export interface PolygonAggregateBar {
  c: number; // Close price
  h: number; // High price
  l: number; // Low price
  n: number; // Number of items in aggregate
  o: number; // Open price
  t: number; // Timestamp
  v: number; // Volume
  vw: number; // Volume weighted average price
}

export interface PolygonTickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  type: string;
  active: boolean;
  currencyName: string;
  cik: string;
  compositeFigi: string;
  shareClassFigi: string;
  lastUpdated: string;
}

export interface PolygonSnapshot {
  status: string;
  results: {
    ticker: string;
    figi: string;
    price: number;
    lastQuote: {
      exchange: number;
      price: number;
      size: number;
      timeframe: string;
      lastUpdated: number;
    };
    lastTrade: {
      conditions: number[];
      exchange: number;
      price: number;
      sip_timestamp: number;
      size: number;
      timeframe: string;
    };
    option_details: {
      contract_type: string;
      exercise_style: string;
      expiration_date: string;
      shares_per_contract: number;
      strike_price: number;
    };
    market_status: string;
    name: string;
    post_market_change: number;
    post_market_change_percent: number;
    pre_market_change: number;
    pre_market_change_percent: number;
    previous_close: number;
    lastUpdated: number;
  };
}

export class PolygonApiService {
  private apiKey: string;
  private baseUrl = "https://api.polygon.io";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get aggregate bars for a ticker
   */
  async getAggregates(
    ticker: string,
    timespan: "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year",
    from: string,
    to: string,
    limit: number = 120
  ): Promise<PolygonAggregateBar[]> {
    try {
      const url = new URL(`${this.baseUrl}/v2/aggs/ticker/${ticker}/range/1/${timespan}/${from}/${to}`);
      url.searchParams.append("apikey", this.apiKey);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("sort", "asc");

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching aggregates for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get ticker details
   */
  async getTickerDetails(ticker: string): Promise<PolygonTickerDetails | null> {
    try {
      const url = new URL(`${this.baseUrl}/v3/reference/tickers/${ticker}`);
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || null;
    } catch (error) {
      console.error(`Error fetching ticker details for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get market snapshot for a ticker
   */
  async getSnapshot(ticker: string): Promise<PolygonSnapshot | null> {
    try {
      const url = new URL(`${this.baseUrl}/v3/snapshot/ticker/${ticker}`);
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching snapshot for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get previous close data for a ticker
   */
  async getPreviousClose(ticker: string): Promise<any> {
    try {
      const url = new URL(`${this.baseUrl}/v2/aggs/ticker/${ticker}/prev`);
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results?.[0] || null;
    } catch (error) {
      console.error(`Error fetching previous close for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get daily open, high, low, close for a ticker
   */
  async getDailyOHLC(ticker: string, date: string): Promise<any> {
    try {
      const url = new URL(`${this.baseUrl}/v1/open-close/${ticker}/${date}`);
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching daily OHLC for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get market holidays and early closes
   */
  async getMarketHolidays(): Promise<any[]> {
    try {
      const url = new URL(`${this.baseUrl}/v1/marketstatus/upcoming`);
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("Error fetching market holidays:", error);
      throw error;
    }
  }

  /**
   * Get market status
   */
  async getMarketStatus(): Promise<any> {
    try {
      const url = new URL(`${this.baseUrl}/v1/marketstatus/now`);
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching market status:", error);
      throw error;
    }
  }

  /**
   * Get technical indicators (SMA, EMA, MACD, RSI)
   */
  async getTechnicalIndicator(
    ticker: string,
    indicator: "sma" | "ema" | "macd" | "rsi",
    timespan: string,
    window: number = 20,
    series_type: string = "close"
  ): Promise<any> {
    try {
      const url = new URL(`${this.baseUrl}/v1/indicators/${indicator}/${ticker}`);
      url.searchParams.append("timespan", timespan);
      url.searchParams.append("adjusted", "true");
      url.searchParams.append("window", window.toString());
      url.searchParams.append("series_type", series_type);
      url.searchParams.append("long_window", (window * 2).toString());
      url.searchParams.append("short_window", Math.floor(window / 2).toString());
      url.searchParams.append("signal_window", Math.floor(window / 3).toString());
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching ${indicator} for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get news for a ticker
   */
  async getNews(ticker: string, limit: number = 10): Promise<any[]> {
    try {
      const url = new URL(`${this.baseUrl}/v2/reference/news`);
      url.searchParams.append("ticker", ticker);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("sort", "published_utc");
      url.searchParams.append("order", "desc");
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching news for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get earnings for a company
   */
  async getEarnings(ticker: string, limit: number = 10): Promise<any[]> {
    try {
      const url = new URL(`${this.baseUrl}/v2/reference/company_earnings`);
      url.searchParams.append("ticker", ticker);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching earnings for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Get financial statements
   */
  async getFinancials(ticker: string, limit: number = 10): Promise<any[]> {
    try {
      const url = new URL(`${this.baseUrl}/vX/reference/financials`);
      url.searchParams.append("ticker", ticker);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("apikey", this.apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching financials for ${ticker}:`, error);
      throw error;
    }
  }
}

export default PolygonApiService;
