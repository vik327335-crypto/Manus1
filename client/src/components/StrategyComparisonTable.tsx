import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
interface StrategyMetrics {
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  lossRate?: number;
  totalProfit: number;
  totalLoss: number;
  netProfit?: number;
  roi: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  avgWin?: number;
  avgLoss?: number;
  expectancy?: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgTradeTime?: number;
  bestTrade?: number;
  worstTrade?: number;
  recoveryFactor?: number;
  profitability?: number;
  lastUpdated?: number;
}

interface StrategyComparisonTableProps {
  strategies: StrategyMetrics[];
  onStrategySelect?: (strategy: StrategyMetrics) => void;
}

type SortKey = keyof StrategyMetrics;
type SortOrder = 'asc' | 'desc';

export function StrategyComparisonTable({
  strategies,
  onStrategySelect,
}: StrategyComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('roi');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedStrategies = [...strategies].sort((a, b) => {
    const aVal = a[sortKey as keyof StrategyMetrics];
    const bVal = b[sortKey as keyof StrategyMetrics];

    if (typeof aVal !== 'number' || typeof bVal !== 'number') {
      return 0;
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const SortIcon = ({ active, order }: { active: boolean; order?: SortOrder }) => {
    if (!active) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return order === 'asc' ? (
      <TrendingUp className="w-4 h-4 text-blue-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-blue-600" />
    );
  };

  const getCellColor = (key: string, value: number) => {
    // Определяем, является ли метрика "хорошей" при высоких или низких значениях
    const isHigherBetter = ['winRate', 'roi', 'profitFactor', 'sharpeRatio', 'profitability', 'recoveryFactor'].includes(String(key));
    const isLowerBetter = ['maxDrawdown'].includes(String(key));

    if (isHigherBetter && value > 50) return 'text-green-600';
    if (isHigherBetter && value < 30) return 'text-red-600';
    if (isLowerBetter && value < 20) return 'text-green-600';
    if (isLowerBetter && value > 40) return 'text-red-600';
    return 'text-gray-900';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сравнение стратегий</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Стратегия</th>
                <th className="text-center py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('totalTrades')}
                    className="flex items-center justify-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Сделок
                    <SortIcon active={sortKey === 'totalTrades'} order={sortOrder} />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('winRate')}
                    className="flex items-center justify-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Win Rate
                    <SortIcon active={sortKey === 'winRate'} order={sortOrder} />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('roi')}
                    className="flex items-center justify-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    ROI
                    <SortIcon active={sortKey === 'roi'} order={sortOrder} />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('profitFactor')}
                    className="flex items-center justify-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Profit Factor
                    <SortIcon active={sortKey === 'profitFactor'} order={sortOrder} />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('sharpeRatio')}
                    className="flex items-center justify-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Sharpe Ratio
                    <SortIcon active={sortKey === 'sharpeRatio'} order={sortOrder} />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('maxDrawdown')}
                    className="flex items-center justify-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Max DD
                    <SortIcon active={sortKey === 'maxDrawdown'} order={sortOrder} />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('netProfit')}
                    className="flex items-center justify-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Net Profit
                    <SortIcon active={sortKey === 'netProfit'} order={sortOrder} />
                  </button>
                </th>
                <th className="text-center py-3 px-4 font-semibold">Действие</th>
              </tr>
            </thead>

            <tbody>
              {sortedStrategies.map((strategy, index) => (
                <tr
                  key={strategy.strategyName}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    index === 0 ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-medium">
                    {index === 0 && '🏆 '}
                    {strategy.strategyName}
                  </td>
                  <td className="text-center py-3 px-4">{strategy.totalTrades}</td>
                  <td className={`text-center py-3 px-4 font-semibold ${getCellColor('winRate', strategy.winRate)}`}>
                    {strategy.winRate.toFixed(1)}%
                  </td>
                  <td className={`text-center py-3 px-4 font-semibold ${getCellColor('roi', strategy.roi)}`}>
                    {strategy.roi.toFixed(2)}%
                  </td>
                  <td className={`text-center py-3 px-4 font-semibold ${getCellColor('profitFactor', strategy.profitFactor)}`}>
                    {strategy.profitFactor.toFixed(2)}
                  </td>
                  <td className={`text-center py-3 px-4 font-semibold ${getCellColor('sharpeRatio', strategy.sharpeRatio)}`}>
                    {strategy.sharpeRatio.toFixed(2)}
                  </td>
                  <td className={`text-center py-3 px-4 font-semibold ${getCellColor('maxDrawdown', strategy.maxDrawdown)}`}>
                    {strategy.maxDrawdown.toFixed(2)}%
                  </td>
                  <td className={`text-center py-3 px-4 font-semibold ${(strategy.netProfit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(strategy.netProfit ?? 0).toFixed(2)}
                  </td>
                  <td className="text-center py-3 px-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStrategySelect?.(strategy)}
                    >
                      Выбрать
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {strategies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Нет данных о стратегиях для отображения
          </div>
        )}
      </CardContent>
    </Card>
  );
}
