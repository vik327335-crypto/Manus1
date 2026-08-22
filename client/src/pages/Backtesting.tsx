import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Backtesting() {
  const [minScore, setMinScore] = useState(6);
  const [stopLoss, setStopLoss] = useState(5);
  const [takeProfit, setTakeProfit] = useState(15);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">CAN SLIM Backtesting</h1>
          <p className="text-muted-foreground">Historical analysis is shown only when a verified data set and reproducible run are available.</p>
        </div>

        <div className="grid gap-6">
          <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            <CardContent className="pt-6 text-sm">
              This screen currently has no verified historical-data run attached. It does not display estimated returns, win rate, profit factor, equity curves, trades, Monte Carlo outputs, or export files. Parameters below are research inputs only and do not execute a strategy or create trading instructions.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backtest Configuration</CardTitle>
              <CardDescription>Research inputs for a future reproducible historical run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="minScore">Min CAN SLIM Score</Label>
                  <Input id="minScore" type="number" min="0" max="10" step="0.5" value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="stopLoss">Stop Loss %</Label>
                  <Input id="stopLoss" type="number" min="1" max="20" step="0.5" value={stopLoss} onChange={(event) => setStopLoss(Number(event.target.value))} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="takeProfit">Take Profit %</Label>
                  <Input id="takeProfit" type="number" min="5" max="50" step="1" value={takeProfit} onChange={(event) => setTakeProfit(Number(event.target.value))} className="mt-2" />
                </div>
                <div className="flex items-end">
                  <Button className="w-full" disabled>Verified historical data required</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              ["Total Return", "—"],
              ["Win Rate", "—"],
              ["Sharpe Ratio", "—"],
              ["Max Drawdown", "—"],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-muted-foreground">{value}</div></CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Backtest Output Unavailable</CardTitle>
              <CardDescription>Equity curve, monthly returns, trade history, statistics, and exports will appear only after a run is linked to verified historical data and its methodology.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No calculated results are available for the selected research inputs. This protects against presenting illustrative or stale values as an actual strategy evaluation.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
