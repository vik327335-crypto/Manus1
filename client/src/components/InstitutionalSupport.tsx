import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Fund {
  name: string;
  tier: "tier1" | "tier2" | "tier3";
  allocation: number; // percentage
  entryDate: string;
}

interface WhaleActivity {
  address: string;
  label: string;
  balance: number;
  change24h: number;
  type: "accumulating" | "distributing" | "holding";
}

interface InstitutionalSupportProps {
  funds: Fund[];
  whales: WhaleActivity[];
  smartMoneyScore: number; // 0-100
}

export function InstitutionalSupport({
  funds,
  whales,
  smartMoneyScore,
}: InstitutionalSupportProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "tier1":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "tier2":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "tier3":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "accumulating":
        return "text-green-600";
      case "distributing":
        return "text-red-600";
      case "holding":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "accumulating":
        return "📈 Accumulating";
      case "distributing":
        return "📉 Distributing";
      case "holding":
        return "➡️ Holding";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Smart Money Score */}
      <Card className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Smart Money Score
          </h3>
          <div className="text-3xl font-bold text-amber-600">{smartMoneyScore}</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all"
            style={{ width: `${smartMoneyScore}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Based on institutional holdings and whale activity
        </p>
      </Card>

      {/* Tier-1 Funds */}
      {funds.length > 0 && (
        <Card className="card-elevated p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Institutional Holdings
          </h3>
          <div className="space-y-3">
            {funds.map((fund, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{fund.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Entered {fund.entryDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getTierColor(fund.tier)}>
                    {fund.tier.replace("tier", "Tier ")}
                  </Badge>
                  <div className="text-right">
                    <p className="font-semibold">{fund.allocation}%</p>
                    <p className="text-xs text-muted-foreground">Allocation</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Whale Activity */}
      {whales.length > 0 && (
        <Card className="card-elevated p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Whale Activity
          </h3>
          <div className="space-y-3">
            {whales.map((whale, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{whale.label}</p>
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-1 rounded",
                        getActivityColor(whale.type)
                      )}
                    >
                      {getActivityLabel(whale.type)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {whale.address}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold">
                    {(whale.balance / 1000000).toFixed(2)}M
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      whale.change24h > 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {whale.change24h > 0 ? "+" : ""}
                    {whale.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {funds.length === 0 && whales.length === 0 && (
        <Card className="card-elevated p-6 text-center">
          <p className="text-muted-foreground">
            No institutional support data available
          </p>
        </Card>
      )}
    </div>
  );
}
