import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

interface PortfolioAsset {
  id: string;
  ticker: string;
  name: string;
  allocation: number; // percentage
  score: number;
  performance30d: number;
  volatility: number;
}

interface CorrelationMatrix {
  [key: string]: { [key: string]: number };
}

const mockPortfolioAssets: PortfolioAsset[] = [
  {
    id: "1",
    ticker: "BTC",
    name: "Bitcoin",
    allocation: 40,
    score: 79,
    performance30d: 15,
    volatility: 8.5,
  },
  {
    id: "2",
    ticker: "ETH",
    name: "Ethereum",
    allocation: 30,
    score: 72,
    performance30d: 12,
    volatility: 9.2,
  },
  {
    id: "3",
    ticker: "SOL",
    name: "Solana",
    allocation: 20,
    score: 68,
    performance30d: 18,
    volatility: 12.1,
  },
  {
    id: "4",
    ticker: "ADA",
    name: "Cardano",
    allocation: 10,
    score: 55,
    performance30d: 8,
    volatility: 10.3,
  },
];

const mockCorrelationMatrix: CorrelationMatrix = {
  BTC: { BTC: 1.0, ETH: 0.72, SOL: 0.65, ADA: 0.58 },
  ETH: { BTC: 0.72, ETH: 1.0, SOL: 0.68, ADA: 0.61 },
  SOL: { BTC: 0.65, ETH: 0.68, SOL: 1.0, ADA: 0.55 },
  ADA: { BTC: 0.58, ETH: 0.61, SOL: 0.55, ADA: 1.0 },
};

const performanceData = [
  { date: "30d ago", BTC: 0, ETH: 0, SOL: 0, ADA: 0 },
  { date: "25d ago", BTC: 2, ETH: 1.5, SOL: 3, ADA: 1 },
  { date: "20d ago", BTC: 5, ETH: 4, SOL: 7, ADA: 2 },
  { date: "15d ago", BTC: 8, ETH: 6, SOL: 10, ADA: 3 },
  { date: "10d ago", BTC: 11, ETH: 9, SOL: 14, ADA: 5 },
  { date: "5d ago", BTC: 13, ETH: 11, SOL: 17, ADA: 7 },
  { date: "Today", BTC: 15, ETH: 12, SOL: 18, ADA: 8 },
];

export default function PortfolioComparison() {
  const [, setLocation] = useLocation();
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>(mockPortfolioAssets);

  const totalAllocation = portfolio.reduce((sum, asset) => sum + asset.allocation, 0);
  const portfolioScore = Math.round(
    portfolio.reduce((sum, asset) => sum + asset.score * (asset.allocation / 100), 0)
  );
  const portfolioPerformance = portfolio.reduce(
    (sum, asset) => sum + asset.performance30d * (asset.allocation / 100),
    0
  ).toFixed(2);

  const removeAsset = (id: string) => {
    const newPortfolio = portfolio.filter((asset) => asset.id !== id);
    setPortfolio(newPortfolio);
  };

  const rebalance = () => {
    // Simple equal-weight rebalancing
    const equalWeight = 100 / portfolio.length;
    const rebalanced = portfolio.map((asset) => ({
      ...asset,
      allocation: Math.round(equalWeight * 10) / 10,
    }));
    setPortfolio(rebalanced);
  };

  const exportPortfolio = () => {
    const data = {
      portfolio,
      correlationMatrix: mockCorrelationMatrix,
      summary: {
        totalAllocation,
        portfolioScore,
        portfolioPerformance,
      },
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-4xl font-bold">Portfolio Comparison</h1>
          <p className="text-muted-foreground mt-2">
            Analyze your crypto portfolio with correlation analysis and rebalancing recommendations
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAllocation}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalAllocation === 100 ? "Fully allocated" : `${100 - totalAllocation}% available`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Portfolio Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioScore}</div>
              <p className="text-xs text-muted-foreground mt-1">Weighted CAN SLIM score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">30d Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{portfolioPerformance}%</div>
              <p className="text-xs text-muted-foreground mt-1">Portfolio return</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.length}</div>
              <p className="text-xs text-muted-foreground mt-1">In portfolio</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-8">
          <Button onClick={rebalance} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Rebalance
          </Button>
          <Button onClick={exportPortfolio} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Portfolio Assets Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Portfolio Assets</CardTitle>
            <CardDescription>Your current holdings and allocations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Asset</th>
                    <th className="text-right py-3 px-4">Allocation</th>
                    <th className="text-right py-3 px-4">CAN SLIM Score</th>
                    <th className="text-right py-3 px-4">30d Performance</th>
                    <th className="text-right py-3 px-4">Volatility</th>
                    <th className="text-right py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((asset) => (
                    <tr key={asset.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold">{asset.ticker}</p>
                          <p className="text-xs text-muted-foreground">{asset.name}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge variant="secondary">{asset.allocation}%</Badge>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="font-semibold">{asset.score}</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-green-600 font-semibold">+{asset.performance30d}%</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="text-amber-600">{asset.volatility}%</span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAsset(asset.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>30-day performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="BTC" stroke="#f7931a" strokeWidth={2} />
                <Line type="monotone" dataKey="ETH" stroke="#627eea" strokeWidth={2} />
                <Line type="monotone" dataKey="SOL" stroke="#14f195" strokeWidth={2} />
                <Line type="monotone" dataKey="ADA" stroke="#0033ad" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Correlation Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Correlation Matrix</CardTitle>
            <CardDescription>Asset correlation analysis (1.0 = perfect correlation, 0 = no correlation)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Asset</th>
                    {portfolio.map((asset) => (
                      <th key={asset.ticker} className="text-center py-3 px-4">
                        {asset.ticker}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((asset) => (
                    <tr key={asset.ticker} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-semibold">{asset.ticker}</td>
                      {portfolio.map((otherAsset) => {
                        const correlation =
                          mockCorrelationMatrix[asset.ticker]?.[otherAsset.ticker] || 0;
                        const bgColor =
                          correlation > 0.8
                            ? "bg-red-100"
                            : correlation > 0.6
                              ? "bg-yellow-100"
                              : "bg-green-100";
                        return (
                          <td key={otherAsset.ticker} className={`text-center py-3 px-4 ${bgColor}`}>
                            {correlation.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
