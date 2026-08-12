import { useMemo, useState } from "react";
import { AlertCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

type Row = { id: number; symbol: string; quantity: number; currentPrice: number; targetAllocation: number };

const emptyRow = (id: number): Row => ({ id, symbol: "", quantity: 0, currentPrice: 0, targetAllocation: 0 });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export default function PortfolioRebalancing() {
  const [rows, setRows] = useState<Row[]>([emptyRow(1)]);
  const [driftThreshold, setDriftThreshold] = useState(3);
  const [minTradeValue, setMinTradeValue] = useState(25);
  const [cashReservePercentage, setCashReservePercentage] = useState(0);
  const [estimatedFeeBps, setEstimatedFeeBps] = useState(10);
  const [isRequested, setIsRequested] = useState(false);

  const populatedRows = useMemo(
    () => rows.filter((row) => row.symbol.trim() && row.quantity > 0 && row.currentPrice > 0),
    [rows]
  );
  const targetTotal = useMemo(
    () => rows.reduce((total, row) => total + (Number.isFinite(row.targetAllocation) ? row.targetAllocation : 0), 0),
    [rows]
  );
  const requiredTargetTotal = 100 - cashReservePercentage;
  const hasValidTargetTotal = Math.abs(targetTotal - requiredTargetTotal) < 0.01;
  const isInputValid = populatedRows.length > 0 && populatedRows.length === rows.length && hasValidTargetTotal;

  const previewInput = useMemo(
    () => ({
      positions: populatedRows.map(({ symbol, quantity, currentPrice }) => ({ symbol: symbol.trim().toUpperCase(), quantity, currentPrice })),
      targets: rows.map(({ symbol, targetAllocation }) => ({ symbol: symbol.trim().toUpperCase(), targetAllocation })),
      constraints: { driftThreshold, minTradeValue, cashReservePercentage, estimatedFeeBps },
    }),
    [populatedRows, rows, driftThreshold, minTradeValue, cashReservePercentage, estimatedFeeBps]
  );

  const previewQuery = trpc.portfolioRebalancing.previewPlan.useQuery(previewInput, {
    enabled: isRequested && isInputValid,
  });
  const plan = previewQuery.data?.plan;

  const updateRow = (id: number, field: keyof Omit<Row, "id">, value: string | number) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setIsRequested(false);
  };

  const addRow = () => {
    const nextId = Math.max(...rows.map((row) => row.id), 0) + 1;
    setRows((current) => [...current, emptyRow(nextId)]);
    setIsRequested(false);
  };

  const removeRow = (id: number) => {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.id !== id)));
    setIsRequested(false);
  };

  const submitPreview = () => {
    setIsRequested(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Rebalancing</h1>
          <p className="text-muted-foreground">Compare current holdings with targets and create a non-executing trade plan.</p>
        </div>
        <Badge variant="outline" className="w-fit">Preview only — no trades are placed</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current positions and target allocation</CardTitle>
          <CardDescription>Enter position values in USD. Target allocations must equal {requiredTargetTotal.toFixed(2)}% after the cash reserve.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <div className="min-w-[760px] space-y-3">
              <div className="grid grid-cols-[1.1fr_1fr_1fr_1fr_44px] gap-3 px-1 text-xs font-medium text-muted-foreground">
                <span>Symbol</span><span>Quantity</span><span>Current price (USD)</span><span>Target allocation (%)</span><span />
              </div>
              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1.1fr_1fr_1fr_1fr_44px] gap-3">
                  <Input value={row.symbol} placeholder="BTC" onChange={(event) => updateRow(row.id, "symbol", event.target.value)} />
                  <Input type="number" min="0" step="any" value={row.quantity || ""} onChange={(event) => updateRow(row.id, "quantity", Number(event.target.value))} />
                  <Input type="number" min="0" step="any" value={row.currentPrice || ""} onChange={(event) => updateRow(row.id, "currentPrice", Number(event.target.value))} />
                  <Input type="number" min="0" max="100" step="0.01" value={row.targetAllocation || ""} onChange={(event) => updateRow(row.id, "targetAllocation", Number(event.target.value))} />
                  <Button variant="ghost" size="icon" aria-label={`Remove ${row.symbol || "position"}`} disabled={rows.length === 1} onClick={() => removeRow(row.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" onClick={addRow}><Plus className="mr-2 h-4 w-4" />Add position</Button>
            <p className={`text-sm font-medium ${hasValidTargetTotal ? "text-emerald-600" : "text-destructive"}`}>Targets: {targetTotal.toFixed(2)}% / {requiredTargetTotal.toFixed(2)}%</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rebalancing constraints</CardTitle><CardDescription>These rules determine when the system includes a previewed adjustment.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2 text-sm font-medium">Drift threshold (%)<Input type="number" min="0" max="100" step="0.1" value={driftThreshold} onChange={(event) => { setDriftThreshold(Number(event.target.value)); setIsRequested(false); }} /></label>
          <label className="space-y-2 text-sm font-medium">Minimum trade (USD)<Input type="number" min="0" step="1" value={minTradeValue} onChange={(event) => { setMinTradeValue(Number(event.target.value)); setIsRequested(false); }} /></label>
          <label className="space-y-2 text-sm font-medium">Cash reserve (%)<Input type="number" min="0" max="99.99" step="0.01" value={cashReservePercentage} onChange={(event) => { setCashReservePercentage(Number(event.target.value)); setIsRequested(false); }} /></label>
          <label className="space-y-2 text-sm font-medium">Estimated fee (bps)<Input type="number" min="0" max="1000" step="1" value={estimatedFeeBps} onChange={(event) => { setEstimatedFeeBps(Number(event.target.value)); setIsRequested(false); }} /></label>
        </CardContent>
      </Card>

      {!isInputValid && <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>Enter a valid symbol, positive quantity and price for every row. Target allocations must equal the required total.</span></div>}
      <Button size="lg" disabled={!isInputValid || previewQuery.isFetching} onClick={submitPreview}><RefreshCw className={`mr-2 h-4 w-4 ${previewQuery.isFetching ? "animate-spin" : ""}`} />Generate preview</Button>

      {previewQuery.isError && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Unable to create a plan. Check positions and target allocations, then try again.</div>}

      {plan && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="p-5"><p className="text-sm text-muted-foreground">Portfolio value</p><p className="mt-2 text-2xl font-bold">{formatCurrency(plan.portfolioValue)}</p></Card>
            <Card className="p-5"><p className="text-sm text-muted-foreground">Turnover</p><p className="mt-2 text-2xl font-bold">{plan.turnoverPercentage.toFixed(2)}%</p><p className="text-xs text-muted-foreground">{formatCurrency(plan.turnoverValue)}</p></Card>
            <Card className="p-5"><p className="text-sm text-muted-foreground">Estimated fees</p><p className="mt-2 text-2xl font-bold">{formatCurrency(plan.estimatedFees)}</p></Card>
            <Card className="p-5"><p className="text-sm text-muted-foreground">Allocation drift</p><p className="mt-2 text-2xl font-bold">{plan.totalDriftBefore.toFixed(2)} pp</p><p className="text-xs text-muted-foreground">After plan: {plan.totalDriftAfter.toFixed(2)} pp</p></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Suggested adjustments</CardTitle><CardDescription>These are calculation outputs only. Review them before any manual action.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm"><thead className="border-b text-left text-muted-foreground"><tr><th className="px-3 py-3">Asset</th><th className="px-3 py-3">Current</th><th className="px-3 py-3">Target</th><th className="px-3 py-3">Drift</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Trade value</th><th className="px-3 py-3">Est. fee</th></tr></thead><tbody>{plan.trades.map((trade) => <tr key={trade.symbol} className="border-b"><td className="px-3 py-3 font-medium">{trade.symbol}</td><td className="px-3 py-3">{trade.currentAllocation.toFixed(2)}%</td><td className="px-3 py-3">{trade.targetAllocation.toFixed(2)}%</td><td className="px-3 py-3">{trade.driftPercentagePoints.toFixed(2)} pp</td><td className="px-3 py-3"><Badge variant={trade.action === "BUY" ? "default" : trade.action === "SELL" ? "destructive" : "secondary"}>{trade.action}</Badge></td><td className="px-3 py-3">{trade.action === "HOLD" ? "—" : formatCurrency(trade.tradeValue)}</td><td className="px-3 py-3">{trade.action === "HOLD" ? "—" : formatCurrency(trade.estimatedFee)}</td></tr>)}</tbody></table>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-xs text-muted-foreground">This planning tool uses the values entered on this page and estimates fees from your selected basis-points assumption. It does not use taxes, liquidity, exchange restrictions, or live execution data. This is research and analysis only, not personalized financial advice.</p>
    </div>
  );
}
