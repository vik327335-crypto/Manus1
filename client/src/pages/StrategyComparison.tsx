import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyMetricsCard } from '@/components/StrategyMetricsCard';
import { StrategyComparisonTable } from '@/components/StrategyComparisonTable';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertCircle, Loader2, Download, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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

interface StrategyMetricsDisplay extends StrategyMetrics {}

export function StrategyComparison() {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyMetricsDisplay | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [exporting, setExporting] = useState(false);

  // Мутация для экспорта в CSV
  const exportCSVMutation = trpc.reportExport.exportToCSV.useMutation();
  const exportHTMLMutation = trpc.reportExport.exportToHTML.useMutation();

  // WebSocket подписка на real-time обновления
  const metricsSubscription = trpc.websocket.subscribeToAllMetrics.useSubscription(undefined, {
    onData: (update) => {
      // Обновляем данные стратегий при получении обновления
      console.log('Обновление метрик:', update);
      // Можно добавить рефреш данных
    },
    onError: (error) => {
      console.error('Ошибка WebSocket:', error);
    },
  });

  // Отписываемся от WebSocket при расмонтировании
  useEffect(() => {
    return () => {
      if (metricsSubscription) {
        // Отписываемся
      }
    };
  }, [metricsSubscription]);

  // Вычисляем временной диапазон
  const dateRange = useMemo(() => {
    const now = Date.now();
    const periodMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': 365 * 24 * 60 * 60 * 1000,
    };
    return {
      startDate: now - periodMs[period],
      endDate: now,
    };
  }, [period]);

  // Загружаем метрики всех стратегий
  const { data: strategiesData, isLoading, error } = trpc.strategyData.getAllStrategiesMetrics.useQuery(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    {
      enabled: true,
      retry: 2,
    }
  );

  // Трансформируем данные в нужный формат
  const strategies: StrategyMetrics[] = useMemo(() => {
    if (!strategiesData || typeof strategiesData !== 'object' || Array.isArray(strategiesData) === false) return [];
    
    return (strategiesData as any[]).map((strategy: any) => ({
      strategyName: strategy.strategyName,
      totalTrades: strategy.totalTrades,
      winningTrades: strategy.winningTrades,
      losingTrades: strategy.losingTrades,
      breakEvenTrades: strategy.breakEvenTrades,
      winRate: strategy.winRate,
      lossRate: 100 - strategy.winRate,
      totalProfit: strategy.totalProfit,
      totalLoss: strategy.totalLoss,
      netProfit: strategy.totalProfit - strategy.totalLoss,
      roi: strategy.roi,
      profitFactor: strategy.profitFactor,
      sharpeRatio: strategy.sharpeRatio,
      maxDrawdown: strategy.maxDrawdown,
      averageWin: strategy.averageWin,
      averageLoss: strategy.averageLoss,
      largestWin: strategy.largestWin,
      largestLoss: strategy.largestLoss,
      expectancy: strategy.averageWin * (strategy.winRate / 100) - strategy.averageLoss * ((100 - strategy.winRate) / 100),
      consecutiveWins: strategy.consecutiveWins,
      consecutiveLosses: strategy.consecutiveLosses,
      avgTradeTime: 0,
      bestTrade: strategy.largestWin,
      worstTrade: -strategy.largestLoss,
      recoveryFactor: strategy.totalProfit > 0 ? strategy.totalProfit / Math.abs(strategy.maxDrawdown) : 0,
      profitability: strategy.winRate,
      lastUpdated: Date.now(),
    }));
  }, [strategiesData]);

  // Подготовка данных для графиков
  const comparisonChartData = useMemo(() => {
    return strategies.map((s) => ({
      name: s.strategyName.substring(0, 15),
      roi: s.roi,
      sharpeRatio: s.sharpeRatio * 10, // Масштабируем для видимости
      winRate: s.winRate,
      profitFactor: s.profitFactor * 10,
    }));
  }, [strategies]);

  const performanceChartData = useMemo(() => {
    return strategies.map((s) => ({
      name: s.strategyName.substring(0, 15),
      profit: s.totalProfit,
      loss: s.totalLoss,
      trades: s.totalTrades,
    }));
  }, [strategies]);

  const riskChartData = useMemo(() => {
    return strategies.map((s) => ({
      name: s.strategyName.substring(0, 15),
      maxDrawdown: Math.abs(s.maxDrawdown),
      avgLoss: s.averageLoss,
      worstTrade: Math.abs(s.worstTrade || 0),
    }));
  }, [strategies]);

  // Рекомендации по стратегиям
  const recommendations = useMemo(() => {
    if (strategies.length === 0) return [];

    const sorted = [...strategies].sort((a, b) => b.roi - a.roi);
    return [
      {
        title: 'Лучшая по ROI',
        strategy: sorted[0],
        icon: TrendingUp,
        color: 'text-green-500',
      },
      {
        title: 'Лучшая по Sharpe Ratio',
        strategy: [...strategies].sort((a, b) => b.sharpeRatio - a.sharpeRatio)[0],
        icon: Award,
        color: 'text-blue-500',
      },
      {
        title: 'Наименьший риск',
        strategy: [...strategies].sort((a, b) => Math.abs(a.maxDrawdown) - Math.abs(b.maxDrawdown))[0],
        icon: AlertCircle,
        color: 'text-orange-500',
      },
    ];
  }, [strategies]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>Ошибка загрузки данных: {error.message}</span>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Заголовок и фильтры */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Сравнение стратегий</h1>
          <p className="text-gray-600">Анализируйте производительность всех ваших торговых стратегий</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
              disabled={isLoading}
            >
              {p === '7d' ? '7 дней' : p === '30d' ? '30 дней' : p === '90d' ? '90 дней' : 'Все'}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setExporting(true);
                const result = await exportCSVMutation.mutateAsync({
                  strategies: strategies.map((s) => ({
                    strategyName: s.strategyName,
                    totalTrades: s.totalTrades,
                    winningTrades: s.winningTrades,
                    losingTrades: s.losingTrades,
                    winRate: s.winRate,
                    totalProfit: s.totalProfit,
                    totalLoss: s.totalLoss,
                    roi: s.roi,
                    profitFactor: s.profitFactor,
                    sharpeRatio: s.sharpeRatio,
                    maxDrawdown: s.maxDrawdown,
                    averageWin: s.averageWin,
                    averageLoss: s.averageLoss,
                    largestWin: s.largestWin,
                    largestLoss: s.largestLoss,
                  })),
                  filename: `strategies-${period}-${Date.now()}.csv`,
                });
                
                // Скачиваем CSV
                const blob = new Blob([result.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                a.click();
                window.URL.revokeObjectURL(url);
                
                toast.success('Отчёт экспортирован в CSV');
              } catch (error: any) {
                toast.error(`Ошибка экспорта: ${error.message}`);
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting || strategies.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                setExporting(true);
                const result = await exportHTMLMutation.mutateAsync({
                  strategies: strategies.map((s) => ({
                    strategyName: s.strategyName,
                    totalTrades: s.totalTrades,
                    winningTrades: s.winningTrades,
                    losingTrades: s.losingTrades,
                    winRate: s.winRate,
                    totalProfit: s.totalProfit,
                    totalLoss: s.totalLoss,
                    roi: s.roi,
                    profitFactor: s.profitFactor,
                    sharpeRatio: s.sharpeRatio,
                    maxDrawdown: s.maxDrawdown,
                    averageWin: s.averageWin,
                    averageLoss: s.averageLoss,
                    largestWin: s.largestWin,
                    largestLoss: s.largestLoss,
                  })),
                  title: `Strategy Report - ${period}`,
                });
                
                // Скачиваем HTML
                const blob = new Blob([result.data], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `strategies-${period}-${Date.now()}.html`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                toast.success('Отчёт экспортирован в HTML');
              } catch (error: any) {
                toast.error(`Ошибка экспорта: ${error.message}`);
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting || strategies.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Загрузка данных...</span>
        </div>
      ) : strategies.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600">
            <p>Нет данных о стратегиях. Начните торговлю, чтобы увидеть результаты.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Рекомендации */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendations.map((rec) => (
              <Card
                key={rec.title}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => setSelectedStrategy(rec.strategy)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <rec.icon className={`h-5 w-5 ${rec.color}`} />
                    {rec.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{rec.strategy.strategyName}</p>
                  <p className="text-sm text-gray-600">ROI: {rec.strategy.roi.toFixed(2)}%</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Таблица сравнения */}
          <Card>
            <CardHeader>
              <CardTitle>Все стратегии</CardTitle>
            </CardHeader>
            <CardContent>
              <StrategyComparisonTable
                strategies={strategies}
                onStrategySelect={setSelectedStrategy}
              />
            </CardContent>
          </Card>

          {/* Графики */}
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">Сравнение</TabsTrigger>
              <TabsTrigger value="performance">Производительность</TabsTrigger>
              <TabsTrigger value="risk">Риск</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Метрики стратегий</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="roi" fill="#10b981" name="ROI (%)" />
                      <Bar dataKey="winRate" fill="#3b82f6" name="Win Rate (%)" />
                      <Bar dataKey="profitFactor" fill="#f59e0b" name="Profit Factor (x10)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Прибыль и убытки</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="profit" fill="#10b981" name="Прибыль" />
                      <Bar dataKey="loss" fill="#ef4444" name="Убыток" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Показатели риска</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={riskChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="maxDrawdown" fill="#ef4444" name="Max Drawdown (%)" />
                      <Bar dataKey="avgLoss" fill="#f97316" name="Средний убыток" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Детальная информация о выбранной стратегии */}
          {selectedStrategy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedStrategy.strategyName}</span>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedStrategy(null)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StrategyMetricsCard
                strategyName={selectedStrategy.strategyName}
                winRate={selectedStrategy.winRate}
                roi={selectedStrategy.roi}
                profitFactor={selectedStrategy.profitFactor}
                sharpeRatio={selectedStrategy.sharpeRatio}
                maxDrawdown={selectedStrategy.maxDrawdown}
                totalTrades={selectedStrategy.totalTrades}
                netProfit={selectedStrategy.netProfit || 0}
                isSelected={true}
              />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
