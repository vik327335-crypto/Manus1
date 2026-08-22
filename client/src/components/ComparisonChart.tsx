import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ComparisonAsset {
  ticker: string;
  name: string;
  score: number;
  cScore: number;
  aScore: number;
  nScore: number;
  sScore: number;
  lScore: number;
  iScore: number;
  mScore: number;
}

interface ComparisonChartProps {
  assets: ComparisonAsset[];
  className?: string;
}

const CRITERIA = [
  { key: "cScore", label: "C - Current", color: "bg-red-500" },
  { key: "aScore", label: "A - Annual", color: "bg-orange-500" },
  { key: "nScore", label: "N - New", color: "bg-yellow-500" },
  { key: "sScore", label: "S - Supply", color: "bg-green-500" },
  { key: "lScore", label: "L - Leader", color: "bg-blue-500" },
  { key: "iScore", label: "I - Institutional", color: "bg-indigo-500" },
  { key: "mScore", label: "M - Market", color: "bg-purple-500" },
] as const;

/**
 * ComparisonChart компонент для сравнения активов по CAN SLIM критериям
 * Отображает радиальную диаграмму для каждого актива
 */
export function ComparisonChart({ assets, className }: ComparisonChartProps) {
  // Вычисляем максимальное значение для масштабирования
  const maxScore = useMemo(() => {
    let max = 0;
    assets.forEach((asset) => {
      CRITERIA.forEach((c) => {
        const value = asset[c.key as keyof ComparisonAsset] as number;
        if (typeof value === "number" && value > max) {
          max = value;
        }
      });
    });
    return max || 100;
  }, [assets]);

  if (assets.length === 0) {
    return (
      <Card className={cn("p-6 flex items-center justify-center", className)}>
        <p className="text-muted-foreground">Нет активов для сравнения</p>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <h2 className="text-lg font-semibold mb-6">Сравнение активов по CAN SLIM критериям</h2>

      {/* Легенда критериев */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 pb-6 border-b border-border">
        {CRITERIA.map((c) => (
          <div key={c.key} className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded-full", c.color)} />
            <span className="text-xs font-medium">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Сравнительная таблица */}
      <div className="space-y-6">
        {assets.map((asset) => (
          <div key={asset.ticker} className="space-y-2">
            {/* Заголовок актива */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{asset.ticker}</p>
                <p className="text-xs text-muted-foreground">{asset.name}</p>
              </div>
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                <span className="font-bold text-sm text-primary">{asset.score.toFixed(0)}</span>
              </div>
            </div>

            {/* Полосы для каждого критерия */}
            <div className="space-y-2">
              {CRITERIA.map((c) => {
                const value = asset[c.key as keyof ComparisonAsset] as number;
                const percentage = (value / maxScore) * 100;

                return (
                  <div key={c.key} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-12">{c.label.split(" - ")[0]}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-300", c.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">
                      {typeof value === "number" ? value.toFixed(0) : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Информация о шкале */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Шкала: 0-100 баллов. Более высокие значения указывают на лучшее соответствие критериям CAN SLIM.
        </p>
      </div>
    </Card>
  );
}
