import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BacktestingDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backtesting Dashboard</h1>
        <p className="text-muted-foreground">Verified historical analysis is required before performance or simulation results are displayed.</p>
      </div>

      <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <CardContent className="pt-6 text-sm">
          No verified backtest run is attached to this dashboard. It does not show illustrative return, drawdown, equity, trade, profit-factor, or Monte Carlo values. A result must identify its historical data source, timeframe, assumptions, and reproducible run before it can be presented here.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backtest Selection Unavailable</CardTitle>
          <CardDescription>There are no verified historical runs available for review.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Verified run required</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["Total Return", "Sharpe Ratio", "Max Drawdown", "Win Rate"].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-muted-foreground">—</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Output Unavailable</CardTitle>
          <CardDescription>Equity curve, monthly returns, drawdown analysis, trade statistics, Monte Carlo scenarios, and exports are disabled until an auditable run is provided.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This screen intentionally avoids generating random distributions or placeholder performance values, so it cannot be mistaken for a completed strategy evaluation.
        </CardContent>
      </Card>
    </div>
  );
}
