import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CorrelationHeatmapProps {
  assets: Array<{
    ticker: string;
    score: number;
    marketCap: number;
    volume24h: number;
    priceChange24h: number;
  }>;
}

/**
 * Компонент для отображения тепловой карты корреляций между активами
 */
export function CorrelationHeatmap({ assets }: CorrelationHeatmapProps) {
  const correlationData = useMemo(() => {
    if (!assets || assets.length < 2) return null;

    // Расчёт корреляции между активами по score и marketCap
    const correlations: Record<string, Record<string, number>> = {};

    assets.forEach((asset1) => {
      correlations[asset1.ticker] = {};
      assets.forEach((asset2) => {
        if (asset1.ticker === asset2.ticker) {
          correlations[asset1.ticker][asset2.ticker] = 1;
        } else {
          // Простая корреляция на основе score
          const scoreDiff = Math.abs(asset1.score - asset2.score);
          const correlation = Math.max(0, 1 - scoreDiff / 100);
          correlations[asset1.ticker][asset2.ticker] = correlation;
        }
      });
    });

    return correlations;
  }, [assets]);

  if (!correlationData || !assets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тепловая карта корреляций</CardTitle>
          <CardDescription>Корреляция между активами по CAN SLIM score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Недостаточно данных для расчёта корреляций</div>
        </CardContent>
      </Card>
    );
  }

  const getColor = (value: number): string => {
    if (value >= 0.8) return "bg-red-600";
    if (value >= 0.6) return "bg-orange-500";
    if (value >= 0.4) return "bg-yellow-400";
    if (value >= 0.2) return "bg-blue-400";
    return "bg-blue-200";
  };

  const tickers = assets.slice(0, 10).map((a) => a.ticker); // Ограничиваем до 10 активов

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тепловая карта корреляций</CardTitle>
        <CardDescription>Корреляция между активами по CAN SLIM score (топ 10)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left font-semibold">Актив</th>
                {tickers.map((ticker) => (
                  <th key={ticker} className="p-2 text-center font-semibold w-12">
                    {ticker}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((ticker1) => (
                <tr key={ticker1}>
                  <td className="p-2 font-semibold">{ticker1}</td>
                  {tickers.map((ticker2) => {
                    const correlation = correlationData[ticker1]?.[ticker2] || 0;
                    return (
                      <td key={`${ticker1}-${ticker2}`} className="p-2 text-center">
                        <div className={`${getColor(correlation)} text-white rounded px-2 py-1 text-center`}>
                          {(correlation * 100).toFixed(0)}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Легенда */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded"></div>
            <span>Очень высокая (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
            <span>Высокая (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-400 rounded"></div>
            <span>Средняя (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-400 rounded"></div>
            <span>Низкая (20-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-200 rounded"></div>
            <span>Очень низкая (0-20%)</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          💡 Высокая корреляция означает, что активы движутся синхронно. Низкая корреляция указывает на независимые движения.
        </p>
      </CardContent>
    </Card>
  );
}
