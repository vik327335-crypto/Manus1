import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, PieChart } from "lucide-react";

interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  allocation: number;
}

interface Portfolio {
  id: string;
  name: string;
  description: string;
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  gainPercent: number;
  assets: PortfolioAsset[];
  createdAt: string;
}

// Mock portfolios
const mockPortfolios: Portfolio[] = [
  {
    id: "1",
    name: "Main Portfolio",
    description: "My primary investment portfolio",
    totalValue: 125000,
    totalInvested: 100000,
    totalGain: 25000,
    gainPercent: 25,
    createdAt: "2026-01-15",
    assets: [
      {
        id: "a1",
        symbol: "BTC",
        name: "Bitcoin",
        quantity: 1.5,
        buyPrice: 30000,
        currentPrice: 45230,
        allocation: 54,
      },
      {
        id: "a2",
        symbol: "ETH",
        name: "Ethereum",
        quantity: 10,
        buyPrice: 2000,
        currentPrice: 2850,
        allocation: 23,
      },
      {
        id: "a3",
        symbol: "SOL",
        name: "Solana",
        quantity: 100,
        buyPrice: 100,
        currentPrice: 145.5,
        allocation: 15,
      },
      {
        id: "a4",
        symbol: "ADA",
        name: "Cardano",
        quantity: 500,
        buyPrice: 0.5,
        currentPrice: 0.98,
        allocation: 8,
      },
    ],
  },
  {
    id: "2",
    name: "Aggressive Growth",
    description: "High-risk, high-reward portfolio",
    totalValue: 45000,
    totalInvested: 40000,
    totalGain: 5000,
    gainPercent: 12.5,
    createdAt: "2026-02-20",
    assets: [
      {
        id: "b1",
        symbol: "SOL",
        name: "Solana",
        quantity: 300,
        buyPrice: 120,
        currentPrice: 145.5,
        allocation: 95,
      },
      {
        id: "b2",
        symbol: "ADA",
        name: "Cardano",
        quantity: 100,
        buyPrice: 0.8,
        currentPrice: 0.98,
        allocation: 5,
      },
    ],
  },
];

function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  const isPositive = portfolio.gainPercent >= 0;

  return (
    <Card className="card-elevated p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{portfolio.name}</h3>
          <p className="text-sm text-muted-foreground">{portfolio.description}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Value</p>
          <p className="text-2xl font-bold">
            ${portfolio.totalValue.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Gain</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
              ${Math.abs(portfolio.totalGain).toLocaleString()}
            </p>
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 pb-4 border-b border-border">
        <p className="text-xs text-muted-foreground mb-2">Performance</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${isPositive ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(Math.abs(portfolio.gainPercent) * 2, 100)}%` }}
            />
          </div>
          <span className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}{portfolio.gainPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Top Holdings</p>
        <div className="space-y-2">
          {portfolio.assets.slice(0, 3).map((asset) => (
            <div key={asset.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{asset.symbol}</span>
              <span className="text-muted-foreground">{asset.allocation}%</span>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full" variant="outline">
        View Details
      </Button>
    </Card>
  );
}

function PortfolioAllocationChart({ portfolio }: { portfolio: Portfolio }) {
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {portfolio.assets.map((asset, index) => {
            const startAngle = portfolio.assets
              .slice(0, index)
              .reduce((sum, a) => sum + (a.allocation / 100) * 360, 0);
            const endAngle = startAngle + (asset.allocation / 100) * 360;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArc = asset.allocation > 50 ? 1 : 0;

            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
              `Z`,
            ].join(" ");

            return (
              <path
                key={asset.id}
                d={pathData}
                fill={colors[index % colors.length]}
                opacity="0.8"
                className="hover:opacity-100 transition-opacity"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <PieChart className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Allocation</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {portfolio.assets.map((asset, index) => (
          <div key={asset.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm font-medium">{asset.symbol}</span>
            <span className="text-sm text-muted-foreground">{asset.allocation}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [portfolios] = useState<Portfolio[]>(mockPortfolios);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(
    portfolios[0]
  );

  const totalPortfolioValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
  const totalPortfolioGain = portfolios.reduce((sum, p) => sum + p.totalGain, 0);
  const totalPortfolioGainPercent = (totalPortfolioGain / (totalPortfolioValue - totalPortfolioGain)) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Portfolio Management</h1>
        <p className="text-muted-foreground">
          Track and manage your cryptocurrency investments
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Portfolio Value</p>
          <p className="text-2xl font-bold">
            ${totalPortfolioValue.toLocaleString()}
          </p>
        </Card>
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
          <p className="text-2xl font-bold">
            ${(totalPortfolioValue - totalPortfolioGain).toLocaleString()}
          </p>
        </Card>
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Gain</p>
          <p className={`text-2xl font-bold ${totalPortfolioGain >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${Math.abs(totalPortfolioGain).toLocaleString()}
          </p>
        </Card>
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Return %</p>
          <p className={`text-2xl font-bold ${totalPortfolioGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalPortfolioGainPercent >= 0 ? "+" : ""}{totalPortfolioGainPercent.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Portfolios Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Portfolios</h2>
          <Button gap-2>
            <Plus className="h-4 w-4" />
            New Portfolio
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              onClick={() => setSelectedPortfolio(portfolio)}
              className="cursor-pointer"
            >
              <PortfolioCard portfolio={portfolio} />
            </div>
          ))}
        </div>
      </div>

      {/* Selected Portfolio Details */}
      {selectedPortfolio && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            {selectedPortfolio.name} - Allocation
          </h2>

          <Card className="card-elevated p-8">
            <PortfolioAllocationChart portfolio={selectedPortfolio} />
          </Card>

          {/* Holdings Table */}
          <div>
            <h3 className="text-xl font-bold mb-4">Holdings</h3>
            <Card className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Asset</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Quantity</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Buy Price</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Current Price</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Gain/Loss</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPortfolio.assets.map((asset) => {
                      const totalValue = asset.quantity * asset.currentPrice;
                      const totalCost = asset.quantity * asset.buyPrice;
                      const gain = totalValue - totalCost;
                      const gainPercent = (gain / totalCost) * 100;
                      const isPositive = gain >= 0;

                      return (
                        <tr key={asset.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold">{asset.symbol}</p>
                              <p className="text-xs text-muted-foreground">{asset.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">{asset.quantity.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            ${asset.buyPrice.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ${asset.currentPrice.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {isPositive ? "+" : ""}${Math.abs(gain).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ({gainPercent >= 0 ? "+" : ""}{gainPercent.toFixed(1)}%)
                          </td>
                          <td className="px-4 py-3 text-right">{asset.allocation}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
