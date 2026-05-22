import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Zap } from 'lucide-react';

interface StrategyMetricsCardProps {
  strategyName: string;
  winRate: number;
  roi: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  netProfit: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StrategyMetricsCard({
  strategyName,
  winRate,
  roi,
  profitFactor,
  sharpeRatio,
  maxDrawdown,
  totalTrades,
  netProfit,
  isSelected = false,
  onClick,
}: StrategyMetricsCardProps) {
  const getColorClass = (value: number, thresholds: { good: number; bad: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value <= thresholds.bad) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getBackgroundClass = (value: number, thresholds: { good: number; bad: number }) => {
    if (value >= thresholds.good) return 'bg-green-50';
    if (value <= thresholds.bad) return 'bg-red-50';
    return 'bg-yellow-50';
  };

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{strategyName}</CardTitle>
        <p className="text-sm text-gray-500">{totalTrades} сделок</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Win Rate */}
        <div className={`p-3 rounded-lg ${getBackgroundClass(winRate, { good: 55, bad: 45 })}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Win Rate</span>
            <span className={`text-lg font-bold ${getColorClass(winRate, { good: 55, bad: 45 })}`}>
              {winRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ROI */}
        <div className={`p-3 rounded-lg ${getBackgroundClass(roi, { good: 10, bad: -10 })}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">ROI</span>
            </div>
            <span className={`text-lg font-bold ${getColorClass(roi, { good: 10, bad: -10 })}`}>
              {roi.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Profit Factor */}
        <div className={`p-3 rounded-lg ${getBackgroundClass(profitFactor, { good: 2, bad: 1 })}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Profit Factor</span>
            </div>
            <span className={`text-lg font-bold ${getColorClass(profitFactor, { good: 2, bad: 1 })}`}>
              {profitFactor.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className={`p-3 rounded-lg ${getBackgroundClass(sharpeRatio, { good: 1, bad: -1 })}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Sharpe Ratio</span>
            </div>
            <span className={`text-lg font-bold ${getColorClass(sharpeRatio, { good: 1, bad: -1 })}`}>
              {sharpeRatio.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className={`p-3 rounded-lg ${getBackgroundClass(-maxDrawdown, { good: -10, bad: -30 })}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Max Drawdown</span>
            </div>
            <span className={`text-lg font-bold ${getColorClass(-maxDrawdown, { good: -10, bad: -30 })}`}>
              {maxDrawdown.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Net Profit</span>
            </div>
            <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
