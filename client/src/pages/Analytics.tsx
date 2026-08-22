import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const unavailableMetrics = [
  "Средний CAN SLIM Score",
  "Среднее изменение 24h",
  "Общая рыночная кап.",
  "Всего активов",
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Аналитика</h1>
        <p className="mt-2 text-muted-foreground">Research analytics with verified market-data requirements</p>
      </div>

      <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <CardContent className="pt-6 text-sm">This route has no verified analytical dataset with source, timestamp, freshness, and universe metadata. Average scores, price changes, market capitalization, score distributions, gainers/losers, and top assets are unavailable rather than being calculated from static examples.</CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {unavailableMetrics.map((metric) => <Card key={metric} className="p-6"><p className="text-sm text-muted-foreground">{metric}</p><p className="mt-2 text-3xl font-bold text-muted-foreground">—</p></Card>)}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UnavailableAnalyticsCard title="Распределение по CAN SLIM Score" description="Будет рассчитано только по явно зафиксированному asset universe и проверенным scoring snapshots." />
        <UnavailableAnalyticsCard title="Тренды цен за 24 часа" description="Появятся только после получения свежих provider-backed quotes для определённого asset universe." />
      </div>

      <UnavailableAnalyticsCard title="Топ активы по CAN SLIM Score" description="Рейтинг требует воспроизводимые score snapshots, asset universe, время расчёта и provenance источников." />
    </div>
  );
}

function UnavailableAnalyticsCard({ title, description }: { title: string; description: string }) {
  return <Card className="p-6"><CardHeader className="p-0"><CardTitle>{title}</CardTitle></CardHeader><CardContent className="px-0 pb-0 pt-4"><p className="text-sm text-muted-foreground">{description}</p></CardContent></Card>;
}
