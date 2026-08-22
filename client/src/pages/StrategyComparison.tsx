import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StrategyComparison() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Сравнение стратегий</h1>
        <p className="text-muted-foreground">
          Исследовательский экран. Он не формирует торговые рекомендации и не выполняет сделки.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Сравнение стратегий недоступно без проверяемых historical runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Экран не отображает ROI, win rate, прибыль/убыток, profit factor, Sharpe ratio,
            drawdown, rankings, рекомендации, сравнительные таблицы, графики или exports из
            source-ambiguous метрик и derived calculations.
          </p>
          <p>
            Каждая стратегия требует воспроизводимый historical run с declared asset universe,
            источником и покрытием данных, UTC timeframe, run timestamp, параметрами, моделью
            исполнения, комиссиями, проскальзыванием, предположениями и freshness metadata до
            сравнения или экспорта результатов.
          </p>
          <p className="font-medium text-amber-700 dark:text-amber-400">
            Пока эти доказательства отсутствуют, показатели, ранжирование и экспорт результатов
            остаются недоступными, а не представляются как фактическая performance analytics.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data provenance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Нет declared source, full coverage и asset universe для проверки входного historical
            dataset.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparable methodology</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Нет зафиксированных fees, slippage, execution model и parameter versions для честного
            comparison между strategy runs.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tables, charts, rankings, recommendations и result export будут доступны только после
            проверки metadata и reproducibility каждого run.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
