import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketTrendIndicatorProps {
  status: "bullish" | "neutral" | "bearish";
  btcPrice: number;
  btc200EMA: number;
  dominance: number;
  fearGreedIndex: number;
}

export function MarketTrendIndicator({
  status,
  btcPrice,
  btc200EMA,
  dominance,
  fearGreedIndex,
}: MarketTrendIndicatorProps) {
  const isBtcAbove200EMA = btcPrice > btc200EMA;
  const pricePercentFromEMA = ((btcPrice - btc200EMA) / btc200EMA) * 100;

  const getStatusIcon = () => {
    switch (status) {
      case "bullish":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "bearish":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-amber-600" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "bullish":
        return "Bullish";
      case "bearish":
        return "Bearish";
      default:
        return "Neutral";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "bullish":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
      case "bearish":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      default:
        return "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800";
    }
  };

  return (
    <div className={cn("rounded-lg border p-6", getStatusColor())}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Market Status</h3>
            <p className="text-lg font-bold">{getStatusLabel()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">BTC Price</p>
          <p className="text-sm font-semibold">${(btcPrice / 100).toFixed(0)}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">200 EMA</p>
          <p className="text-sm font-semibold">${(btc200EMA / 100).toFixed(0)}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Distance from EMA</p>
          <p className={cn("text-sm font-semibold", isBtcAbove200EMA ? "text-green-600" : "text-red-600")}>
            {isBtcAbove200EMA ? "+" : ""}{pricePercentFromEMA.toFixed(1)}%
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">BTC Dominance</p>
          <p className="text-sm font-semibold">{(dominance / 100).toFixed(1)}%</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Fear & Greed</p>
          <p className="text-sm font-semibold">{fearGreedIndex}</p>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        {isBtcAbove200EMA ? (
          <p>✓ Bitcoin is trading above the 200-day EMA - Bullish signal</p>
        ) : (
          <p>✗ Bitcoin is trading below the 200-day EMA - Bearish signal</p>
        )}
      </div>
    </div>
  );
}
