import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const unavailableMetrics = ["Баланс", "Прибыль / убыток", "Процент побед", "Макс. просадка"];

export default function PaperTrading() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Виртуальная торговля</h1>
        <p className="text-muted-foreground">Research-only режим. Результаты отображаются только после загрузки owner-scoped виртуального счёта и истории сделок.</p>
      </div>

      <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <CardContent className="pt-6 text-sm">
          Для этого маршрута пока нет проверяемого серверного источника виртуального баланса, открытых позиций, истории сделок или результатов. Поэтому интерфейс не показывает статические P&amp;L, win rate, просадку, цены входа или risk/reward как фактические данные.
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {unavailableMetrics.map((metric) => (
          <Card key={metric}>
            <CardContent className="pt-6"><p className="text-sm text-muted-foreground">{metric}</p><p className="mt-2 text-2xl font-bold text-muted-foreground">—</p></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="trades">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trades">Сделки</TabsTrigger>
          <TabsTrigger value="positions">Открытые позиции</TabsTrigger>
          <TabsTrigger value="statistics">Статистика</TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="pt-4">
          <EmptyPaperData title="История сделок недоступна" description="Подключите проверяемое owner-scoped хранилище virtual trades, чтобы просматривать воспроизводимую историю paper-trading." />
        </TabsContent>
        <TabsContent value="positions" className="pt-4">
          <EmptyPaperData title="Открытые позиции недоступны" description="Интерфейс не создаёт и не отображает synthetic virtual positions." />
        </TabsContent>
        <TabsContent value="statistics" className="pt-4">
          <EmptyPaperData title="Статистика недоступна" description="Метрики появятся только после расчёта из сохранённых виртуальных сделок с явно зафиксированными правилами и данными." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyPaperData({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground">{description}</p></CardContent>
    </Card>
  );
}
