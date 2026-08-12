import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Plus, Send, Trash2, Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type ChannelType = "generic" | "discord" | "slack" | "telegram";

const channelOptions: Array<{ value: ChannelType; label: string }> = [
  { value: "generic", label: "Generic JSON" },
  { value: "discord", label: "Discord" },
  { value: "slack", label: "Slack" },
  { value: "telegram", label: "Telegram-compatible" },
];

export default function WebhookIntegrations() {
  const utils = trpc.useUtils();
  const channelsQuery = trpc.webhookIntegration.listChannels.useQuery();
  const supportedEventsQuery = trpc.webhookIntegration.getSupportedEvents.useQuery();
  const deliveryLogsQuery = trpc.webhookIntegration.getRecentDeliveryLogs.useQuery(
    { limit: 20 },
    { refetchInterval: 30_000 }
  );
  const createChannel = trpc.webhookIntegration.createChannel.useMutation({
    onSuccess: () => {
      utils.webhookIntegration.listChannels.invalidate();
      setName("");
      setEndpointUrl("");
      setSelectedEvents(["price_alert"]);
    },
  });
  const updateChannel = trpc.webhookIntegration.updateChannel.useMutation({
    onSuccess: () => utils.webhookIntegration.listChannels.invalidate(),
  });
  const deleteChannel = trpc.webhookIntegration.deleteChannel.useMutation({
    onSuccess: () => utils.webhookIntegration.listChannels.invalidate(),
  });
  const testChannel = trpc.webhookIntegration.sendTest.useMutation({
    onSuccess: () => utils.webhookIntegration.listChannels.invalidate(),
  });

  const [name, setName] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("generic");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["price_alert"]);

  const eventTypes = supportedEventsQuery.data?.events ?? [];
  const isFormValid = useMemo(
    () => name.trim().length >= 2 && endpointUrl.startsWith("https://") && selectedEvents.length > 0,
    [name, endpointUrl, selectedEvents]
  );
  const channelNames = useMemo(
    () => new Map((channelsQuery.data?.channels ?? []).map((channel) => [channel.id, channel.name])),
    [channelsQuery.data?.channels]
  );
  const retryStats = useMemo(() => {
    const logs = deliveryLogsQuery.data?.logs ?? [];
    return {
      deliveries: logs.length,
      retries: logs.filter((log) => log.retried).length,
      recovered: logs.filter((log) => log.success && log.attemptCount > 1).length,
      failures: logs.filter((log) => !log.success).length,
    };
  }, [deliveryLogsQuery.data?.logs]);

  const toggleEvent = (eventType: string) => {
    setSelectedEvents((current) =>
      current.includes(eventType) ? current.filter((item) => item !== eventType) : [...current, eventType]
    );
  };

  const submitChannel = () => {
    if (!isFormValid) return;
    createChannel.mutate({
      name: name.trim(),
      channelType,
      endpointUrl: endpointUrl.trim(),
      eventTypes: selectedEvents as any,
      enabled: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold">Webhook Integrations</h1>
          <p className="text-muted-foreground">Deliver selected scanner events to your external communication channels.</p>
        </div>
        <Badge variant="outline" className="w-fit">HTTPS-only outbound delivery</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a delivery channel</CardTitle>
          <CardDescription>Webhook addresses are validated to prevent local-network delivery. Test delivery occurs only when you press the test button.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">Channel name<Input value={name} placeholder="Risk alerts" onChange={(event) => setName(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-medium">Channel type<select value={channelType} onChange={(event) => setChannelType(event.target.value as ChannelType)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{channelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="space-y-2 text-sm font-medium">Webhook URL<Input type="url" value={endpointUrl} placeholder="https://…" onChange={(event) => setEndpointUrl(event.target.value)} /></label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Events to deliver</p>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((eventType) => <button key={eventType} type="button" onClick={() => toggleEvent(eventType)} className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-colors ${selectedEvents.includes(eventType) ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-muted"}`}>{eventType.replaceAll("_", " ")}</button>)}
            </div>
          </div>

          {createChannel.isError && <p className="text-sm text-destructive">{createChannel.error.message}</p>}
          <Button onClick={submitChannel} disabled={!isFormValid || createChannel.isPending}><Plus className="mr-2 h-4 w-4" />Add channel</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Configured channels</CardTitle><CardDescription>Enable, test, or remove channels you control.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {channelsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading channels…</p>}
          {channelsQuery.isError && <p className="text-sm text-destructive">Unable to load webhook channels.</p>}
          {!channelsQuery.isLoading && (channelsQuery.data?.channels.length ?? 0) === 0 && <div className="rounded-lg border border-dashed p-8 text-center"><Webhook className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No webhook channels configured</p><p className="mt-1 text-sm text-muted-foreground">Add a channel above to start routing selected notifications.</p></div>}

          {channelsQuery.data?.channels.map((channel) => (
            <div key={channel.id} className="flex flex-col justify-between gap-4 rounded-lg border p-4 lg:flex-row lg:items-center">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{channel.name}</p><Badge variant="secondary" className="capitalize">{channel.channelType}</Badge>{channel.enabled ? <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Enabled</Badge> : <Badge variant="outline">Paused</Badge>}</div>
                <p className="truncate text-sm text-muted-foreground">{channel.endpointUrl}</p>
                <div className="flex flex-wrap gap-1">{channel.eventTypes.map((eventType) => <Badge key={eventType} variant="outline" className="text-xs">{eventType.replaceAll("_", " ")}</Badge>)}</div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={testChannel.isPending} onClick={() => testChannel.mutate({ channelId: channel.id })}><Send className="mr-2 h-4 w-4" />Test</Button>
                <Button variant="outline" size="sm" disabled={updateChannel.isPending} onClick={() => updateChannel.mutate({ channelId: channel.id, enabled: !channel.enabled })}>{channel.enabled ? "Pause" : "Enable"}</Button>
                <Button variant="ghost" size="icon" className="text-destructive" aria-label={`Delete ${channel.name}`} disabled={deleteChannel.isPending} onClick={() => deleteChannel.mutate({ channelId: channel.id })}><Trash2 className="h-4 w-4" /></Button>
              </div>
              {testChannel.isSuccess && testChannel.variables?.channelId === channel.id && <p className={`basis-full text-sm ${testChannel.data.success ? "text-emerald-600" : "text-destructive"}`}>{testChannel.data.success ? "Test webhook delivered." : testChannel.data.responseSummary}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery history</CardTitle>
          <CardDescription>Automatic event deliveries and explicit connection tests from the last 20 attempts.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Deliveries</p><p className="mt-1 text-xl font-semibold">{retryStats.deliveries}</p></div>
            <div className="rounded-md bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Retried</p><p className="mt-1 text-xl font-semibold">{retryStats.retries}</p></div>
            <div className="rounded-md bg-emerald-500/10 p-3"><p className="text-xs text-muted-foreground">Recovered</p><p className="mt-1 text-xl font-semibold text-emerald-600">{retryStats.recovered}</p></div>
            <div className="rounded-md bg-destructive/10 p-3"><p className="text-xs text-muted-foreground">Final failures</p><p className="mt-1 text-xl font-semibold text-destructive">{retryStats.failures}</p></div>
          </div>
          {deliveryLogsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading delivery history…</p>}
          {deliveryLogsQuery.isError && <p className="text-sm text-destructive">Unable to load delivery history.</p>}
          {!deliveryLogsQuery.isLoading && (deliveryLogsQuery.data?.logs.length ?? 0) === 0 && <p className="py-4 text-sm text-muted-foreground">No deliveries have been recorded yet.</p>}
          {(deliveryLogsQuery.data?.logs.length ?? 0) > 0 && (
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b text-left text-muted-foreground"><tr><th className="px-3 py-3">Time</th><th className="px-3 py-3">Channel</th><th className="px-3 py-3">Event</th><th className="px-3 py-3">Result</th><th className="px-3 py-3">Attempts</th><th className="px-3 py-3">HTTP</th><th className="px-3 py-3">Response</th></tr></thead>
              <tbody>{deliveryLogsQuery.data?.logs.map((log) => <tr key={log.id} className="border-b"><td className="whitespace-nowrap px-3 py-3">{new Date(log.createdAt).toLocaleString()}</td><td className="px-3 py-3">{channelNames.get(log.channelId) ?? `Channel #${log.channelId}`}</td><td className="px-3 py-3"><Badge variant="outline">{log.eventType.replaceAll("_", " ")}</Badge></td><td className="px-3 py-3"><Badge variant={log.success ? "default" : "destructive"}>{log.success ? "Delivered" : "Failed"}</Badge></td><td className="px-3 py-3">{log.attemptCount}{log.retried ? " (retry)" : ""}</td><td className="px-3 py-3">{log.statusCode ?? "—"}</td><td className="max-w-[280px] truncate px-3 py-3 text-muted-foreground" title={log.responseSummary ?? undefined}>{log.responseSummary ?? "—"}</td></tr>)}</tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Webhook delivery is for notifications only. URLs must belong to channels you administer; request bodies contain only selected event data and no trading credentials.</p>
    </div>
  );
}
