import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreHistoryProps {
  ticker: string;
  historicalScores: Array<{
    date: string;
    score: number;
    momentum: string;
  }>;
}

/**
 * Компонент для отображения истории изменений score актива
 */
export function ScoreHistory({ ticker, historicalScores }: ScoreHistoryProps) {
  const stats = useMemo(() => {
    if (!historicalScores || historicalScores.length === 0) {
      return {
        currentScore: 0,
        previousScore: 0,
        change: 0,
        changePercent: 0,
        trend: "stable",
        avgScore: 0,
        maxScore: 0,
        minScore: 0,
      };
    }

    const scores = historicalScores.map((h) => h.score);
    const currentScore = scores[scores.length - 1];
    const previousScore = scores[scores.length - 2] || scores[0];
    const change = currentScore - previousScore;
    const changePercent = previousScore !== 0 ? (change / previousScore) * 100 : 0;

    const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    return {
      currentScore,
      previousScore,
      change,
      changePercent,
      trend,
      avgScore,
      maxScore,
      minScore,
    };
  }, [historicalScores]);

  const chartData = historicalScores.map((h) => ({
    date: new Date(h.date).toLocaleDateString("ru-RU"),
    score: h.score,
    momentum: h.momentum,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>История Score {ticker}</CardTitle>
        <CardDescription>Изменение CAN SLIM score за период</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Текущий Score</p>
            <p className="text-2xl font-bold">{stats.currentScore.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Изменение</p>
            <p className={`text-2xl font-bold ${stats.change > 0 ? "text-green-600" : stats.change < 0 ? "text-red-600" : "text-gray-600"}`}>
              {stats.change > 0 ? "+" : ""}{stats.change.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400">({stats.changePercent.toFixed(1)}%)</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Средний Score</p>
            <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Диапазон</p>
            <p className="text-sm font-mono">{stats.minScore.toFixed(1)} - {stats.maxScore.toFixed(1)}</p>
          </div>
        </div>

        {/* График */}
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Тренд */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            Тренд: {stats.trend === "up" ? "📈 Восходящий" : stats.trend === "down" ? "📉 Нисходящий" : "➡️ Стабильный"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.trend === "up"
              ? "Score растёт - улучшается соответствие критериям CAN SLIM"
              : stats.trend === "down"
                ? "Score падает - ухудшается соответствие критериям CAN SLIM"
                : "Score стабилен - нет значительных изменений"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
