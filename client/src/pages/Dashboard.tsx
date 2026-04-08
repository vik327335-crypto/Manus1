import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Search, Star, Bookmark } from "lucide-react";
import { useLocation } from "wouter";
import { MarketTrendIndicator } from "@/components/MarketTrendIndicator";
import { ScoreIndicator } from "@/components/ScoreIndicator";
import { DashboardExportButton } from "@/components/DashboardExportButton";
import { PriceTicker } from "@/components/PriceTicker";
import { cn } from "@/lib/utils";

type SortBy = "total" | "c" | "a" | "n" | "s" | "l" | "i" | "m";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("total");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Fetch assets and market trend
  const { data: assets, isLoading: assetsLoading } = trpc.assets.list.useQuery();
  const { data: marketTrend, isLoading: trendLoading } = trpc.market.trend.useQuery();

  // Mock data for development
  const mockAssets = [
    {
      id: 1,
      ticker: "BTC",
      name: "Bitcoin",
      logo: "https://cdn.coinbase.com/api/v2/assets/images/bitcoin.png",
      category: "Layer1",
      currentPrice: 6250000,
      priceChange24h: 250,
      marketCap: 1200000,
      totalScore: 79,
      cScore: 72,
      aScore: 65,
      nScore: 58,
      sScore: 85,
      lScore: 88,
      iScore: 92,
      mScore: 95,
    },
    {
      id: 2,
      ticker: "ETH",
      name: "Ethereum",
      logo: "https://cdn.coinbase.com/api/v2/assets/images/ethereum.png",
      category: "Layer1",
      currentPrice: 225000,
      priceChange24h: 350,
      marketCap: 450000,
      totalScore: 81,
      cScore: 78,
      aScore: 72,
      nScore: 85,
      sScore: 68,
      lScore: 82,
      iScore: 88,
      mScore: 92,
    },
    {
      id: 3,
      ticker: "SOL",
      name: "Solana",
      logo: "https://cdn.coinbase.com/api/v2/assets/images/solana.png",
      category: "Layer1",
      currentPrice: 15000,
      priceChange24h: 450,
      marketCap: 85000,
      totalScore: 86,
      cScore: 88,
      aScore: 82,
      nScore: 92,
      sScore: 75,
      lScore: 95,
      iScore: 78,
      mScore: 90,
    },
    {
      id: 4,
      ticker: "ARB",
      name: "Arbitrum",
      logo: "https://cdn.coinbase.com/api/v2/assets/images/arbitrum.png",
      category: "Layer2",
      currentPrice: 1200,
      priceChange24h: 520,
      marketCap: 12000,
      totalScore: 82,
      cScore: 82,
      aScore: 75,
      nScore: 88,
      sScore: 72,
      lScore: 85,
      iScore: 82,
      mScore: 88,
    },
    {
      id: 5,
      ticker: "AAVE",
      name: "Aave",
      logo: "https://cdn.coinbase.com/api/v2/assets/images/aave.png",
      category: "DeFi",
      currentPrice: 45000,
      priceChange24h: 380,
      marketCap: 18000,
      totalScore: 75,
      cScore: 76,
      aScore: 70,
      nScore: 72,
      sScore: 68,
      lScore: 78,
      iScore: 75,
      mScore: 85,
    },
    {
      id: 6,
      ticker: "AI",
      name: "Artificial Intelligence",
      logo: "https://cdn.coinbase.com/api/v2/assets/images/ai.png",
      category: "AI",
      currentPrice: 850,
      priceChange24h: 680,
      marketCap: 8500,
      totalScore: 87,
      cScore: 95,
      aScore: 88,
      nScore: 98,
      sScore: 65,
      lScore: 92,
      iScore: 85,
      mScore: 88,
    },
  ];

  const mockMarketTrend = {
    btcPrice: 6250000,
    btc200EMA: 5800000,
    btcAbove200EMA: 1,
    dominance: 4500,
    fearGreedIndex: 72,
    status: "bullish" as const,
    createdAt: new Date(),
  };

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = mockAssets;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (asset) =>
          asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter((asset) => asset.category === filterCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "total":
          return b.totalScore - a.totalScore;
        case "c":
          return b.cScore - a.cScore;
        case "a":
          return b.aScore - a.aScore;
        case "n":
          return b.nScore - a.nScore;
        case "s":
          return b.sScore - a.sScore;
        case "l":
          return b.lScore - a.lScore;
        case "i":
          return b.iScore - a.iScore;
        case "m":
          return b.mScore - a.mScore;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, filterCategory, sortBy]);

  const categories = ["all", ...Array.from(new Set(mockAssets.map((a) => a.category)))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gradient">CAN SLIM Crypto Scanner</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Evaluate cryptocurrencies using William O'Neil's proven methodology
              </p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/watchlist")}
              className="gap-2 mt-4"
            >
              <Bookmark className="h-4 w-4" />
              My Watchlist
            </Button>
          )}
        </div>
      </div>

      <div className="container py-8">
        {/* Live Price Ticker */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Live Price Ticker</h2>
          <PriceTicker tickers={["BTC", "ETH", "ADA"]} />
        </div>

        {/* Market Trend Section */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Market Overview</h2>
          {trendLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <MarketTrendIndicator
              status={mockMarketTrend.status as "bullish" | "neutral" | "bearish"}
              btcPrice={mockMarketTrend.btcPrice}
              btc200EMA={mockMarketTrend.btc200EMA}
              dominance={mockMarketTrend.dominance}
              fearGreedIndex={mockMarketTrend.fearGreedIndex}
            />
          )}
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ticker or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Total Score</SelectItem>
                <SelectItem value="c">Current Growth (C)</SelectItem>
                <SelectItem value="a">Annual Growth (A)</SelectItem>
                <SelectItem value="n">New Catalysts (N)</SelectItem>
                <SelectItem value="s">Supply (S)</SelectItem>
                <SelectItem value="l">Relative Strength (L)</SelectItem>
                <SelectItem value="i">Institutional (I)</SelectItem>
                <SelectItem value="m">Market Trend (M)</SelectItem>
              </SelectContent>
            </Select>

            <DashboardExportButton
              assets={filteredAssets.map((asset) => ({
                ticker: asset.ticker,
                name: asset.name,
                price: asset.currentPrice,
                change24h: asset.priceChange24h,
                score: asset.totalScore,
                allocation: 100 / filteredAssets.length,
              }))}
              totalValue={filteredAssets.reduce((sum: number, a: any) => sum + a.marketCap, 0)}
            />
          </div>
        </div>

        {/* Assets Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Top Cryptocurrencies</h2>

          {assetsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssets.map((asset) => (
                <Card
                key={asset.id}
                className="card-elevated p-4 cursor-pointer transition-all hover:shadow-lg"
                onClick={() => navigate(`/asset/${asset.ticker}`)}
              >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Asset Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={asset.logo}
                        alt={asset.name}
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{asset.ticker}</h3>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                            {asset.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>

                    {/* Price Info */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">${(asset.currentPrice / 100).toFixed(2)}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">24h Change</p>
                        <p
                          className={cn(
                            "font-semibold",
                            asset.priceChange24h > 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {asset.priceChange24h > 0 ? "+" : ""}
                          {(asset.priceChange24h / 100).toFixed(2)}%
                        </p>
                      </div>

                      {/* CAN SLIM Scores */}
                      <div className="hidden lg:flex gap-2">
                        <ScoreIndicator score={asset.cScore} label="C" size="sm" />
                        <ScoreIndicator score={asset.aScore} label="A" size="sm" />
                        <ScoreIndicator score={asset.nScore} label="N" size="sm" />
                        <ScoreIndicator score={asset.sScore} label="S" size="sm" />
                        <ScoreIndicator score={asset.lScore} label="L" size="sm" />
                        <ScoreIndicator score={asset.iScore} label="I" size="sm" />
                        <ScoreIndicator score={asset.mScore} label="M" size="sm" />
                      </div>

                      {/* Total Score */}
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Score</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{asset.totalScore}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {filteredAssets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No assets found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
