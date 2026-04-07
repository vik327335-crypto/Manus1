import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Filter, TrendingUp, TrendingDown, Plus, Loader2, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScanResult {
  id: number;
  ticker: string;
  name: string;
  logo: string;
  currentPrice: number;
  priceChange24h: number;
  totalScore: number;
  cScore: number;
  aScore: number;
  nScore: number;
  sScore: number;
  lScore: number;
  iScore: number;
  mScore: number;
  marketCap: number;
  volume24h: number;
}

const mockResults: ScanResult[] = [
  {
    id: 1,
    ticker: "SOL",
    name: "Solana",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/solana.png",
    currentPrice: 15000,
    priceChange24h: 450,
    totalScore: 86,
    cScore: 85,
    aScore: 88,
    nScore: 82,
    sScore: 87,
    lScore: 89,
    iScore: 84,
    mScore: 86,
    marketCap: 75000000000,
    volume24h: 5000000000,
  },
  {
    id: 2,
    ticker: "ETH",
    name: "Ethereum",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/ethereum.png",
    currentPrice: 3500,
    priceChange24h: 250,
    totalScore: 84,
    cScore: 83,
    aScore: 85,
    nScore: 81,
    sScore: 85,
    lScore: 87,
    iScore: 82,
    mScore: 84,
    marketCap: 420000000000,
    volume24h: 25000000000,
  },
  {
    id: 3,
    ticker: "ARB",
    name: "Arbitrum",
    logo: "https://cdn.coinbase.com/api/v2/assets/images/arbitrum.png",
    currentPrice: 1200,
    priceChange24h: 520,
    totalScore: 82,
    cScore: 81,
    aScore: 83,
    nScore: 80,
    sScore: 83,
    lScore: 85,
    iScore: 80,
    mScore: 82,
    marketCap: 12000000000,
    volume24h: 800000000,
  },
];

export default function Scanner() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState("70");
  const [sortBy, setSortBy] = useState<"score" | "price" | "change">("score");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScanResult[]>(mockResults);
  const [addedToWatchlist, setAddedToWatchlist] = useState<Set<number>>(new Set());

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please sign in to use the scanner</p>
          </div>
        </div>
      </div>
    );
  }

  // Validate and parse minScore
  const parsedMinScore = useMemo(() => {
    const parsed = parseInt(minScore, 10);
    if (isNaN(parsed)) return 70;
    if (parsed < 0) return 0;
    if (parsed > 100) return 100;
    return parsed;
  }, [minScore]);

  const filteredResults = useMemo(() => {
    return results
      .filter(
        (item) =>
          (item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
          item.totalScore >= parsedMinScore
      )
      .sort((a, b) => {
        if (sortBy === "score") return b.totalScore - a.totalScore;
        if (sortBy === "price") return b.currentPrice - a.currentPrice;
        if (sortBy === "change") return b.priceChange24h - a.priceChange24h;
        return 0;
      });
  }, [results, searchTerm, parsedMinScore, sortBy]);

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-border bg-white dark:bg-card">
        <div className="container px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")} 
            className="mb-6 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">CAN SLIM Scanner</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Discover high-potential cryptocurrencies using the CAN SLIM methodology
            </p>
          </div>
        </div>
      </div>

      <div className="container px-4 py-10">
        {/* Filters Section */}
        <div className="grid gap-6 md:grid-cols-4 mb-10">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Search Assets
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by ticker or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className="pl-10 border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Min Score Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Minimum Score
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                disabled={isLoading}
                className="border-slate-300 dark:border-slate-700 rounded-lg"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">/100</span>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              disabled={isLoading}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 disabled:opacity-50"
            >
              <option value="score">CAN SLIM Score</option>
              <option value="price">Price</option>
              <option value="change">24h Change</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900 dark:text-red-200">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Found <span className="font-bold text-slate-900 dark:text-white">{filteredResults.length}</span> assets
              {parsedMinScore > 70 && <span className="ml-2 text-slate-500">• Min score: {parsedMinScore}</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setMinScore("70");
                setSortBy("score");
                setError(null);
              }}
              disabled={isLoading}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Reset Filters
            </Button>
            <Button 
              onClick={async () => {
                setIsLoading(true);
                setError(null);
                try {
                  await new Promise((resolve) => setTimeout(resolve, 1500));
                  toast.success("✅ Scan completed", {
                    description: `Found ${results.length} assets matching criteria`,
                    duration: 3000,
                  });
                } catch (err) {
                  setError("Failed to run scan. Please try again.");
                  toast.error("❌ Scan failed", {
                    description: "Unable to fetch scanner results",
                    duration: 3000,
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Run Scan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block">
              <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
              <p className="text-lg font-medium text-slate-900 dark:text-white">Scanning assets...</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && filteredResults.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((result) => (
              <Card
                key={result.id}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-xl hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/watchlist`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={result.logo}
                      alt={result.name}
                      className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect fill='%23e2e8f0' width='24' height='24'/%3E%3C/svg%3E";
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{result.ticker}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{result.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{result.totalScore}</p>
                    </div>
                  </div>
                </div>

                {/* Price Info */}
                <div className="space-y-2 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Price</span>
                    <span className="font-bold text-slate-900 dark:text-white">${(result.currentPrice / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400">24h Change</span>
                    <div className="flex items-center gap-1">
                      {result.priceChange24h > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={cn(
                          "font-bold text-sm",
                          result.priceChange24h > 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {result.priceChange24h > 0 ? "+" : ""}
                        {(result.priceChange24h / 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* CAN SLIM Scores */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {[
                    { label: "C", score: result.cScore },
                    { label: "A", score: result.aScore },
                    { label: "N", score: result.nScore },
                    { label: "S", score: result.sScore },
                    { label: "L", score: result.lScore },
                    { label: "I", score: result.iScore },
                    { label: "M", score: result.mScore },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg font-bold text-xs",
                        item.score >= 80
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : item.score >= 70
                            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                      )}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs">{item.score}</span>
                    </div>
                  ))}
                </div>

                {/* Market Info */}
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Market Cap</span>
                    <span className="font-medium text-slate-900 dark:text-white">${(result.marketCap / 1000000000).toFixed(1)}B</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24h Volume</span>
                    <span className="font-medium text-slate-900 dark:text-white">${(result.volume24h / 1000000000).toFixed(1)}B</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className={cn(
                    "w-full font-medium transition-all",
                    addedToWatchlist.has(result.id)
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                  onClick={() => {
                    setAddedToWatchlist((prev) => new Set(prev).add(result.id));
                    toast.success(`✅ ${result.ticker} added to watchlist`, {
                      description: `Score: ${result.totalScore}/100`,
                      duration: 3000,
                    });
                    setTimeout(() => {
                      setAddedToWatchlist((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(result.id);
                        return newSet;
                      });
                    }, 2000);
                  }}
                  disabled={addedToWatchlist.has(result.id)}
                >
                  {addedToWatchlist.has(result.id) ? (
                    <>✅ Added</>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Watchlist
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        ) : !isLoading && filteredResults.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">No assets match your criteria</p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setMinScore("70");
                setSortBy("score");
                setError(null);
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
