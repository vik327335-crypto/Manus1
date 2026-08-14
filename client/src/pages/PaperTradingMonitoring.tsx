import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Bot, CirclePause, CirclePlay, Loader2, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
type MonitorSymbol = (typeof DEFAULT_SYMBOLS)[number];

function formatUsdFromCents(value?: number | null) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format((value ?? 0) / 100);
}

function formatBps(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `${(value / 100).toFixed(2)}%`;
}

function statusLabel(status?: string | null) {
  if (status === "healthy") return "Stable";
  if (status === "watch") return "Watch";
  if (status === "degraded") return "Degraded";
  if (status === "paused") return "Paused";
  return "Idle";
}

export default function PaperTradingMonitoring() {
  const utils = trpc.useUtils();
  const monitorsQuery = trpc.paperTradingMonitor.list.useQuery(undefined, { refetchInterval: 30_000 });
  const [selectedMonitorId, setSelectedMonitorId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("Daily technical composite");
  const [capital, setCapital] = useState("10000");
  const [symbols, setSymbols] = useState<MonitorSymbol[]>([...DEFAULT_SYMBOLS]);

  useEffect(() => {
    if (selectedMonitorId === null && monitorsQuery.data?.[0]) setSelectedMonitorId(monitorsQuery.data[0].id);
  }, [monitorsQuery.data, selectedMonitorId]);

  const dashboardQuery = trpc.paperTradingMonitor.dashboard.useQuery(
    { monitorId: selectedMonitorId ?? 0 },
    { enabled: selectedMonitorId !== null, refetchInterval: 30_000 }
  );
  const createMonitor = trpc.paperTradingMonitor.create.useMutation({
    onSuccess: async ({ monitorId }) => {
      await utils.paperTradingMonitor.list.invalidate();
      setSelectedMonitorId(monitorId);
      setCreating(false);
      toast.success("Paper-trading monitor created");
    },
    onError: (error) => toast.error(error.message),
  });
  const enableDaily = trpc.paperTradingMonitor.enableDaily.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.paperTradingMonitor.list.invalidate(), utils.paperTradingMonitor.dashboard.invalidate()]);
      toast.success("Daily automatic monitoring enabled");
    },
    onError: (error) => toast.error(error.message),
  });
  const pauseDaily = trpc.paperTradingMonitor.pauseDaily.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.paperTradingMonitor.list.invalidate(), utils.paperTradingMonitor.dashboard.invalidate()]);
      toast.success("Daily monitoring paused");
    },
    onError: (error) => toast.error(error.message),
  });
  const runNow = trpc.paperTradingMonitor.runNow.useMutation({
    onSuccess: async (result) => {
      await utils.paperTradingMonitor.dashboard.invalidate();
      toast.success(result.status === "skipped" ? "No new completed daily candle to process" : "Daily monitor updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const dashboard = dashboardQuery.data;
  const monitor = dashboard?.monitor;
  const latestRun = dashboard?.runs[0];
  const chartData = useMemo(() => (dashboard?.runs ?? []).slice().reverse().map((run) => ({
    date: new Date(run.asOfDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    model: (run.modelReturnBps ?? 0) / 100,
    benchmark: (run.benchmarkReturnBps ?? 0) / 100,
  })), [dashboard?.runs]);

  const submitCreate = () => {
    const initialCapitalUsd = Number(capital);
    if (!Number.isFinite(initialCapitalUsd) || initialCapitalUsd < 100) {
      toast.error("Initial virtual capital must be at least $100");
      return;
    }
    createMonitor.mutate({ name, symbols, initialCapitalUsd, rollingWindowDays: 90 });
  };

  return (
    <DashboardLayout>
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary"><Bot className="h-4 w-4" /> Research-only automation</div>
              <h1 className="text-3xl font-semibold tracking-tight">Daily Paper Trading Monitor</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">A daily virtual account tracks the existing technical composite signal after each completed UTC daily candle. It never connects to an exchange and never submits real orders.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {monitorsQuery.data && monitorsQuery.data.length > 0 ? <Select value={selectedMonitorId?.toString()} onValueChange={(value) => setSelectedMonitorId(Number(value))}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select monitor" /></SelectTrigger>
                <SelectContent>{monitorsQuery.data.map((item) => <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>)}</SelectContent>
              </Select> : null}
              <Button onClick={() => setCreating((value) => !value)} variant={creating ? "outline" : "default"}><Plus className="mr-2 h-4 w-4" />{creating ? "Cancel" : "New monitor"}</Button>
            </div>
          </section>

          {creating ? <Card>
            <CardHeader><CardTitle>Configure a research monitor</CardTitle><CardDescription>Default parameters use the existing SMA/RSI/MACD/EMA technical composite. Signals are virtual and executed at the next daily opening price.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="monitor-name">Name</Label><Input id="monitor-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="monitor-capital">Initial virtual capital (USD)</Label><Input id="monitor-capital" inputMode="decimal" value={capital} onChange={(event) => setCapital(event.target.value)} /></div>
              <div className="space-y-2"><Label>Daily schedule</Label><div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">00:10 UTC, after candle close</div></div>
              <div className="md:col-span-3 flex flex-wrap gap-2">{DEFAULT_SYMBOLS.map((symbol) => <Button key={symbol} size="sm" variant={symbols.includes(symbol) ? "default" : "outline"} onClick={() => setSymbols((current) => current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol])}>{symbol.replace("USDT", "")}</Button>)}</div>
              <div className="md:col-span-3"><Button onClick={submitCreate} disabled={createMonitor.isPending || symbols.length === 0}>{createMonitor.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create research monitor</Button></div>
            </CardContent>
          </Card> : null}

          {!monitor && !dashboardQuery.isLoading ? <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Activity className="mb-4 h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-medium">No daily monitor yet</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Create a virtual monitor, then enable its daily schedule after this application version is published.</p></CardContent></Card> : null}

          {monitor ? <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Card><CardHeader className="pb-2"><CardDescription>Virtual equity</CardDescription><CardTitle className="text-2xl">{formatUsdFromCents(latestRun?.equityCents ?? monitor.cashCents)}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Cash: {formatUsdFromCents(monitor.cashCents)}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Model vs benchmark</CardDescription><CardTitle className="text-2xl">{formatBps(latestRun?.modelReturnBps)}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Buy-and-hold: {formatBps(latestRun?.benchmarkReturnBps)}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Rolling profit factor</CardDescription><CardTitle className="text-2xl">{latestRun?.rollingProfitFactorMilli ? (latestRun.rollingProfitFactorMilli / 1000).toFixed(2) : "—"}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">{latestRun?.rollingTrades ?? 0} closed trades in window</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Model status</CardDescription><CardTitle className="flex items-center gap-2 text-2xl"><Badge variant={monitor.lastStatus === "healthy" ? "default" : "secondary"}>{statusLabel(monitor.lastStatus)}</Badge></CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Last update: {monitor.lastRunAt ? new Date(monitor.lastRunAt).toLocaleString() : "Not run"}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardDescription>Run diagnostics</CardDescription><CardTitle className="text-xl">{latestRun?.dataFreshness === "fresh" ? "Data fresh" : latestRun?.dataFreshness === "stale" ? "Data stale" : "Pending"}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Candle age: {latestRun?.candleAgeMinutes === null || latestRun?.candleAgeMinutes === undefined ? "—" : `${latestRun.candleAgeMinutes} min`} · Equity check: {latestRun?.equityInvariantDeltaCents === 0 ? "passed" : latestRun?.equityInvariantDeltaCents === null || latestRun?.equityInvariantDeltaCents === undefined ? "—" : "review"}</p></CardContent></Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
              <Card><CardHeader><CardTitle>Rolling performance versus benchmark</CardTitle><CardDescription>Returns are calculated from virtual positions and an equal-weight buy-and-hold baseline using the same monitored symbols.</CardDescription></CardHeader><CardContent><div className="h-72">{chartData.length > 1 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} /><Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} /><Line type="monotone" dataKey="model" name="Model" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="benchmark" name="Buy & hold" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" dot={false} /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Daily results will appear after completed candles are processed.</div>}</div></CardContent></Card>
              <Card><CardHeader><CardTitle>Daily control</CardTitle><CardDescription>Current schedule: {monitor.scheduleCron ?? "not enabled"}</CardDescription></CardHeader><CardContent className="space-y-3"><Button className="w-full" onClick={() => enableDaily.mutate({ monitorId: monitor.id })} disabled={monitor.enabled === 1 || enableDaily.isPending}>{enableDaily.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CirclePlay className="mr-2 h-4 w-4" />}Enable daily updates</Button><Button className="w-full" variant="outline" onClick={() => runNow.mutate({ monitorId: monitor.id })} disabled={monitor.enabled !== 1 || runNow.isPending}>{runNow.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Run completed-day check</Button><Button className="w-full" variant="ghost" onClick={() => pauseDaily.mutate({ monitorId: monitor.id })} disabled={monitor.enabled !== 1 || pauseDaily.isPending}><CirclePause className="mr-2 h-4 w-4" />Pause daily updates</Button><div className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" />Virtual trades only. Status turns <strong>Degraded</strong> when rolling PF is below 1.00 with enough history or the model trails the benchmark by at least 5 percentage points.</div></CardContent></Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Card><CardHeader><CardTitle>Open virtual positions</CardTitle></CardHeader><CardContent>{dashboard.openTrades.length === 0 ? <p className="text-sm text-muted-foreground">No open virtual positions.</p> : <div className="space-y-3">{dashboard.openTrades.map((trade) => <div key={trade.id} className="flex items-center justify-between border-b pb-3 last:border-0"><div><p className="font-medium">{trade.symbol.replace("USDT", "")}</p><p className="text-xs text-muted-foreground">Opened {new Date(trade.openedAt).toLocaleDateString()}</p></div><p className="text-sm">{formatUsdFromCents(trade.entryCapitalCents)}</p></div>)}</div>}</CardContent></Card>
              <Card><CardHeader><CardTitle>Recent virtual trade decisions</CardTitle></CardHeader><CardContent>{dashboard.recentTrades.length === 0 ? <p className="text-sm text-muted-foreground">No virtual trades have been generated yet.</p> : <div className="space-y-3">{dashboard.recentTrades.slice(0, 8).map((trade) => <div key={trade.id} className="flex items-center justify-between border-b pb-3 last:border-0"><div><p className="font-medium">{trade.symbol.replace("USDT", "")} · {trade.status}</p><p className="text-xs text-muted-foreground">{trade.closeReason ?? "Awaiting signal exit"}</p></div><p className={`text-sm ${trade.pnlCents && trade.pnlCents < 0 ? "text-destructive" : "text-primary"}`}>{trade.pnlCents === null ? "—" : formatUsdFromCents(trade.pnlCents)}</p></div>)}</div>}</CardContent></Card>
            </section>
            {monitor.lastStatus === "degraded" ? <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" /><p>The monitor has marked the research model as degraded. Treat this as evidence to pause and review the strategy, not as an instruction to trade.</p></div> : null}
          </> : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
