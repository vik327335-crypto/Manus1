import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart as _PieChart, Pie as _Pie, Cell as _Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart as _ScatterChart, Scatter as _Scatter } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button as _Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge as _Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Loader2, TrendingUp, TrendingDown, Activity as _Activity, Target as _Target } from 'lucide-react';
import { CustomTooltip, ComparisonTooltip } from '@/components/CustomTooltip';

interface _MetricData {
  timestamp: number;
  strategyName: string;
  roi: number;
  winRate: number;
  sharpeRatio: number;
  profitFactor: number;
  maxDrawdown: number;
  totalProfit: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const PERIODS = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'all', label: 'Всё время' },
];

export function StrategyDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'roi' | 'winRate' | 'sharpeRatio' | 'profitFactor'>('roi');

  // Fetch all strategies
  const { data: strategies = [], isLoading: strategiesLoading } = trpc.strategyData.getUserStrategies.useQuery();

  // Fetch strategy history data
  const { data: historyData = [], isLoading: historyLoading } = trpc.strategyHistory.getAllSnapshots.useQuery(
    selectedStrategies.length > 0 ? { strategyName: selectedStrategies[0], limit: 100 } : { strategyName: '', limit: 100 },
    { enabled: selectedStrategies.length > 0 }
  );

  // Fetch comparison data
  const { data: comparisonData = {} as Record<string, any> } = trpc.strategyComparison.compareStrategyByPeriods.useQuery(
    selectedStrategies.length > 0
      ? { strategyName: selectedStrategies[0], periods: [] }
      : { strategyName: '', periods: [] },
    { enabled: selectedStrategies.length > 0 }
  );

  // Fetch improvement data
  const { data: improvementData = { improvement: 0, metrics: {} } } = trpc.strategyHistory.getImprovement.useQuery(
    selectedStrategies.length > 0
      ? { strategyName: selectedStrategies[0], period: selectedPeriod }
      : { strategyName: '', period: 'month' },
    { enabled: selectedStrategies.length > 0 }
  );

  // Fetch statistics
  const { data: statsData = { min: 0, max: 0, avg: 0, current: 0, trend: 'stable' } } = trpc.strategyHistory.getStatistics.useQuery(
    selectedStrategies.length > 0
      ? { strategyName: selectedStrategies[0], metric: selectedMetric }
      : { strategyName: '', metric: 'roi' },
    { enabled: selectedStrategies.length > 0 }
  );

  // Process data for charts
  const chartData = useMemo(() => {
    if (historyData.length === 0) return [];

    return historyData.map((item: any) => ({
      timestamp: new Date(item.timestamp).toLocaleDateString('ru-RU'),
      roi: item.roi,
      winRate: item.winRate,
      sharpeRatio: item.sharpeRatio,
      profitFactor: item.profitFactor,
      maxDrawdown: item.maxDrawdown,
      totalProfit: item.totalProfit,
    }));
  }, [historyData]);

  // Prepare comparison chart data
  const comparisonChartData = useMemo(() => {
    if (!comparisonData || typeof comparisonData !== 'object') return [];
    return Object.entries(comparisonData).map(([period, data]: any) => ({
      period,
      roi: data?.roi || 0,
      winRate: data?.winRate || 0,
      sharpeRatio: data?.sharpeRatio || 0,
      profitFactor: data?.profitFactor || 0,
    }));
  }, [comparisonData]);

  // Prepare metrics comparison data
  const _metricsData = useMemo(() => {
    if (selectedStrategies.length === 0) return [];

    return selectedStrategies.map((strategy, index) => ({
      name: strategy,
      roi: Math.random() * 50,
      winRate: Math.random() * 100,
      sharpeRatio: Math.random() * 3,
      profitFactor: Math.random() * 3 + 1,
      color: COLORS[index % COLORS.length],
    }));
  }, [selectedStrategies]);

  const isLoading = strategiesLoading || historyLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Дашборд сравнения стратегий</h1>
        <p className="text-gray-500">Анализируйте и сравнивайте производительность ваших торговых стратегий</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Выберите стратегию</label>
          <Select value={selectedStrategies[0] || ''} onValueChange={(value) => setSelectedStrategies([value])}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите стратегию" />
            </SelectTrigger>
            <SelectContent>
              {strategies.map((strategy: any) => (
                <SelectItem key={strategy.id} value={strategy.name}>
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Период анализа</label>
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Метрика</label>
          <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roi">ROI (%)</SelectItem>
              <SelectItem value="winRate">Win Rate (%)</SelectItem>
              <SelectItem value="sharpeRatio">Sharpe Ratio</SelectItem>
              <SelectItem value="profitFactor">Profit Factor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      {selectedStrategies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.current?.toFixed(2)}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {statsData.trend === 'improving' ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Улучшается
                  </span>
                ) : statsData.trend === 'declining' ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Ухудшается
                  </span>
                ) : (
                  <span className="text-gray-600">Стабильно</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{((statsData.current || 0) * 100).toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">Процент выигрышных сделок</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Sharpe Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.current?.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Риск-скорректированный доход</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Улучшение</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${improvementData.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvementData.improvement > 0 ? '+' : ''}{improvementData.improvement?.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">За выбранный период</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Тренд ROI</CardTitle>
            <CardDescription>Изменение ROI во времени</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip content={<CustomTooltip showMetricDescription={true} />} />
                <Legend />
                <Line type="monotone" dataKey="roi" stroke="#3b82f6" name="ROI (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win Rate Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Тренд Win Rate</CardTitle>
            <CardDescription>Изменение процента выигрышных сделок</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip content={<CustomTooltip showMetricDescription={true} />} />
                <Legend />
                <Line type="monotone" dataKey="winRate" stroke="#10b981" name="Win Rate (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sharpe Ratio Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sharpe Ratio</CardTitle>
            <CardDescription>Риск-скорректированный доход во времени</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip content={<CustomTooltip showMetricDescription={true} />} />
                <Legend />
                <Line type="monotone" dataKey="sharpeRatio" stroke="#f59e0b" name="Sharpe Ratio" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Factor</CardTitle>
            <CardDescription>Соотношение прибыли к убыткам</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip content={<CustomTooltip showMetricDescription={true} />} />
                <Legend />
                <Line type="monotone" dataKey="profitFactor" stroke="#8b5cf6" name="Profit Factor" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Period Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Сравнение по периодам</CardTitle>
            <CardDescription>Производительность по неделям</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip content={<ComparisonTooltip />} />
                <Legend />
                <Bar
                  dataKey="roi"
                  fill="#3b82f6"
                  name="ROI (%)"
                />
                <Bar
                  dataKey="winRate"
                  fill="#10b981"
                  name="Win Rate (%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card>
          <CardHeader>
            <CardTitle>Максимальная просадка</CardTitle>
            <CardDescription>Наибольший спад от пика</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip content={<CustomTooltip showMetricDescription={true} />} />
                <Legend />
                <Line type="monotone" dataKey="maxDrawdown" stroke="#ef4444" name="Max Drawdown (%)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Summary */}
      {selectedStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Статистика метрики: {selectedMetric}</CardTitle>
            <CardDescription>Анализ выбранной метрики за период</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Минимум</p>
                <p className="text-lg font-semibold">{statsData.min?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Максимум</p>
                <p className="text-lg font-semibold">{statsData.max?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Среднее</p>
                <p className="text-lg font-semibold">{statsData.avg?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Текущее</p>
                <p className="text-lg font-semibold">{statsData.current?.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
