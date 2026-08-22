import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { trpc } from "@/lib/trpc";

function ScannerResultCard({
  result,
  onAddToWatchlist,
}: {
  result: any;
  onAddToWatchlist: (ticker: string) => void;
}) {
  const isPositive = (result.priceChange24h || 0) >= 0;
  const score = result.canslimScore?.totalScore || 0;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{result.ticker}</h3>
          <p className="text-sm text-gray-500">{result.name}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">${(result.currentPrice || 0) / 100}</div>
          <div
            className={`text-sm font-semibold flex items-center justify-end gap-1 ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {((result.priceChange24h || 0) / 100).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <p className="text-gray-500">Market Cap</p>
          <p className="font-semibold">${(result.marketCap || 0) / 1000}B</p>
        </div>
        <div>
          <p className="text-gray-500">24h Volume</p>
          <p className="font-semibold">${(result.volume24h || 0) / 1000}B</p>
        </div>
      </div>

      <div className="mb-3 p-2 bg-blue-50 rounded">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">CAN SLIM Score</span>
          <span className="text-lg font-bold text-blue-600">{score}/100</span>
        </div>
      </div>

      <Button
        onClick={() => onAddToWatchlist(result.ticker)}
        className="w-full"
        variant="outline"
      >
        <Plus size={16} className="mr-2" />
        Add to Watchlist
      </Button>
    </Card>
  );
}

export default function Scanner() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    minScore: 60,
    maxScore: 100,
    minMarketCap: 0,
    maxMarketCap: 1000000,
    minVolume24h: 0,
    maxVolume24h: 1000000,
    sortBy: "score",
    order: "desc",
  });

  // Fetch scan results using tRPC
  const scanQuery = trpc.scanner.scan.useQuery(filters, {
    enabled: true,
  });

  // Search query
  const searchQuery_trpc = trpc.scanner.search.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 0 }
  );

  // Display results
  const displayResults = useMemo(() => {
    if (searchQuery.length > 0 && searchQuery_trpc.data) {
      return searchQuery_trpc.data;
    }
    return scanQuery.data || [];
  }, [searchQuery, searchQuery_trpc.data, scanQuery.data]);

  const handleAddToWatchlist = (ticker: string) => {
    console.info("Added to watchlist:", ticker);
  };

  const handleResetFilters = () => {
    setFilters({
      minScore: 60,
      maxScore: 100,
      minMarketCap: 0,
      maxMarketCap: 1000000,
      minVolume24h: 0,
      maxVolume24h: 1000000,
      sortBy: "score",
      order: "desc",
    });
  };

  const isLoading = scanQuery.isLoading || searchQuery_trpc.isLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Crypto Scanner</h1>
          <p className="text-gray-600">
            Find cryptocurrencies that meet CAN SLIM criteria
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-6">
              <h2 className="font-bold mb-4">Filters</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Min CAN SLIM Score</label>
                  <Input
                    type="number"
                    value={filters.minScore}
                    onChange={(e) =>
                      setFilters({ ...filters, minScore: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Max CAN SLIM Score</label>
                  <Input
                    type="number"
                    value={filters.maxScore}
                    onChange={(e) =>
                      setFilters({ ...filters, maxScore: parseInt(e.target.value) || 100 })
                    }
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="w-full mt-4"
              >
                Reset Filters
              </Button>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <Card className="p-4 mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <Input
                    placeholder="Search by name or ticker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </Card>

            {/* Results */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin mr-2" />
                <span>Loading results...</span>
              </div>
            ) : displayResults.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No results found</p>
              </Card>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Found {displayResults.length} results
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayResults.map((result: any) => (
                    <ScannerResultCard
                      key={result.id || result.ticker}
                      result={result}
                      onAddToWatchlist={handleAddToWatchlist}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
