import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendForecastProps {
  ticker: string;
  historicalPrices: Array<{
    date: string;
    price: number;
  }>;
}

/**
 * Простое прогнозирование трендов на основе линейной регрессии
 */
export function TrendForecast({ ticker, historicalPrices }: TrendForecastProps) {
  const forecast = useMemo(() => {
    if (!historicalPrices || historicalPrices.length < 2) {
      return { data: [], trend: "unknown", confidence: 0 };
    }

    // Простая линейная регрессия
    const n = historicalPrices.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    historicalPrices.forEach((item, index) => {
      sumX += index;
      sumY += item.price;
      sumXY += index * item.price;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Расчёт R² для оценки точности
    const yMean = sumY / n;
    let ssRes = 0,
      ssTot = 0;
    historicalPrices.forEach((item, index) => {
      const predicted = slope * index + intercept;
      ssRes += Math.pow(item.price - predicted, 2);
      ssTot += Math.pow(item.price - yMean, 2);
    });
    const r2 = 1 - ssRes / ssTot;
    const confidence = Math.max(0, Math.min(100, r2 * 100));

    // Генерация прогноза на 7 дней вперёд
    const forecastData = historicalPrices.map((item, _index) => ({
      date: new Date(item.date).toLocaleDateString("ru-RU"),
      actual: item.price as any,
      forecast: undefined as any,
    }));

    for (let i = 1; i <= 7; i++) {
      const predictedPrice = slope * (n - 1 + i) + intercept;
      const forecastDate = new Date(historicalPrices[n - 1].date);
      forecastDate.setDate(forecastDate.getDate() + i);

      forecastData.push({
        date: forecastDate.toLocaleDateString("ru-RU"),
        actual: undefined as any,
        forecast: predictedPrice,
      });
    }

    const trend = slope > 0 ? "up" : slope < 0 ? "down" : "stable";
    const currentPrice = historicalPrices[n - 1].price;
    const forecastedPrice = slope * (n + 7) + intercept;
    const expectedChange = ((forecastedPrice - currentPrice) / currentPrice) * 100;

    return {
      data: forecastData,
      trend,
      confidence,
      slope,
      currentPrice,
      forecastedPrice,
      expectedChange,
    };
  }, [historicalPrices]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Прогноз тренда {ticker}</CardTitle>
        <CardDescription>Прогнозирование на основе линейной регрессии (7 дней)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Текущая цена</p>
            <p className="text-2xl font-bold">${forecast.currentPrice?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Прогноз на 7 дней</p>
            <p className="text-2xl font-bold">${forecast.forecastedPrice?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ожидаемое изменение</p>
            <p
              className={`text-2xl font-bold ${(forecast.expectedChange || 0) > 0 ? "text-green-600" : (forecast.expectedChange || 0) < 0 ? "text-red-600" : "text-gray-600"}`}
            >
              {(forecast.expectedChange || 0) > 0 ? "+" : ""}{(forecast.expectedChange || 0).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Точность модели</p>
            <p className="text-2xl font-bold">{forecast.confidence?.toFixed(1)}%</p>
          </div>
        </div>

        {/* График */}
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast.data}>
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
                dataKey="actual"
                stroke="#3b82f6"
                dot={{ fill: "#3b82f6", r: 4 }}
                name="Фактическая цена"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#f59e0b"
                strokeDasharray="5 5"
                dot={{ fill: "#f59e0b", r: 4 }}
                name="Прогноз"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Информация о тренде */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            Тренд: {forecast.trend === "up" ? "📈 Восходящий" : forecast.trend === "down" ? "📉 Нисходящий" : "➡️ Стабильный"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Модель предполагает {forecast.trend === "up" ? "рост" : forecast.trend === "down" ? "падение" : "стабилизацию"} цены в ближайшие 7 дней.
            Точность прогноза: {forecast.confidence?.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-2">
            ⚠️ Прогноз основан на исторических данных и не гарантирует будущие результаты. Используйте для информационных целей.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
