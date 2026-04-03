import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { StrategyExportButton } from "@/components/StrategyExportButton";

export default function Backtesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [minScore, setMinScore] = useState(6);
  const [stopLoss, setStopLoss] = useState(5);
  const [takeProfit, setTakeProfit] = useState(15);
  const [isExporting, setIsExporting] = useState(false);
  const [showStrategyExport, setShowStrategyExport] = useState(false);

  // Export mutations
  const exportPdfMutation = trpc.export.assetPDF.useMutation();
  const exportExcelMutation = trpc.export.portfolioExcel.useMutation();
  const exportCsvMutation = trpc.export.csv.useMutation();

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const result = await exportPdfMutation.mutateAsync({
        ticker: "BACKTEST",
        name: "CAN SLIM Backtesting Report",
        currentPrice: 0,
        marketCap: 0,
        volume24h: 0,
        circulatingSupply: "N/A",
        totalSupply: "N/A",
        description: `Backtesting Results - Min Score: ${minScore}, Stop Loss: ${stopLoss}%, Take Profit: ${takeProfit}%`,
        totalScore: Math.round(backtestResults.winRate),
        criteria: {
          c: backtestResults.winRate,
          a: backtestResults.sharpeRatio * 10,
          n: backtestResults.profitFactor * 10,
          s: 50,
          l: backtestResults.totalPnLPercent,
          i: 60,
          m: 70,
        },
      } as any);
      if (result.success && result.data) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${result.data}`;
        link.download = result.filename || "backtesting-report.pdf";
        link.click();
        toast.success("PDF exported successfully");
      }
    } catch (error) {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const result = await exportExcelMutation.mutateAsync({
        assets: [
          {
            ticker: "BACKTEST",
            name: "CAN SLIM Backtesting Report",
            score: Math.round(backtestResults.winRate),
            price: 0,
            change24h: backtestResults.totalPnLPercent,
            allocation: 100,
          },
        ],
        totalValue: backtestResults.totalPnL,
        totalReturn: backtestResults.totalPnLPercent,
        metrics: {
          winRate: backtestResults.winRate,
          sharpeRatio: backtestResults.sharpeRatio,
          maxDrawdown: backtestResults.maxDrawdown,
          profitFactor: backtestResults.profitFactor,
        },
      } as any);
      if (result.success && result.data) {
        const link = document.createElement("a");
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
        link.download = result.filename || "backtesting-report.xlsx";
        link.click();
        toast.success("Excel exported successfully");
      }
    } catch (error) {
      toast.error("Failed to export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // Mock backtest results (moved after export functions)
  const backtestResults = {
    totalTrades: 24,
    winningTrades: 16,
    losingTrades: 8,
    winRate: 66.7,
    totalPnL: 12500,
    totalPnLPercent: 25,
    averageWin: 1562.5,
    averageLoss: 937.5,
    profitFactor: 2.67,
    sharpeRatio: 1.85,
    maxDrawdown: 8.5,
  };

  // Mock equity curve data
  const equityCurveData = [
    { date: "Jan 1", equity: 50000 },
    { date: "Jan 15", equity: 51200 },
    { date: "Feb 1", equity: 53500 },
    { date: "Feb 15", equity: 52100 },
    { date: "Mar 1", equity: 55800 },
    { date: "Mar 15", equity: 58300 },
    { date: "Apr 1", equity: 59200 },
    { date: "Apr 15", equity: 61500 },
    { date: "May 1", equity: 62500 },
  ];

  // Mock monthly returns
  const monthlyReturnsData = [
    { month: "January", return: 2.4 },
    { month: "February", return: 4.3 },
    { month: "March", return: 5.1 },
    { month: "April", return: 3.8 },
    { month: "May", return: 1.9 },
  ];

  // Mock trade list
  const trades = [
    {
      id: 1,
      ticker: "BTC",
      entryDate: "2026-01-05",
      exitDate: "2026-01-12",
      entryPrice: 42000,
      exitPrice: 43500,
      pnl: 1500,
      pnlPercent: 3.57,
      reason: "take_profit",
    },
    {
      id: 2,
      ticker: "ETH",
      entryDate: "2026-01-08",
      exitDate: "2026-01-15",
      entryPrice: 2400,
      exitPrice: 2580,
      pnl: 1800,
      pnlPercent: 7.5,
      reason: "take_profit",
    },
    {
      id: 3,
      ticker: "ADA",
      entryDate: "2026-01-10",
      exitDate: "2026-01-18",
      entryPrice: 0.92,
      exitPrice: 0.87,
      pnl: -500,
      pnlPercent: -5.43,
      reason: "stop_loss",
    },
  ];

  const handleRunBacktest = async () => {
    setIsRunning(true);
    // Simulate backtest execution
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">CAN SLIM Backtesting</h1>
          <p className="text-muted-foreground">
            Test your CAN SLIM strategy on historical data
          </p>
        </div>

        <div className="grid gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Backtest Configuration</CardTitle>
              <CardDescription>Set parameters for historical analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="minScore">Min CAN SLIM Score</Label>
                  <Input
                    id="minScore"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={minScore}
                    onChange={(e) => setMinScore(parseFloat(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="stopLoss">Stop Loss %</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="takeProfit">Take Profit %</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(parseFloat(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleRunBacktest}
                    disabled={isRunning}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      "Run Backtest"
                    )}
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    variant="outline"
                    size="icon"
                    title="Export as PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    variant="outline"
                    size="icon"
                    title="Export as Excel"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setShowStrategyExport(!showStrategyExport)}
                    variant="outline"
                    size="icon"
                    title="Export Strategy"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {showStrategyExport && (
                <div className="mt-6 pt-6 border-t">
                  <StrategyExportButton
                    strategyId="backtest-strategy-001"
                    strategyName={`CAN SLIM Strategy (Score: ${minScore}, SL: ${stopLoss}%, TP: ${takeProfit}%)`}
                    backtestResults={{
                      winRate: backtestResults.winRate / 100,
                      profitFactor: backtestResults.profitFactor,
                      sharpeRatio: backtestResults.sharpeRatio,
                      maxDrawdown: -backtestResults.maxDrawdown,
                      totalReturn: backtestResults.totalPnLPercent,
                      backtestPeriod: {
                        startDate: '2026-01-01',
                        endDate: '2026-05-01',
                      },
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  {backtestResults.totalPnLPercent}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +${backtestResults.totalPnL.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backtestResults.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {backtestResults.winningTrades} wins / {backtestResults.losingTrades} losses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backtestResults.sharpeRatio}</div>
                <p className="text-xs text-muted-foreground mt-1">Risk-adjusted return</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  -{backtestResults.maxDrawdown}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Peak to trough</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="equity" className="w-full">
            <TabsList>
              <TabsTrigger value="equity">Equity Curve</TabsTrigger>
              <TabsTrigger value="returns">Monthly Returns</TabsTrigger>
              <TabsTrigger value="trades">Trade List</TabsTrigger>
            </TabsList>

            <TabsContent value="equity">
              <Card>
                <CardHeader>
                  <CardTitle>Equity Curve</CardTitle>
                  <CardDescription>Portfolio value over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={equityCurveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => `$${value.toLocaleString()}`}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="returns">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Returns</CardTitle>
                  <CardDescription>Return by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyReturnsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar dataKey="return" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trades">
              <Card>
                <CardHeader>
                  <CardTitle>Trade History</CardTitle>
                  <CardDescription>All trades executed during backtest</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Ticker</th>
                          <th className="text-left py-2 px-2">Entry Date</th>
                          <th className="text-left py-2 px-2">Exit Date</th>
                          <th className="text-right py-2 px-2">Entry Price</th>
                          <th className="text-right py-2 px-2">Exit Price</th>
                          <th className="text-right py-2 px-2">P&L</th>
                          <th className="text-right py-2 px-2">Return %</th>
                          <th className="text-left py-2 px-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map((trade) => (
                          <tr key={trade.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2 font-medium">{trade.ticker}</td>
                            <td className="py-2 px-2">{trade.entryDate}</td>
                            <td className="py-2 px-2">{trade.exitDate}</td>
                            <td className="text-right py-2 px-2">${trade.entryPrice}</td>
                            <td className="text-right py-2 px-2">${trade.exitPrice}</td>
                            <td
                              className={`text-right py-2 px-2 font-medium ${
                                trade.pnl > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              ${trade.pnl}
                            </td>
                            <td
                              className={`text-right py-2 px-2 ${
                                trade.pnlPercent > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {trade.pnlPercent > 0 ? "+" : ""}
                              {trade.pnlPercent.toFixed(2)}%
                            </td>
                            <td className="py-2 px-2 text-xs">
                              <span className="bg-muted px-2 py-1 rounded">
                                {trade.reason.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Statistics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{backtestResults.totalTrades}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit Factor</p>
                  <p className="text-2xl font-bold">{backtestResults.profitFactor.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Win</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${backtestResults.averageWin.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Loss</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${backtestResults.averageLoss.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
