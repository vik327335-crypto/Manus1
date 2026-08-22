import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StrategyDashboard() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Дашборд сравнения стратегий</h1>
        <p className="text-muted-foreground">
          Исследовательский экран без торгового исполнения и персональных инвестиционных рекомендаций.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Аналитика стратегий недоступна без проверяемого historical run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Экран не отображает ROI, win rate, Sharpe ratio, profit factor, drawdown, improvement,
            статистику, сравнение периодов или графики из static, zero-filled либо случайно
            сгенерированных значений.
          </p>
          <p>
            Для публикации стратегии требуется воспроизводимый historical run с declared asset
            universe, источником и покрытием данных, UTC timeframe, датой запуска, комиссиями,
            проскальзыванием, версией параметров, предположениями исполнения и метаданными
            freshness.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            Пока эти данные не доступны, показатели стратегий, ранжирование и экспорт результатов
            остаются недоступными, а не выводятся как расчётные факты.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historical data provenance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Нет объявленного источника, охвата и UTC-периода, достаточных для проверки ценового
            ряда и asset universe.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run methodology</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Нет зафиксированных параметров, модели исполнения, комиссий и проскальзывания для
            интерпретации performance metrics.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result availability</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Графики, KPI, comparison views и result export будут доступны только для auditable run с
            timestamp и freshness metadata.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
