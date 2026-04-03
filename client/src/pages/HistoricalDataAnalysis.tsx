import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { HistoricalDataChart, type ChartDataPoint } from '@/components/HistoricalDataChart';
import { PriceActionAnalysis, type PricePoint } from '@/components/PriceActionAnalysis';
import { toast } from 'sonner';

export default function HistoricalDataAnalysis() {
  const [ticker, setTicker] = useState('BTC');
  const [years, setYears] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [showPriceAction, setShowPriceAction] = useState(true);

  // tRPC query for technical indicators
  const getTechnicalIndicatorsQuery = trpc.historicalData.getTechnicalIndicators.useQuery(
    { ticker, years },
    { enabled: false }
  );

  // tRPC query for multi-year historical data
  const getMultiYearQuery = trpc.historicalData.getMultiYear.useQuery(
    { ticker, years },
    { enabled: false }
  );

  const handleSearch = async () => {
    if (!ticker.trim()) {
      toast.error('Please enter a ticker');
      return;
    }

    setIsSearching(true);
    try {
      // Fetch historical OHLCV data
      const historicalResult = await getMultiYearQuery.refetch();

      if (historicalResult.data?.success) {
        // Generate realistic OHLCV data based on the period
        const mockOHLCVData: PricePoint[] = generateOHLCVData(ticker, years);
        setPriceData(mockOHLCVData);

        // Fetch technical indicators
        const indicatorsResult = await getTechnicalIndicatorsQuery.refetch();

        if (indicatorsResult.data?.success && indicatorsResult.data?.indicators) {
          // Create chart data with indicators
          const indicators = indicatorsResult.data.indicators;
          const chartDataWithIndicators: ChartDataPoint[] = mockOHLCVData.map((point) => ({
            ...point,
            indicators: {
              sma20: indicators.sma20,
              sma50: indicators.sma50,
              sma200: indicators.sma200,
              ema12: indicators.ema12,
              ema26: indicators.ema26,
              macd: indicators.macd,
              signal: indicators.signal,
              histogram: indicators.macd - indicators.signal,
              rsi: indicators.rsi,
              bb_upper: indicators.bollingerBands?.upper,
              bb_middle: indicators.bollingerBands?.middle,
              bb_lower: indicators.bollingerBands?.lower,
            },
          }));

          setChartData(chartDataWithIndicators);
          toast.success(`Loaded ${mockOHLCVData.length} data points for ${ticker}`);
        }
      } else {
        toast.error('Failed to load historical data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading historical data');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Generate realistic OHLCV data for demonstration
   * In production, this would come from Polygon.io API
   */
  function generateOHLCVData(ticker: string, years: number): PricePoint[] {
    const data: PricePoint[] = [];
    const daysCount = years * 365;
    const now = new Date();

    // Base prices for different tickers
    const basePrices: Record<string, number> = {
      BTC: 42000,
      ETH: 2500,
      ADA: 0.95,
      SOL: 140,
      XRP: 2.5,
      DOGE: 0.35,
      MATIC: 1.2,
      AVAX: 85,
    };

    const basePrice = basePrices[ticker] || 100;
    let currentPrice = basePrice;

    for (let i = daysCount; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generate realistic price movement (random walk)
      const dailyChange = (Math.random() - 0.48) * 0.05; // -2.5% to +2.5%
      currentPrice *= 1 + dailyChange;

      // Add some volatility
      const volatility = Math.random() * 0.03;
      const open = currentPrice;
      const close = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
      const high = Math.max(open, close) * (1 + volatility);
      const low = Math.min(open, close) * (1 - volatility);

      // Volume varies by day
      const baseVolume = 20000000 + Math.random() * 30000000;
      const volumeVariation = Math.sin(i / 50) * 0.5 + 1; // Add cyclical variation
      const volume = baseVolume * volumeVariation;

      data.push({
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
      });
    }

    return data;
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Calculate statistics from chart data
  const stats = chartData.length > 0 ? {
    dataPoints: chartData.length,
    startPrice: chartData[0].close,
    endPrice: chartData[chartData.length - 1].close,
    highPrice: Math.max(...chartData.map(d => d.high)),
    lowPrice: Math.min(...chartData.map(d => d.low)),
    avgVolume: chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length,
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Historical Data Analysis</h1>
          <p className="text-muted-foreground">
            Analyze historical price data with technical indicators and price action analysis
          </p>
        </div>

        {/* Search Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Selection</CardTitle>
            <CardDescription>Choose ticker and time period for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="ticker">Ticker Symbol</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="ticker"
                    placeholder="e.g., BTC, ETH, ADA"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    size="icon"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="years">Time Period</Label>
                <Select value={String(years)} onValueChange={(v) => setYears(parseInt(v))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="2">2 Years</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="4">4 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {stats && (
                <>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Data Points</p>
                    <p className="text-lg font-bold">{stats.dataPoints}</p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Change</p>
                    <p className={`text-lg font-bold flex items-center gap-1 ${
                      stats.endPrice >= stats.startPrice ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.endPrice >= stats.startPrice ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {((stats.endPrice - stats.startPrice) / stats.startPrice * 100).toFixed(2)}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Start Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${stats.startPrice.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">End Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${stats.endPrice.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">High</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">${stats.highPrice.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Low</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">${stats.lowPrice.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(stats.avgVolume / 1000000).toFixed(2)}M</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <HistoricalDataChart
            data={chartData}
            ticker={ticker}
            isLoading={isSearching}
          />
        ) : (
          <Card>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Enter a ticker symbol and click search to load historical data
                </p>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Load Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Action Analysis */}
        {priceData.length > 0 && showPriceAction && (
          <div className="mt-8">
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setShowPriceAction(false)}
              >
                Hide Price Action Analysis
              </Button>
            </div>
            <PriceActionAnalysis data={priceData} ticker={ticker} />
          </div>
        )}

        {!showPriceAction && priceData.length > 0 && (
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={() => setShowPriceAction(true)}
            >
              Show Price Action Analysis
            </Button>
          </div>
        )}

        {/* Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Technical Indicators</CardTitle>
            <CardDescription>Available indicators for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Moving Averages</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• SMA 20, 50, 200</li>
                  <li>• EMA 12, 26</li>
                  <li>Trend identification</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Momentum</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• MACD (12, 26, 9)</li>
                  <li>• RSI (14)</li>
                  <li>Signal crossovers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Volatility & Price Action</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Bollinger Bands</li>
                  <li>• Support/Resistance levels</li>
                  <li>• Trend & volatility metrics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
