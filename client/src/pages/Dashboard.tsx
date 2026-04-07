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
import { Loader2, Search, Star, Bookmark, TrendingUp, TrendingDown } from "lucide-react";
import { useLocation } from "wouter";
import { MarketTrendIndicator } from "@/components/MarketTrendIndicator";
import { ScoreIndicator } from "@/components/ScoreIndicator";
import { DashboardExportButton } from "@/components/DashboardExportButton";
import { PriceTicker } from "@/components/PriceTicker";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { Tooltip } from "@/components/Tooltip";
import { ErrorMessage } from "@/components/ErrorMessage";

type SortBy = "total" | "c" | "a" | "n" | "s" | "l" | "i" | "m";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("total");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

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
      ticker: "ADA",
      name: "Cardano",
      logo: "https://cdn.coinbase.com/api/v2/assets/images/cardano.png",
      category: "Layer1",
      currentPrice: 8500,
      priceChange24h: 180,
      marketCap: 32000,
      totalScore: 74,
      cScore: 68,
      aScore: 72,
      nScore: 75,
      sScore: 78,
      lScore: 72,
      iScore: 70,
      mScore: 80,
    },
    {
      id: 5,
      ticker: "XRP",
      name: "Ripple",
      logo: "https://cdn.coinbase.com/api/v2/assets/images/ripple.png",
      category: "Payment",
      currentPrice: 5200,
      priceChange24h: 320,
      marketCap: 28000,
      totalScore: 72,
      cScore: 70,
      aScore: 68,
      nScore: 72,
      sScore: 75,
      lScore: 70,
      iScore: 68,
      mScore: 78,
    },
  ];

  const mockMarketTrend = {
    status: "bullish",
    btcPrice: 6250000,
    btc200EMA: 5950000,
    dominance: 45.2,
    fearGreedIndex: 68,
  };

  const filteredAssets = useMemo(() => {
    let filtered = mockAssets;

    if (searchTerm) {
      filtered = filtered.filter(
        (asset) =>
          asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((asset) => asset.category === filterCategory);
    }

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
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CAN SLIM Crypto Scanner
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg">
                Evaluate cryptocurrencies using William O'Neil's proven methodology. Discover high-potential digital assets with AI-powered analysis.
              </p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            )}
          </div>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/watchlist")}
              className="gap-2 mt-4 w-full sm:w-auto"
            >
              <Bookmark className="h-4 w-4" />
              My Watchlist
            </Button>
          )}
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Live Price Ticker */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Live Price Ticker</h2>
          </div>
          <PriceTicker tickers={["BTC", "ETH", "ADA"]} />
        </section>

        {/* Market Trend Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Market Overview</h2>
          {trendLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
        </section>

        {/* Filters and Search */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ticker or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-10">
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
                <SelectTrigger className="h-10">
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
        </section>

        {/* Assets Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Top Cryptocurrencies</h2>
            <span className="text-sm text-muted-foreground">{filteredAssets.length} assets</span>
          </div>

          {assetsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <EmptyState
              icon="search"
              title="No assets found"
              description="Try adjusting your search or filter criteria"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group"
                  onClick={() => navigate(`/asset/${asset.ticker}`)}
                >
                  <div className="space-y-4">
                    {/* Top Row - Asset Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={asset.logo}
                          alt={asset.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg">{asset.ticker}</h3>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                              {asset.category}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{asset.name}</p>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground font-medium">Score</p>
                            <p className="text-3xl font-bold text-primary">{asset.totalScore}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 group-hover:bg-primary/10"
                          >
                            <Star className="h-5 w-5 text-amber-500" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row - Price Info */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Price</p>
                        <p className="text-lg font-semibold">${(asset.currentPrice / 100).toFixed(2)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">24h Change</p>
                        <div className="flex items-center gap-1">
                          {asset.priceChange24h > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <p
                            className={cn(
                              "text-lg font-semibold",
                              asset.priceChange24h > 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {asset.priceChange24h > 0 ? "+" : ""}
                            {(asset.priceChange24h / 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Market Cap</p>
                        <p className="text-lg font-semibold">${(asset.marketCap / 1000).toFixed(0)}B</p>
                      </div>
                    </div>

                    {/* Bottom Row - CAN SLIM Scores */}
                    <div className="grid grid-cols-7 gap-2">
                      <Tooltip content="Current Growth">
                        <ScoreIndicator score={asset.cScore} label="C" size="sm" />
                      </Tooltip>
                      <Tooltip content="Annual Growth">
                        <ScoreIndicator score={asset.aScore} label="A" size="sm" />
                      </Tooltip>
                      <Tooltip content="New Catalysts">
                        <ScoreIndicator score={asset.nScore} label="N" size="sm" />
                      </Tooltip>
                      <Tooltip content="Supply Dynamics">
                        <ScoreIndicator score={asset.sScore} label="S" size="sm" />
                      </Tooltip>
                      <Tooltip content="Relative Strength">
                        <ScoreIndicator score={asset.lScore} label="L" size="sm" />
                      </Tooltip>
                      <Tooltip content="Institutional Support">
                        <ScoreIndicator score={asset.iScore} label="I" size="sm" />
                      </Tooltip>
                      <Tooltip content="Market Trend">
                        <ScoreIndicator score={asset.mScore} label="M" size="sm" />
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
