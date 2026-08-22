import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PriceTickerProps {
  tickers?: string[];
  className?: string;
}

export function PriceTicker({ tickers = ["BTC", "ETH", "ADA"], className = "" }: PriceTickerProps) {
  const marketDataQuery = trpc.coingecko.getMarketData.useQuery(
    { tickers },
    { refetchInterval: 60_000, refetchOnWindowFocus: true }
  );

  const quotesByTicker = useMemo(
    () => new Map((marketDataQuery.data ?? []).map((quote) => [quote.ticker, quote])),
    [marketDataQuery.data]
  );

  if (marketDataQuery.isLoading) {
    return <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`}>{tickers.map((ticker) => <Card key={ticker} className="flex min-h-40 items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></Card>)}</div>;
  }

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`}>
      {tickers.map((ticker) => {
        const data = quotesByTicker.get(ticker);
        if (!data) {
          return <Card key={ticker} className="p-4"><h3 className="font-bold text-lg">{ticker}</h3><p className="mt-3 text-sm text-muted-foreground">Verified market data is currently unavailable.</p></Card>;
        }

        const isPositive = data.priceChangePercent24h >= 0;
        return (
          <Card key={ticker} className="p-4 hover:shadow-lg transition-shadow">
            <div className="mb-3 flex items-start justify-between">
              <div><h3 className="font-bold text-lg">{ticker}</h3><p className="text-xs text-muted-foreground">CoinGecko · updated {new Date(data.fetchedAt).toLocaleTimeString()}</p></div>
              {isPositive ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
            </div>
            <div className="space-y-2">
              <div><p className="text-2xl font-bold">${data.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p><p className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>{isPositive ? "+" : ""}{data.priceChangePercent24h.toFixed(2)}%</p></div>
              <div className="grid grid-cols-2 gap-2 text-xs"><div className="bg-muted p-2 rounded"><p className="text-muted-foreground">24h Volume</p><p className="font-medium">${(data.volume24h / 1_000_000_000).toFixed(2)}B</p></div><div className="bg-muted p-2 rounded"><p className="text-muted-foreground">Market Cap</p><p className="font-medium">${(data.marketCap / 1_000_000_000).toFixed(2)}B</p></div></div>
              <p className="text-xs text-muted-foreground">Cache age: {Math.ceil(data.cacheAgeMs / 1_000)}s</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
