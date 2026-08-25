import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, CheckCircle2, Clock, Database, ShieldAlert, TrendingUp, Zap } from "lucide-react";

type MonitoringPeriod = "minute" | "hour" | "day";

const periodLabels: Record<MonitoringPeriod, string> = {
  minute: "1m",
  hour: "1h",
  day: "24h",
};

function formatUptime(milliseconds: number): string {
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
}

function formatTimestamp(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [period, setPeriod] = useState<MonitoringPeriod>("hour");
  const reportQuery = trpc.performanceMonitoring.getReport.useQuery(
    { period },
    { refetchInterval: 30_000 }
  );
  const slowEndpointsQuery = trpc.performanceMonitoring.getSlowEndpoints.useQuery(
    { period, limit: 10 },
    { refetchInterval: 30_000 }
  );
  const providerHealthQuery = trpc.historicalData.getProviderHealth.useQuery(undefined, { refetchInterval: 30_000 });
  const btcCrossCheckQuery = trpc.historicalData.getQuoteCrossCheck.useQuery({ ticker: "BTC" }, { refetchInterval: 30_000 });

  const report = reportQuery.data?.report;
  const health = report?.systemHealth;
  const slowEndpoints = slowEndpointsQuery.data?.endpoints ?? [];
  const providerHealth = providerHealthQuery.data;
  const btcCrossCheck = btcCrossCheckQuery.data;

  const chartData = useMemo(() => {
    const buckets = new Map<
      string,
      { timestamp: string; latencyTotal: number; requests: number; cacheHits: number; errors: number }
    >();

    for (const metric of report?.metrics ?? []) {
      const metricTime = metric.timestamp instanceof Date ? metric.timestamp : new Date(metric.timestamp);
      const key = metricTime.toISOString().slice(0, 16);
      const bucket = buckets.get(key) ?? {
        timestamp: formatTimestamp(metricTime),
        latencyTotal: 0,
        requests: 0,
        cacheHits: 0,
        errors: 0,
      };

      bucket.latencyTotal += metric.duration;
      bucket.requests += 1;
      bucket.cacheHits += metric.cached ? 1 : 0;
      bucket.errors += metric.statusCode >= 400 ? 1 : 0;
      buckets.set(key, bucket);
    }

    return Array.from(buckets.values()).map((bucket) => ({
      timestamp: bucket.timestamp,
      latency: Number((bucket.latencyTotal / bucket.requests).toFixed(1)),
      cacheHitRate: Number(((bucket.cacheHits / bucket.requests) * 100).toFixed(1)),
      errorRate: Number(((bucket.errors / bucket.requests) * 100).toFixed(1)),
      throughput: bucket.requests,
    }));
  }, [report]);

  const getSeverityColor = (severity: "info" | "warning" | "critical") => {
    if (severity === "critical") return "bg-red-100 text-red-800";
    if (severity === "warning") return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  if (reportQuery.isError || slowEndpointsQuery.isError || providerHealthQuery.isError || btcCrossCheckQuery.isError) {
    return (
      <Card className="p-6">
        <h1 className="text-2xl font-bold">Performance Monitoring</h1>
        <p className="mt-2 text-destructive">
          Не удалось загрузить данные мониторинга. Повторите попытку через несколько секунд.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-muted-foreground">Latency, cache efficiency, request volume, and health indicators.</p>
        </div>
        <div className="flex gap-2" aria-label="Monitoring period">
          {(Object.keys(periodLabels) as MonitoringPeriod[]).map((range) => (
            <button
              key={range}
              onClick={() => setPeriod(range)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                period === range
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {periodLabels[range]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg latency</p>
              <p className="mt-2 text-2xl font-bold">
                {report ? `${report.systemHealth.avgResponseTime.toFixed(0)}ms` : "—"}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cache hit rate</p>
              <p className="mt-2 text-2xl font-bold">
                {report ? `${report.cacheMetrics.hitRate.toFixed(1)}%` : "—"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Error rate</p>
              <p className="mt-2 text-2xl font-bold">
                {report ? `${report.systemHealth.errorRate.toFixed(2)}%` : "—"}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Request volume</p>
              <p className="mt-2 text-2xl font-bold">
                {report ? `${report.rateLimitMetrics.avgRequestsPerMinute.toFixed(0)}/min` : "—"}
              </p>
            </div>
            <Zap className="h-8 w-8 text-violet-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Provider health &amp; data audit</h2>
            <p className="text-sm text-muted-foreground">Read-only provenance, freshness and rate-limit telemetry. No values are used to execute trades.</p>
          </div>
          <Badge variant="outline" className="w-fit">Refreshes every 30s</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {[
            { key: "polygon", label: "Polygon OHLCV (primary)", provider: providerHealth?.ohlcvPrimary },
            { key: "coingecko", label: "CoinGecko quote (primary)", provider: providerHealth?.quotePrimary },
            { key: "coinbase", label: "Coinbase Exchange (reserve)", provider: providerHealth?.reserve },
          ].map(({ key, label, provider }) => (
            <div key={key} className="border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{label}</p>
                {provider?.consecutiveFailures === 0 && provider?.lastSuccessAt ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <ShieldAlert className="h-5 w-5 text-amber-600" />}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-muted-foreground">Freshness</dt><dd>{provider?.freshnessAgeMs === null || provider?.freshnessAgeMs === undefined ? "—" : `${Math.round(provider.freshnessAgeMs / 1000)}s`}</dd></div>
                <div><dt className="text-muted-foreground">Last HTTP</dt><dd>{provider?.lastStatus ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">429 events</dt><dd>{provider?.rateLimitEvents ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Failures</dt><dd>{provider?.consecutiveFailures ?? "—"}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">Retry-After</dt><dd>{provider?.lastRetryAfterMs === null || provider?.lastRetryAfterMs === undefined ? "—" : `${Math.round(provider.lastRetryAfterMs / 1000)}s`}</dd></div>
              </dl>
            </div>
          ))}
          <div className="border border-border p-4">
            <div className="flex items-center justify-between gap-3"><p className="font-medium">OHLCV audit trail</p><Database className="h-5 w-5 text-blue-600" /></div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><dt className="text-muted-foreground">Snapshots</dt><dd>{providerHealth?.auditSnapshots.snapshotCount ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Latest ticker</dt><dd>{providerHealth?.auditSnapshots.latestTicker ?? "—"}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Storage</dt><dd>{providerHealth?.auditSnapshots.storageAvailable ? "Available" : "Unavailable"}</dd></div>
            </dl>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-4 text-sm">
          <p className="font-medium">BTC USD cross-check</p>
          {btcCrossCheck?.availability === "available" ? (
            <p className="mt-1 text-muted-foreground">CoinGecko vs Coinbase Exchange: {btcCrossCheck.divergenceBps?.toFixed(1)} bps; threshold {btcCrossCheck.thresholdBps} bps; verdict <span className={btcCrossCheck.verdict === "matched" ? "text-emerald-700" : "text-amber-700"}>{btcCrossCheck.verdict}</span>.</p>
          ) : (
            <p className="mt-1 text-muted-foreground">Cross-check unavailable: {btcCrossCheck?.reason ?? "loading provider responses"}.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">API latency</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis unit="ms" />
                <Tooltip />
                <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Cache hit rate</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="cacheHitRate" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Error rate</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="errorRate" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Requests per minute</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="throughput" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">System health</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2"><p className="text-sm text-muted-foreground">Uptime</p><p className="text-lg font-semibold">{health ? formatUptime(health.uptime) : "—"}</p></div>
          <div className="space-y-2"><p className="text-sm text-muted-foreground">Memory usage</p><p className="text-lg font-semibold">{health ? `${(health.memoryUsage / 1024 / 1024).toFixed(0)} MB` : "—"}</p></div>
          <div className="space-y-2"><p className="text-sm text-muted-foreground">Active connections</p><p className="text-lg font-semibold">{health?.activeConnections ?? "—"}</p></div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Slowest endpoints</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/60"><tr><th className="px-4 py-3 text-left text-sm font-semibold">Endpoint</th><th className="px-4 py-3 text-left text-sm font-semibold">Avg duration</th><th className="px-4 py-3 text-left text-sm font-semibold">Max duration</th><th className="px-4 py-3 text-left text-sm font-semibold">Requests</th></tr></thead>
            <tbody>
              {slowEndpoints.map((endpoint) => <tr key={endpoint.endpoint} className="border-b"><td className="px-4 py-3 text-sm font-medium">{endpoint.endpoint}</td><td className="px-4 py-3 text-sm">{endpoint.avgDuration.toFixed(0)}ms</td><td className="px-4 py-3 text-sm">{endpoint.maxDuration.toFixed(0)}ms</td><td className="px-4 py-3 text-sm">{endpoint.requestCount}</td></tr>)}
              {!slowEndpointsQuery.isLoading && slowEndpoints.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No endpoint metrics were recorded for this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Active threshold alerts</h2>
        <div className="space-y-3">
          {report?.alerts.map((alert) => <div key={alert.id} className={`rounded-lg p-4 ${getSeverityColor(alert.severity)}`}><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{alert.type.replaceAll("_", " ")}</p><p className="mt-1 text-sm">{alert.message}</p></div><Badge variant="outline" className="whitespace-nowrap">{formatTimestamp(alert.timestamp)}</Badge></div></div>)}
          {!reportQuery.isLoading && !report?.alerts.length && <p className="py-4 text-center text-sm text-muted-foreground">No active threshold alerts.</p>}
        </div>
      </Card>
    </div>
  );
};

export default PerformanceMonitoringDashboard;
