import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const unavailableMetrics = ["Всего активов", "Средний score", "Оценка списка"];

export default function Watchlist() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background"><div className="container py-8"><Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Button><div className="py-12 text-center"><p className="text-muted-foreground">Please sign in to view your watchlist</p></div></div></div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card"><div className="container py-6"><Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Button><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">My Watchlist</h1><p className="mt-1 text-muted-foreground">Research watchlist with verified data requirements</p></div>{user && <p className="text-sm font-medium">{user.name}</p>}</div></div></div>

      <div className="container space-y-8 py-8">
        <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><CardContent className="pt-6 text-sm">No verified owner-scoped watchlist and fresh market-data source is attached to this route. Static prices, 24-hour changes, aggregate value, CAN SLIM scores, alerts, and WebSocket updates are intentionally unavailable rather than being shown from hardcoded records.</CardContent></Card>

        <div className="grid gap-4 md:grid-cols-3">
          {unavailableMetrics.map((metric) => <Card key={metric} className="card-elevated p-6"><p className="mb-2 text-sm text-muted-foreground">{metric}</p><p className="text-3xl font-bold text-muted-foreground">—</p></Card>)}
        </div>

        <Card><CardHeader><CardTitle>Watchlist data unavailable</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">This route will display assets only after it receives an owner-scoped watchlist with explicit source, timestamp, and freshness metadata. It does not use seeded assets or subscribe to prices before that contract exists.</p></CardContent></Card>
      </div>
    </div>
  );
}
