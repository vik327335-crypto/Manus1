import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { Download, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface BacktestResult {
  id: string;
  strategyName: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  avgWinSize: number;
  avgLossSize: number;
  equityCurve: Array<{ date: string; value: number }>;
  trades: Array<{ entryDate: string; exitDate: string; entryPrice: number; exitPrice: number; profit: number }>;
  monthlyReturns: Array<{ month: string; return: number }>;
  drawdownSeries: Array<{ date: string; drawdown: number }>;
}

interface MonteCarlo {
  iteration: number;
  finalValue: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export const BacktestingDashboard: React.FC = () => {
  const [selectedBacktest, setSelectedBacktest] = useState<BacktestResult | null>(null);
  const [monteCarloSimulations, setMonteCarloSimulations] = useState<MonteCarlo[]>([]);
  const [showMonteCarloResults, setShowMonteCarloResults] = useState(false);

  // Mock data
  const mockBacktestResults: BacktestResult[] = [
    {
      id: '1',
      strategyName: 'CAN SLIM Momentum',
      startDate: '2023-01-01',
      endDate: '2024-12-31',
      initialCapital: 100000,
      finalCapital: 245000,
      totalReturn: 145,
      annualizedReturn: 56.2,
      sharpeRatio: 1.85,
      maxDrawdown: -18.5,
      winRate: 62.5,
      totalTrades: 48,
      profitableTrades: 30,
      avgWinSize: 8500,
      avgLossSize: 3200,
      equityCurve: [
        { date: '2023-01-01', value: 100000 },
        { date: '2023-06-01', value: 125000 },
        { date: '2023-12-01', value: 150000 },
        { date: '2024-06-01', value: 195000 },
        { date: '2024-12-31', value: 245000 },
      ],
      trades: [
        { entryDate: '2023-01-15', exitDate: '2023-02-10', entryPrice: 42000, exitPrice: 45500, profit: 8330 },
        { entryDate: '2023-02-20', exitDate: '2023-03-15', entryPrice: 45000, exitPrice: 43200, profit: -4000 },
      ],
      monthlyReturns: [
        { month: 'Jan 2023', return: 8.5 },
        { month: 'Feb 2023', return: -2.1 },
        { month: 'Mar 2023', return: 12.3 },
        { month: 'Apr 2023', return: 5.8 },
        { month: 'May 2023', return: 9.2 },
        { month: 'Jun 2023', return: 7.1 },
      ],
      drawdownSeries: [
        { date: '2023-01-01', drawdown: 0 },
        { date: '2023-03-15', drawdown: -5.2 },
        { date: '2023-06-01', drawdown: -1.8 },
        { date: '2023-09-01', drawdown: -18.5 },
        { date: '2024-01-01', drawdown: -8.3 },
        { date: '2024-12-31', drawdown: 0 },
      ],
    },
  ];

  const generateMonteCarloSimulations = (backtest: BacktestResult, iterations: number = 1000) => {
    const simulations: MonteCarlo[] = [];
    const tradeReturns = backtest.trades.map((t) => t.profit);
    const avgReturn = tradeReturns.reduce((a, b) => a + b, 0) / tradeReturns.length;
    const stdDev = Math.sqrt(
      tradeReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / tradeReturns.length
    );

    for (let i = 0; i < iterations; i++) {
      let capital = backtest.initialCapital;
      let maxDD = 0;
      let peak = capital;

      for (let j = 0; j < backtest.totalTrades; j++) {
        const randomReturn = avgReturn + stdDev * (Math.random() + Math.random() - 1);
        capital += randomReturn;
        peak = Math.max(peak, capital);
        const dd = (capital - peak) / peak;
        maxDD = Math.min(maxDD, dd);
      }

      simulations.push({
        iteration: i,
        finalValue: capital,
        maxDrawdown: maxDD * 100,
        sharpeRatio: (avgReturn / stdDev) * Math.sqrt(252),
      });
    }

    return simulations;
  };

  const handleRunMonteCarlo = () => {
    if (selectedBacktest) {
      const simulations = generateMonteCarloSimulations(selectedBacktest);
      setMonteCarloSimulations(simulations);
      setShowMonteCarloResults(true);
    }
  };

  const backtestStats = useMemo(() => {
    if (!selectedBacktest) return null;

    const avgMonthlyReturn =
      selectedBacktest.monthlyReturns.reduce((sum, m) => sum + m.return, 0) / selectedBacktest.monthlyReturns.length;
    const profitFactor = selectedBacktest.avgWinSize * selectedBacktest.profitableTrades / (selectedBacktest.avgLossSize * (selectedBacktest.totalTrades - selectedBacktest.profitableTrades));

    return {
      avgMonthlyReturn,
      profitFactor,
      recoveryFactor: selectedBacktest.totalReturn / Math.abs(selectedBacktest.maxDrawdown),
    };
  }, [selectedBacktest]);

  const monteCarloStats = useMemo(() => {
    if (monteCarloSimulations.length === 0) return null;

    const finalValues = monteCarloSimulations.map((s) => s.finalValue);
    const maxDrawdowns = monteCarloSimulations.map((s) => s.maxDrawdown);

    return {
      avgFinalValue: finalValues.reduce((a, b) => a + b, 0) / finalValues.length,
      minFinalValue: Math.min(...finalValues),
      maxFinalValue: Math.max(...finalValues),
      percentile95: finalValues.sort((a, b) => a - b)[Math.floor(finalValues.length * 0.95)],
      avgMaxDD: maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length,
      worstDD: Math.min(...maxDrawdowns),
    };
  }, [monteCarloSimulations]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backtesting Dashboard</h1>
        <p className="text-gray-600">Analyze strategy performance with detailed metrics and Monte Carlo simulations</p>
      </div>

      {/* Backtest Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Select Backtest</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockBacktestResults.map((backtest) => (
            <button
              key={backtest.id}
              onClick={() => {
                setSelectedBacktest(backtest);
                setShowMonteCarloResults(false);
              }}
              className={`p-4 border-2 rounded-lg text-left transition ${
                selectedBacktest?.id === backtest.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold">{backtest.strategyName}</p>
              <p className="text-sm text-gray-600">
                {backtest.startDate} to {backtest.endDate}
              </p>
              <p className="text-sm font-semibold text-green-600">+{backtest.totalReturn}%</p>
            </button>
          ))}
        </div>
      </Card>

      {selectedBacktest && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Total Return</p>
              <p className="text-2xl font-bold text-green-600">+{selectedBacktest.totalReturn}%</p>
              <p className="text-xs text-gray-500">Annualized: {selectedBacktest.annualizedReturn}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Sharpe Ratio</p>
              <p className="text-2xl font-bold">{selectedBacktest.sharpeRatio.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Risk-adjusted return</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Max Drawdown</p>
              <p className="text-2xl font-bold text-red-600">{selectedBacktest.maxDrawdown.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Peak-to-trough decline</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold">{selectedBacktest.winRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{selectedBacktest.profitableTrades}/{selectedBacktest.totalTrades} trades</p>
            </Card>
          </div>

          {/* Equity Curve */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedBacktest.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Returns */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Returns</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={selectedBacktest.monthlyReturns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="return" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Drawdown Series */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Drawdown Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedBacktest.drawdownSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Trade Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600">Avg Win Size</p>
              <p className="text-2xl font-bold text-green-600">${selectedBacktest.avgWinSize.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Avg Loss Size</p>
              <p className="text-2xl font-bold text-red-600">${selectedBacktest.avgLossSize.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600">Profit Factor</p>
              <p className="text-2xl font-bold">{backtestStats?.profitFactor.toFixed(2)}</p>
            </Card>
          </div>

          {/* Monte Carlo Section */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Monte Carlo Simulation</h3>
              <Button onClick={handleRunMonteCarlo} className="gap-2">
                <Activity className="w-4 h-4" />
                Run Simulation (1000 iterations)
              </Button>
            </div>

            {showMonteCarloResults && monteCarloStats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Average Final Value</p>
                    <p className="text-2xl font-bold">${monteCarloStats.avgFinalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">95th Percentile</p>
                    <p className="text-2xl font-bold text-green-600">${monteCarloStats.percentile95.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Worst Case Drawdown</p>
                    <p className="text-2xl font-bold text-red-600">{monteCarloStats.worstDD.toFixed(1)}%</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="finalValue" name="Final Value" />
                    <YAxis dataKey="maxDrawdown" name="Max Drawdown" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Simulations" data={monteCarloSimulations} fill="#8b5cf6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BacktestingDashboard;
