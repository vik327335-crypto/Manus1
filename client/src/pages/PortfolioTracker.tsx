import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ResearchPosition {
  ticker: string;
  quantity: number;
  recordedCostBasis: number;
}

export default function PortfolioTracker() {
  const [positions, setPositions] = useState<ResearchPosition[]>([]);
  const [newPosition, setNewPosition] = useState<ResearchPosition>({ ticker: "", quantity: 0, recordedCostBasis: 0 });

  const handleAddPosition = () => {
    if (!newPosition.ticker || newPosition.quantity <= 0) return;
    setPositions((current) => [...current, newPosition]);
    setNewPosition({ ticker: "", quantity: 0, recordedCostBasis: 0 });
  };

  const handleRemovePosition = (ticker: string) => {
    setPositions((current) => current.filter((position) => position.ticker !== ticker));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Tracker</h1>
        <p className="text-muted-foreground">Manual research records only. Portfolio valuation and risk analytics require verified holdings and price provenance.</p>
      </div>

      <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <CardContent className="pt-6 text-sm">
          No verified owner-scoped holdings or fresh price source is attached. This route does not calculate current value, P&amp;L, volatility, Sharpe ratio, drawdown, VaR, allocation, performance charts, or rebalancing recommendations from seeded or client-supplied values.
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {["Total Value", "Gain / Loss", "Sharpe Ratio", "Max Drawdown"].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-muted-foreground">—</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Research Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No research positions recorded. Add a manual record below; it will not be treated as a live exchange holding or a verified valuation.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b"><th className="py-2 text-left">Ticker</th><th className="py-2 text-right">Quantity</th><th className="py-2 text-right">Recorded Cost Basis</th><th className="py-2 text-center">Action</th></tr></thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.ticker} className="border-b"><td className="py-2 font-semibold">{position.ticker}</td><td className="py-2 text-right">{position.quantity}</td><td className="py-2 text-right">${position.recordedCostBasis.toFixed(2)}</td><td className="py-2 text-center"><Button variant="ghost" size="sm" onClick={() => handleRemovePosition(position.ticker)}>Remove</Button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add Manual Research Position</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div><Label>Ticker</Label><Input placeholder="BTC" value={newPosition.ticker} onChange={(event) => setNewPosition({ ...newPosition, ticker: event.target.value.toUpperCase() })} /></div>
            <div><Label>Quantity</Label><Input type="number" placeholder="0.5" value={newPosition.quantity || ""} onChange={(event) => setNewPosition({ ...newPosition, quantity: Number(event.target.value) || 0 })} /></div>
            <div><Label>Recorded Cost Basis</Label><Input type="number" placeholder="40000" value={newPosition.recordedCostBasis || ""} onChange={(event) => setNewPosition({ ...newPosition, recordedCostBasis: Number(event.target.value) || 0 })} /></div>
            <div className="flex items-end"><Button onClick={handleAddPosition} className="w-full">Add Research Record</Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
