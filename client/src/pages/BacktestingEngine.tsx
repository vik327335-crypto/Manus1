import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, BarChart3, Activity } from "lucide-react";

/**
 * Backtesting Engine Component
 * Manages strategy backtesting and performance analysis
 */

export function BacktestingEngine() {
  const [activeTab, setActiveTab] = useState("sma");
  const [symbol, setSymbol] = useState("BTC");
  const [initialCapital, setInitialCapital] = useState("10000");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runSMABacktest = trpc.backtestingEngine.runSMABacktest.useMutation();
  const runRSIBacktest = trpc.backtestingEngine.runRSIBacktest.useMutation();

  const handleRunBacktest = async () => {
    if (!symbol || !initialCapital) {
      return;
    }

    setLoading(true);
    try {
      // Mock historical data - in production, fetch from API
      const historicalData = Array.from({ length: 100 }, (_, i) => ({
        time: Date.now() - (100 - i) * 3600000,
        open: 40000 + Math.random() * 5000,
        high: 41000 + Math.random() * 5000,
        low: 39000 + Math.random() * 5000,
        close: 40000 + Math.random() * 5000,
        volume: Math.random() * 1000,
      }));

      if (activeTab === "sma") {
        const result = await runSMABacktest.mutateAsync({
          symbol,
          initialCapital: parseFloat(initialCapital),
          historicalData,
          fastPeriod: 10,
          slowPeriod: 20,
        });
        setResults(result);
      } else {
        const result = await runRSIBacktest.mutateAsync({
          symbol,
          initialCapital: parseFloat(initialCapital),
          historicalData,
        });
        setResults(result);
      }
    } catch (error) {
      console.error("Backtest failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backtesting Engine</h1>
        <p className="text-muted-foreground mt-2">
          Test your trading strategies against historical data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sma">SMA Strategy</TabsTrigger>
          <TabsTrigger value="rsi">RSI Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="sma">
          <Card>
            <CardHeader>
              <CardTitle>Simple Moving Average (SMA)</CardTitle>
              <CardDescription>
                Test a strategy based on crossover of short and long moving averages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Symbol</label>
                  <Input
                    placeholder="BTC, ETH, etc."
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Capital ($)</label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleRunBacktest} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Backtest...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Run Backtest
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rsi">
          <Card>
            <CardHeader>
              <CardTitle>Relative Strength Index (RSI)</CardTitle>
              <CardDescription>
                Test a strategy based on overbought/oversold conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Symbol</label>
                  <Input
                    placeholder="BTC, ETH, etc."
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Capital ($)</label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleRunBacktest} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Backtest...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Run Backtest
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((results.metrics?.totalReturn || 0) * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From ${initialCapital} initial capital
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((results.metrics?.winRate || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {results.metrics?.winningTrades || 0} / {results.metrics?.totalTrades || 0} trades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(results.metrics?.sharpeRatio || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Risk-adjusted return
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className="text-lg font-semibold">
                    {((results.metrics?.maxDrawdown || 0) * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit Factor</p>
                  <p className="text-lg font-semibold">
                    {(results.metrics?.profitFactor || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Win</p>
                  <p className="text-lg font-semibold">
                    ${(results.metrics?.averageWin || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Loss</p>
                  <p className="text-lg font-semibold">
                    ${(results.metrics?.averageLoss || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BacktestingEngine;
