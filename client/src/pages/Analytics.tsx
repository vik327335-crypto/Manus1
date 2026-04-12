import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalyticsData {
  assets: Array<{
    ticker: string;
    score: number;
    priceChange24h: number;
    marketCap: number;
  }>;
}

/**
 * Analytics страница для отображения статистики портфеля
 * Показывает общие метрики, распределение по score и тренды
 */
export default function Analytics() {
  // Пример данных (в реальном приложении будут загружены из API)
  const mockData: AnalyticsData = {
    assets: [
      { ticker: "BTC", score: 85, priceChange24h: 2.5, marketCap: 1200000000000 },
      { ticker: "ETH", score: 78, priceChange24h: 1.8, marketCap: 250000000000 },
      { ticker: "SOL", score: 72, priceChange24h: -0.5, marketCap: 50000000000 },
      { ticker: "ADA", score: 65, priceChange24h: 0.2, marketCap: 30000000000 },
      { ticker: "XRP", score: 58, priceChange24h: -1.2, marketCap: 35000000000 },
    ],
  };

  // Вычисляем статистику
  const stats = useMemo(() => {
    const { assets } = mockData;

    const avgScore = assets.reduce((sum, a) => sum + a.score, 0) / assets.length;
    const avgPriceChange = assets.reduce((sum, a) => sum + a.priceChange24h, 0) / assets.length;
    const totalMarketCap = assets.reduce((sum, a) => sum + a.marketCap, 0);

    // Распределение по score
    const scoreDistribution = {
      excellent: assets.filter((a) => a.score >= 80).length,
      good: assets.filter((a) => a.score >= 70 && a.score < 80).length,
      average: assets.filter((a) => a.score >= 60 && a.score < 70).length,
      poor: assets.filter((a) => a.score < 60).length,
    };

    // Активы с положительным и отрицательным изменением
    const gainers = assets.filter((a) => a.priceChange24h > 0).length;
    const losers = assets.filter((a) => a.priceChange24h < 0).length;

    return {
      avgScore: avgScore.toFixed(1),
      avgPriceChange: avgPriceChange.toFixed(2),
      totalMarketCap: (totalMarketCap / 1e12).toFixed(2),
      scoreDistribution,
      gainers,
      losers,
      total: assets.length,
    };
  }, [mockData]);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Аналитика</h1>
        <p className="text-muted-foreground mt-2">
          Общая статистика портфеля и анализ активов
        </p>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Средний Score */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Средний CAN SLIM Score</p>
              <p className="text-3xl font-bold mt-2">{stats.avgScore}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Среднее изменение цены */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Среднее изменение 24h</p>
              <p
                className={cn(
                  "text-3xl font-bold mt-2",
                  parseFloat(stats.avgPriceChange) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {parseFloat(stats.avgPriceChange) >= 0 ? "+" : ""}
                {stats.avgPriceChange}%
              </p>
            </div>
            <div
              className={cn(
                "h-12 w-12 rounded-lg flex items-center justify-center",
                parseFloat(stats.avgPriceChange) >= 0
                  ? "bg-green-100 dark:bg-green-900/20"
                  : "bg-red-100 dark:bg-red-900/20"
              )}
            >
              {parseFloat(stats.avgPriceChange) >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </Card>

        {/* Общая рыночная капитализация */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Общая рыночная кап.</p>
              <p className="text-3xl font-bold mt-2">${stats.totalMarketCap}T</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Количество активов */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Всего активов</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Распределение по Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Распределение по CAN SLIM Score</h2>
          <div className="space-y-3">
            {/* Отличные */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Отличные (80+)</span>
                <span className="text-sm text-muted-foreground">
                  {stats.scoreDistribution.excellent}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(stats.scoreDistribution.excellent / stats.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Хорошие */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Хорошие (70-79)</span>
                <span className="text-sm text-muted-foreground">
                  {stats.scoreDistribution.good}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${(stats.scoreDistribution.good / stats.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Средние */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Средние (60-69)</span>
                <span className="text-sm text-muted-foreground">
                  {stats.scoreDistribution.average}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{
                    width: `${(stats.scoreDistribution.average / stats.total) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Слабые */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Слабые (&lt;60)</span>
                <span className="text-sm text-muted-foreground">
                  {stats.scoreDistribution.poor}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${(stats.scoreDistribution.poor / stats.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Тренды цен */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Тренды цен за 24 часа</h2>
          <div className="space-y-4">
            {/* Gainers */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium">Растущие активы</p>
                  <p className="text-sm text-muted-foreground">
                    Активы с положительным изменением цены
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.gainers}
              </span>
            </div>

            {/* Losers */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-medium">Падающие активы</p>
                  <p className="text-sm text-muted-foreground">
                    Активы с отрицательным изменением цены
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.losers}
              </span>
            </div>

            {/* Стабильные */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium">Стабильные активы</p>
                  <p className="text-sm text-muted-foreground">
                    Активы без изменения цены
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total - stats.gainers - stats.losers}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Топ активы по Score */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Топ активы по CAN SLIM Score</h2>
        <div className="space-y-2">
          {mockData.assets
            .sort((a, b) => b.score - a.score)
            .map((asset, index) => (
              <div key={asset.ticker} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                  <span className="font-semibold">{asset.ticker}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    ${(asset.marketCap / 1e9).toFixed(1)}B
                  </span>
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                    <span className="font-bold text-sm text-primary">{asset.score.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
