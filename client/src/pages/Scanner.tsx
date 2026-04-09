import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdvancedFilters, FilterCriteria } from "@/components/AdvancedFilters";
import { Search, Plus } from "lucide-react";

interface ScannerResult {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  canSlimScore: number;
  currentGrowth: number;
  annualGrowth: number;
  newCatalysts: boolean;
  supplyDynamics: number;
  relativeStrength: number;
  institutionalSupport: number;
  marketTrend: string;
}

// Mock scanner results
const mockResults: ScannerResult[] = [
  {
    id: "1",
    symbol: "BTC",
    name: "Bitcoin",
    price: 45230,
    change24h: 2.50,
    marketCap: 890,
    volume24h: 28.50,
    canSlimScore: 78,
    currentGrowth: 8.5,
    annualGrowth: 45.2,
    newCatalysts: true,
    supplyDynamics: 7.5,
    relativeStrength: 8.2,
    institutionalSupport: 8.8,
    marketTrend: "Bullish",
  },
  {
    id: "2",
    symbol: "ETH",
    name: "Ethereum",
    price: 2850,
    change24h: -1.20,
    marketCap: 342,
    volume24h: 15.20,
    canSlimScore: 72,
    currentGrowth: 6.2,
    annualGrowth: 38.5,
    newCatalysts: false,
    supplyDynamics: 7.0,
    relativeStrength: 7.5,
    institutionalSupport: 8.2,
    marketTrend: "Neutral",
  },
  {
    id: "3",
    symbol: "SOL",
    name: "Solana",
    price: 145.50,
    change24h: 5.75,
    marketCap: 68.50,
    volume24h: 2.10,
    canSlimScore: 85,
    currentGrowth: 12.3,
    annualGrowth: 62.1,
    newCatalysts: true,
    supplyDynamics: 8.5,
    relativeStrength: 8.9,
    institutionalSupport: 7.8,
    marketTrend: "Bullish",
  },
  {
    id: "4",
    symbol: "ADA",
    name: "Cardano",
    price: 0.98,
    change24h: 1.30,
    marketCap: 35.20,
    volume24h: 0.85,
    canSlimScore: 65,
    currentGrowth: 4.1,
    annualGrowth: 28.3,
    newCatalysts: false,
    supplyDynamics: 6.5,
    relativeStrength: 6.8,
    institutionalSupport: 7.2,
    marketTrend: "Neutral",
  },
];

function ScannerResultCard({ result, onAddToWatchlist }: { result: ScannerResult; onAddToWatchlist: (symbol: string) => void }) {
  const isPositive = result.change24h >= 0;
  const scoreColor = result.canSlimScore >= 80 ? "text-green-600" : result.canSlimScore >= 70 ? "text-blue-600" : "text-orange-600";

  return (
    <Card className="card-elevated p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-lg">{result.symbol}</p>
          <p className="text-xs text-muted-foreground">{result.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-center px-3 py-1 rounded font-semibold ${scoreColor}`}>
            {result.canSlimScore}
          </div>
          <div
            className={`text-xs font-semibold px-2 py-1 rounded ${
              isPositive ? "badge-success" : "badge-error"
            }`}
          >
            {isPositive ? "↑" : "↓"} {Math.abs(result.change24h).toFixed(2)}%
          </div>
        </div>
      </div>

      <p className="text-lg font-bold mb-3">
        ${result.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Market Cap</span>
          <span className="font-medium">${result.marketCap.toFixed(2)}B</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">24h Volume</span>
          <span className="font-medium">${result.volume24h.toFixed(2)}B</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Growth</span>
          <span className="font-medium">{result.currentGrowth.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Annual Growth</span>
          <span className="font-medium">{result.annualGrowth.toFixed(1)}%</span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onAddToWatchlist(result.symbol)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add to Watchlist
        </Button>
        <Button size="sm" variant="ghost" className="flex-1">
          View Details
        </Button>
      </div>
    </Card>
  );
}

export default function Scanner() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterCriteria | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScannerResult[]>(mockResults);
  const [addedToWatchlist, setAddedToWatchlist] = useState<Set<string>>(new Set());

  const handleApplyFilters = useCallback((appliedFilters: FilterCriteria) => {
    setIsScanning(true);
    setFilters(appliedFilters);

    // Simulate filtering
    setTimeout(() => {
      let filtered = mockResults;

      if (appliedFilters.priceMin !== null) {
        filtered = filtered.filter((r) => r.price >= appliedFilters.priceMin!);
      }
      if (appliedFilters.priceMax !== null) {
        filtered = filtered.filter((r) => r.price <= appliedFilters.priceMax!);
      }
      if (appliedFilters.marketCapMin !== null) {
        filtered = filtered.filter((r) => r.marketCap >= appliedFilters.marketCapMin!);
      }
      if (appliedFilters.marketCapMax !== null) {
        filtered = filtered.filter((r) => r.marketCap <= appliedFilters.marketCapMax!);
      }
      if (appliedFilters.volumeMin !== null) {
        filtered = filtered.filter((r) => r.volume24h >= appliedFilters.volumeMin!);
      }
      if (appliedFilters.volumeMax !== null) {
        filtered = filtered.filter((r) => r.volume24h <= appliedFilters.volumeMax!);
      }
      if (appliedFilters.changeMin !== null) {
        filtered = filtered.filter((r) => r.change24h >= appliedFilters.changeMin!);
      }
      if (appliedFilters.changeMax !== null) {
        filtered = filtered.filter((r) => r.change24h <= appliedFilters.changeMax!);
      }
      if (appliedFilters.canSlimScoreMin !== null) {
        filtered = filtered.filter((r) => r.canSlimScore >= appliedFilters.canSlimScoreMin!);
      }

      setResults(filtered);
      setIsScanning(false);
      console.log(`Scan complete: Found ${filtered.length} matching cryptocurrencies`);
    }, 1000);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(null);
    setResults(mockResults);
    setIsScanning(false);
    console.log("Filters reset");
  }, []);

  const handleAddToWatchlist = useCallback((symbol: string) => {
    setAddedToWatchlist((prev) => {
      const updated = new Set(prev);
      if (updated.has(symbol)) {
        updated.delete(symbol);
      } else {
        updated.add(symbol);
      }
      return updated;
    });

    const isAdded = !addedToWatchlist.has(symbol);
    console.log(`${symbol} ${isAdded ? "added to" : "removed from"} watchlist`);
  }, [addedToWatchlist]);

  const filteredBySearch = results.filter(
    (r) =>
      r.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">CAN SLIM Scanner</h1>
        <p className="text-muted-foreground">
          Find cryptocurrencies that match your investment criteria using advanced filtering
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by symbol or name (e.g., BTC, Bitcoin)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        isLoading={isScanning}
      />

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            Results ({filteredBySearch.length})
          </h2>
          {filters && (
            <div className="text-sm text-muted-foreground">
              Filters applied
            </div>
          )}
        </div>

        {filteredBySearch.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBySearch.map((result) => (
              <ScannerResultCard
                key={result.id}
                result={result}
                onAddToWatchlist={handleAddToWatchlist}
              />
            ))}
          </div>
        ) : (
          <Card className="card-elevated p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No cryptocurrencies found matching your criteria
            </p>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
