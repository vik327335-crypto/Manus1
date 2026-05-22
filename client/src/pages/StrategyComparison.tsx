import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyMetricsCard } from '@/components/StrategyMetricsCard';
import { StrategyComparisonTable } from '@/components/StrategyComparisonTable';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';

interface StrategyMetrics {
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  lossRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  roi: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgTradeTime: number;
  bestTrade: number;
  worstTrade: number;
  recoveryFactor: number;
  profitability: number;
  lastUpdated: number;
}

export function StrategyComparison() {
  const [strategies, setStrategies] = useState<StrategyMetrics[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyMetrics | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);

  // Загрузка данных о стратегиях
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        setLoading(true);
        // TODO: Заменить на реальный API вызов
        // const response = await trpc.dayTrading.getStrategyComparison.useQuery({ period });
        
        // Временные данные для демонстрации
        const mockStrategies: StrategyMetrics[] = [
          {
            strategyName: 'Scalping Strategy',
            totalTrades: 245,
            winningTrades: 156,
            losingTrades: 79,
            breakEvenTrades: 10,
            winRate: 63.67,
            lossRate: 32.24,
            totalProfit: 4250.50,
            totalLoss: 1820.30,
            netProfit: 2430.20,
            roi: 12.15,
            profitFactor: 2.33,
            sharpeRatio: 1.45,
            maxDrawdown: 8.5,
            avgWin: 27.24,
            avgLoss: 23.04,
            expectancy: 9.93,
            consecutiveWins: 12,
            consecutiveLosses: 5,
            avgTradeTime: 15.3,
            bestTrade: 185.50,
            worstTrade: -95.20,
            recoveryFactor: 285.91,
            profitability: 63.67,
            lastUpdated: Date.now(),
          },
          {
            strategyName: 'Momentum Strategy',
            totalTrades: 89,
            winningTrades: 52,
            losingTrades: 32,
            breakEvenTrades: 5,
            winRate: 58.43,
            lossRate: 35.96,
            totalProfit: 3120.75,
            totalLoss: 1450.20,
            netProfit: 1670.55,
            roi: 8.35,
            profitFactor: 2.15,
            sharpeRatio: 1.12,
            maxDrawdown: 12.3,
            avgWin: 60.01,
            avgLoss: 45.32,
            expectancy: 18.76,
            consecutiveWins: 8,
            consecutiveLosses: 4,
            avgTradeTime: 45.5,
            bestTrade: 320.50,
            worstTrade: -150.20,
            recoveryFactor: 135.90,
            profitability: 58.43,
            lastUpdated: Date.now(),
          },
          {
            strategyName: 'Breakout Strategy',
            totalTrades: 156,
            winningTrades: 87,
            losingTrades: 62,
            breakEvenTrades: 7,
            winRate: 55.77,
            lossRate: 39.74,
            totalProfit: 2890.30,
            totalLoss: 1680.50,
            netProfit: 1209.80,
            roi: 6.05,
            profitFactor: 1.72,
            sharpeRatio: 0.85,
            maxDrawdown: 15.8,
            avgWin: 33.22,
            avgLoss: 27.10,
            expectancy: 7.75,
            consecutiveWins: 6,
            consecutiveLosses: 6,
            avgTradeTime: 60.2,
            bestTrade: 250.75,
            worstTrade: -120.50,
            recoveryFactor: 76.38,
            profitability: 55.77,
            lastUpdated: Date.now(),
          },
        ];

        setStrategies(mockStrategies);
        setSelectedStrategy(mockStrategies[0]);
      } catch (error) {
        console.error('Ошибка при загрузке стратегий:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStrategies();
  }, [period]);

  // Подготовка данных для графиков
  const chartData = strategies.map((s) => ({
    name: s.strategyName.substring(0, 10),
    winRate: s.winRate,
    roi: s.roi,
    profitFactor: s.profitFactor,
    sharpeRatio: s.sharpeRatio,
  }));

  const metricsData = strategies.map((s) => ({
    name: s.strategyName.substring(0, 10),
    'Max Drawdown': s.maxDrawdown,
    'Avg Trade Time': Math.min(s.avgTradeTime / 10, 100), // Нормализация для графика
  }));

  const topPerformer = strategies.reduce((best, current) =>
    current.roi > best.roi ? current : best
  );

  const getRecommendation = () => {
    const scores = strategies.map((s) => ({
      strategy: s,
      score: s.winRate * 0.3 + Math.min(s.profitFactor, 5) * 0.25 + Math.max(s.roi, 0) * 0.2 + Math.max(s.sharpeRatio, 0) * 0.15 + Math.max(100 - s.maxDrawdown, 0) * 0.1,
    }));
    return scores.sort((a, b) => b.score - a.score)[0];
  };

  const recommendation = getRecommendation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных о стратегиях...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сравнение стратегий Day Trading</h1>
          <p className="text-gray-600 mt-2">Анализируйте производительность различных стратегий</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7 дней' : p === '30d' ? '30 дней' : p === '90d' ? '90 дней' : 'Все'}
            </Button>
          ))}
        </div>
      </div>

      {/* Рекомендация */}
      {recommendation && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Award className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Рекомендуемая стратегия</h3>
                <p className="text-blue-800 mt-1">
                  <strong>{recommendation.strategy.strategyName}</strong> показывает лучшую производительность с ROI {recommendation.strategy.roi.toFixed(2)}% и win rate {recommendation.strategy.winRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Карточки метрик */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {strategies.map((strategy) => (
          <StrategyMetricsCard
            key={strategy.strategyName}
            strategyName={strategy.strategyName}
            winRate={strategy.winRate}
            roi={strategy.roi}
            profitFactor={strategy.profitFactor}
            sharpeRatio={strategy.sharpeRatio}
            maxDrawdown={strategy.maxDrawdown}
            totalTrades={strategy.totalTrades}
            netProfit={strategy.netProfit}
            isSelected={selectedStrategy?.strategyName === strategy.strategyName}
            onClick={() => setSelectedStrategy(strategy)}
          />
        ))}
      </div>

      {/* Таблица сравнения */}
      <StrategyComparisonTable
        strategies={strategies}
        onStrategySelect={setSelectedStrategy}
      />

      {/* Графики */}
      <Tabs defaultValue="winrate" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="winrate">Win Rate</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="metrics">Метрики</TabsTrigger>
          <TabsTrigger value="risk">Риск</TabsTrigger>
        </TabsList>

        <TabsContent value="winrate" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="winRate" fill="#10b981" name="Win Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="roi" fill="#3b82f6" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="profitFactor" stroke="#f59e0b" name="Profit Factor" />
                  <Line type="monotone" dataKey="sharpeRatio" stroke="#8b5cf6" name="Sharpe Ratio" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Max Drawdown" fill="#ef4444" name="Max Drawdown %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Детали выбранной стратегии */}
      {selectedStrategy && (
        <Card>
          <CardHeader>
            <CardTitle>Детали стратегии: {selectedStrategy.strategyName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Всего сделок</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStrategy.totalTrades}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Побед</p>
                <p className="text-2xl font-bold text-green-600">{selectedStrategy.winningTrades}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Поражений</p>
                <p className="text-2xl font-bold text-red-600">{selectedStrategy.losingTrades}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${selectedStrategy.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${selectedStrategy.netProfit.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Win</p>
                <p className="text-2xl font-bold text-gray-900">${selectedStrategy.avgWin.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Avg Loss</p>
                <p className="text-2xl font-bold text-gray-900">${selectedStrategy.avgLoss.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Expectancy</p>
                <p className="text-2xl font-bold text-gray-900">${selectedStrategy.expectancy.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Recovery Factor</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStrategy.recoveryFactor.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
