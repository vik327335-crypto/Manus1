import React, { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart as _LineChart, Line as _Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend as _Legend, ResponsiveContainer } from "recharts";

/**
 * Страница отчётов по CAN SLIM критериям
 */
export default function Reports() {
  const { data: assets, isLoading } = trpc.scanner.scan.useQuery({
    minScore: 0,
    maxScore: 100,
    minMarketCap: 0,
    maxMarketCap: Infinity,
    minVolume24h: 0,
    maxVolume24h: Infinity,
    sortBy: "score",
    order: "desc",
  });

  const reports = useMemo(() => {
    if (!assets) return null;

    // Расчёт статистики по критериям
    const criteriaStats = {
      earnings: { count: 0, avgScore: 0 },
      sales: { count: 0, avgScore: 0 },
      supply: { count: 0, avgScore: 0 },
      leadership: { count: 0, avgScore: 0 },
      institutional: { count: 0, avgScore: 0 },
      market: { count: 0, avgScore: 0 },
      momentum: { count: 0, avgScore: 0 },
    };

    let totalScore = 0;
    const scoreDistribution: Record<string, number> = {
      "90-100": 0,
      "80-89": 0,
      "70-79": 0,
      "60-69": 0,
      "50-59": 0,
      "<50": 0,
    };

    assets.forEach((asset) => {
      totalScore += asset.score;

      // Распределение по диапазонам
      if (asset.score >= 90) scoreDistribution["90-100"]++;
      else if (asset.score >= 80) scoreDistribution["80-89"]++;
      else if (asset.score >= 70) scoreDistribution["70-79"]++;
      else if (asset.score >= 60) scoreDistribution["60-69"]++;
      else if (asset.score >= 50) scoreDistribution["50-59"]++;
      else scoreDistribution["<50"]++;
    });

    const avgScore = assets.length > 0 ? totalScore / assets.length : 0;

    // Данные для графиков
    const scoreDistributionData = Object.entries(scoreDistribution).map(([range, count]) => ({
      name: range,
      value: count,
    }));

    const topAssets = assets.slice(0, 10).map((asset) => ({
      ticker: asset.ticker,
      score: asset.score,
    }));

    const bottomAssets = assets.slice(-10).map((asset) => ({
      ticker: asset.ticker,
      score: asset.score,
    }));

    return {
      totalAssets: assets.length,
      avgScore: avgScore.toFixed(2),
      topScore: assets[0]?.score || 0,
      lowScore: assets[assets.length - 1]?.score || 0,
      scoreDistributionData,
      topAssets,
      bottomAssets,
      criteriaStats,
    };
  }, [assets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Загрузка отчётов...</div>
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Нет данных для отчётов</div>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Отчёты CAN SLIM</h1>
        <p className="text-gray-500 mt-2">Анализ портфеля по критериям CAN SLIM</p>
      </div>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Всего активов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.totalAssets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Средний Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.avgScore}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Максимум</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.topScore.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Минимум</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.lowScore.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Графики */}
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList>
          <TabsTrigger value="distribution">Распределение</TabsTrigger>
          <TabsTrigger value="top">Топ 10</TabsTrigger>
          <TabsTrigger value="bottom">Низ 10</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Распределение Score</CardTitle>
              <CardDescription>Количество активов по диапазонам score</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reports.scoreDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reports.scoreDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle>Топ 10 активов</CardTitle>
              <CardDescription>Активы с наибольшим CAN SLIM score</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports.topAssets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottom">
          <Card>
            <CardHeader>
              <CardTitle>Низ 10 активов</CardTitle>
              <CardDescription>Активы с наименьшим CAN SLIM score</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports.bottomAssets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
