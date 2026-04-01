import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface PriceTickerData {
  ticker: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
}

interface PriceTickerProps {
  tickers?: string[];
  className?: string;
}

export function PriceTicker({ tickers = ["BTC", "ETH", "ADA"], className = "" }: PriceTickerProps) {
  const [prices, setPrices] = useState<Record<string, PriceTickerData>>({});
  const [isConnected, setIsConnected] = useState(false);

  const { isConnected: wsConnected, subscribeToPrices, onPriceUpdate } = useWebSocket({
    autoConnect: false, // Disable auto-connect to prevent timeout errors in demo
  });

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  useEffect(() => {
    if (isConnected && subscribeToPrices) {
      subscribeToPrices(tickers);
    }
  }, [isConnected, tickers, subscribeToPrices]);

  useEffect(() => {
    if (!onPriceUpdate) return;
    const unsubscribe = onPriceUpdate((data) => {
      setPrices((prev) => ({
        ...prev,
        [data.ticker]: data,
      }));
    });

    return unsubscribe;
  }, [onPriceUpdate]);

  // Mock data for demo
  const mockPrices: Record<string, PriceTickerData> = {
    BTC: {
      ticker: "BTC",
      price: 45230,
      change24h: 2.5,
      high24h: 46100,
      low24h: 44500,
      volume24h: 28500000000,
      marketCap: 890000000000,
    },
    ETH: {
      ticker: "ETH",
      price: 2850,
      change24h: -1.2,
      high24h: 2950,
      low24h: 2800,
      volume24h: 15200000000,
      marketCap: 342000000000,
    },
    ADA: {
      ticker: "ADA",
      price: 0.95,
      change24h: 5.3,
      high24h: 0.98,
      low24h: 0.89,
      volume24h: 450000000,
      marketCap: 33000000000,
    },
  };

  const displayPrices = Object.keys(prices).length > 0 ? prices : mockPrices;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {tickers.map((ticker) => {
        const data = displayPrices[ticker];
        if (!data) return null;

        const isPositive = data.change24h >= 0;

        return (
          <Card key={ticker} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{ticker}</h3>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Live" : "Demo"}
                </p>
              </div>
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold">
                  ${data.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
                <p
                  className={`text-sm font-medium ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {data.change24h.toFixed(2)}%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted p-2 rounded">
                  <p className="text-muted-foreground">High 24h</p>
                  <p className="font-medium">
                    ${data.high24h.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-muted p-2 rounded">
                  <p className="text-muted-foreground">Low 24h</p>
                  <p className="font-medium">
                    ${data.low24h.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-muted p-2 rounded text-xs">
                <p className="text-muted-foreground">24h Volume</p>
                <p className="font-medium">
                  ${(data.volume24h / 1000000000).toFixed(2)}B
                </p>
              </div>

              <div className="bg-muted p-2 rounded text-xs">
                <p className="text-muted-foreground">Market Cap</p>
                <p className="font-medium">
                  ${(data.marketCap / 1000000000).toFixed(2)}B
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
