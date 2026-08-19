import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

type Provider = "binance" | "coinbase" | "kraken";

export default function ExchangeConnections() {
  const [provider, setProvider] = useState<Provider>("binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [apiPassphrase, setApiPassphrase] = useState("");
  const utils = trpc.useUtils();
  const list = trpc.exchangeConnections.list.useQuery();
  const refresh = () => utils.exchangeConnections.list.invalidate();
  const create = trpc.exchangeConnections.create.useMutation({ onSuccess: async () => { setApiKey(""); setApiSecret(""); setApiPassphrase(""); await refresh(); } });
  const setStatus = trpc.exchangeConnections.setStatus.useMutation({ onSuccess: refresh });
  const remove = trpc.exchangeConnections.remove.useMutation({ onSuccess: refresh });

  return <DashboardLayout><main className="space-y-6 p-6">
    <header><h1 className="text-2xl font-semibold">Read-only exchange connections</h1><p className="text-sm text-muted-foreground">Connect Binance, Coinbase, or Kraken API keys for account-data access only. Trading, order cancellation, transfers, and withdrawals are not available.</p></header>
    <Card><CardHeader><CardTitle>Add read-only connection</CardTitle><CardDescription>Create the key on the exchange with read-only permissions only. Do not enable trading or withdrawal permissions. Credentials are encrypted server-side and will never be displayed again.</CardDescription></CardHeader><CardContent>
      <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); create.mutate({ provider, apiKey, apiSecret, ...(apiPassphrase ? { apiPassphrase } : {}) }); }}>
        <Select value={provider} onValueChange={(value) => setProvider(value as Provider)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="binance">Binance</SelectItem><SelectItem value="coinbase">Coinbase</SelectItem><SelectItem value="kraken">Kraken</SelectItem></SelectContent></Select>
        <Input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} autoComplete="off" placeholder="Read-only API key" minLength={8} required />
        <Input type="password" value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} autoComplete="off" placeholder="Read-only API secret" minLength={8} required />
        <Input type="password" value={apiPassphrase} onChange={(event) => setApiPassphrase(event.target.value)} autoComplete="off" placeholder="Passphrase, if your provider requires one" />
        <Button type="submit" disabled={create.isPending}>{create.isPending ? "Encrypting connection…" : "Add read-only connection"}</Button>
        {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
      </form>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Saved connections</CardTitle><CardDescription>Only provider, masked fingerprint, and non-secret status are visible. Disable a connection before permanently deleting its encrypted credentials.</CardDescription></CardHeader><CardContent className="space-y-3">
      {list.error && <p className="text-sm text-destructive">Connections could not be loaded. Refresh and confirm you are signed in.</p>}
      {list.data?.length ? list.data.map((connection) => <div key={connection.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0"><div><p className="font-medium capitalize">{connection.provider}</p><p className="text-xs text-muted-foreground">{connection.keyMasked} · read-only · {connection.status}</p></div><div className="flex gap-2">{connection.status === "active" ? <Button variant="outline" size="sm" onClick={() => setStatus.mutate({ id: connection.id, status: "disabled" })}>Disable</Button> : <><Button variant="outline" size="sm" onClick={() => setStatus.mutate({ id: connection.id, status: "active" })}>Re-enable</Button><Button variant="destructive" size="sm" onClick={() => { if (window.confirm("Delete this disabled read-only connection and its encrypted credentials?")) remove.mutate({ id: connection.id }); }}>Delete</Button></>}</div></div>) : <p className="text-sm text-muted-foreground">No exchange keys are connected. Add a read-only key only when you are ready.</p>}
    </CardContent></Card>
  </main></DashboardLayout>;
}
