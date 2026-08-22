import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Backtesting results are displayed only after a verified historical-data run
 * provides traceable source, timeframe, assumptions, and reproducible output.
 */
export function BacktestingEngine() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backtesting Engine</h1>
        <p className="text-muted-foreground mt-2">Research-only historical analysis requires a verified data set and reproducible run.</p>
      </div>

      <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <CardContent className="pt-6 text-sm">
          A verified historical-data source is not attached to this route. The application therefore does not generate candles, invoke SMA or RSI calculations, or display return, win-rate, Sharpe, drawdown, profit-factor, or trade metrics. This prevents simulated inputs from being presented as a strategy evaluation.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verified Historical Data Required</CardTitle>
          <CardDescription>To enable a backtest, the run must identify an auditable data source, asset universe, UTC timeframe, fees/slippage assumptions, and immutable parameters.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Backtest unavailable without verified data</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Total Return", "Win Rate", "Sharpe Ratio", "Max Drawdown", "Profit Factor", "Trade History"].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-muted-foreground">—</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default BacktestingEngine;
