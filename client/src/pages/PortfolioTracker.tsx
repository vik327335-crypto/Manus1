import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface Position {
  ticker: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
}

export default function PortfolioTracker() {
  const [positions, setPositions] = useState<Position[]>([
    { ticker: "BTC", quantity: 0.5, entryPrice: 40000, currentPrice: 64211 },
    { ticker: "ETH", quantity: 5, entryPrice: 2000, currentPrice: 1800.31 },
    { ticker: "SOL", quantity: 100, entryPrice: 50, currentPrice: 78.17 },
  ]);

  const [newPosition, setNewPosition] = useState<Position>({
    ticker: "",
    quantity: 0,
    entryPrice: 0,
    currentPrice: 0,
  });

  // Calculate portfolio metrics
  const portfolioMetricsQuery = trpc.portfolioManagement.calculatePortfolioMetrics.useQuery(
    positions
  );
  const riskMetricsQuery = trpc.portfolioManagement.calculateRiskMetrics.useQuery(positions);
  const diversificationQuery = trpc.portfolioManagement.calculateDiversificationScore.useQuery(
    positions.map((p) => ({
      ticker: p.ticker,
      quantity: p.quantity,
      currentPrice: p.currentPrice,
    }))
  );

  const metrics = portfolioMetricsQuery.data?.data;
  const riskMetrics = riskMetricsQuery.data?.data;
  const diversificationScore = diversificationQuery.data?.data?.score;

  const handleAddPosition = () => {
    if (newPosition.ticker && newPosition.quantity > 0) {
      setPositions([...positions, newPosition]);
      setNewPosition({ ticker: "", quantity: 0, entryPrice: 0, currentPrice: 0 });
    }
  };

  const handleRemovePosition = (ticker: string) => {
    setPositions(positions.filter((p) => p.ticker !== ticker));
  };

  // Prepare chart data
  const allocationData = positions.map((pos) => ({
    name: pos.ticker,
    value: pos.quantity * pos.currentPrice,
  }));

  const performanceData = positions.map((pos) => ({
    ticker: pos.ticker,
    gainLoss: ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100,
  }));

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Tracker</h1>
        <p className="text-gray-600">Monitor your positions and portfolio performance</p>
      </div>

      {/* Portfolio Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalValue.toFixed(2)}</div>
              <p className="text-xs text-gray-500">
                Cost: ${metrics.totalCost.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  metrics.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${metrics.totalGainLoss.toFixed(2)}
              </div>
              <p className={`text-xs ${metrics.totalGainLossPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {metrics.totalGainLossPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Day Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  metrics.dayGainLoss >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${metrics.dayGainLoss.toFixed(2)}
              </div>
              <p className={`text-xs ${metrics.dayGainLossPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {metrics.dayGainLossPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.positionCount}</div>
              <p className="text-xs text-gray-500">Active holdings</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Metrics */}
      {riskMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Volatility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riskMetrics.volatility.toFixed(2)}%</div>
              <p className="text-xs text-gray-500">Standard deviation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sharpe Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</div>
              <p className="text-xs text-gray-500">Risk-adjusted return</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Max Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {riskMetrics.maxDrawdown.toFixed(2)}%
              </div>
              <p className="text-xs text-gray-500">Peak to trough</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Diversification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{diversificationScore?.toFixed(1) || 0}%</div>
              <p className="text-xs text-gray-500">Portfolio spread</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance by Position */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Position</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ticker" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="gainLoss" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Ticker</th>
                  <th className="text-right py-2">Quantity</th>
                  <th className="text-right py-2">Entry Price</th>
                  <th className="text-right py-2">Current Price</th>
                  <th className="text-right py-2">Gain/Loss</th>
                  <th className="text-right py-2">Gain/Loss %</th>
                  <th className="text-center py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const gainLoss = pos.quantity * (pos.currentPrice - pos.entryPrice);
                  const gainLossPercent =
                    ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
                  return (
                    <tr key={pos.ticker} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-semibold">{pos.ticker}</td>
                      <td className="text-right py-2">{pos.quantity}</td>
                      <td className="text-right py-2">${pos.entryPrice.toFixed(2)}</td>
                      <td className="text-right py-2">${pos.currentPrice.toFixed(2)}</td>
                      <td className={`text-right py-2 ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${gainLoss.toFixed(2)}
                      </td>
                      <td className={`text-right py-2 ${gainLossPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {gainLossPercent.toFixed(2)}%
                      </td>
                      <td className="text-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePosition(pos.ticker)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Position */}
      <Card>
        <CardHeader>
          <CardTitle>Add Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Ticker</Label>
              <Input
                placeholder="BTC"
                value={newPosition.ticker}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, ticker: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="0.5"
                value={newPosition.quantity || ""}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, quantity: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <Label>Entry Price</Label>
              <Input
                type="number"
                placeholder="40000"
                value={newPosition.entryPrice || ""}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    entryPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Current Price</Label>
              <Input
                type="number"
                placeholder="64211"
                value={newPosition.currentPrice || ""}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    currentPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddPosition} className="w-full">
                Add Position
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
