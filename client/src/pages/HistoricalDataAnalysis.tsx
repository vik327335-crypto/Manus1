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
import { Loader2, Search, TrendingUp, TrendingDown, Download, BarChart3, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { HistoricalDataChart, type ChartDataPoint } from '@/components/HistoricalDataChart';
import { PriceActionAnalysis, type PricePoint } from '@/components/PriceActionAnalysis';
import { PeriodComparison, type PeriodMetrics } from '@/components/PeriodComparison';
import { exportPriceActionPDF, exportComparisonPDF, exportAsJSON, exportAsCSV } from '@/lib/priceActionPDFExport';
import { fetchOHLCVData, generateFallbackOHLCV, isValidTicker } from '@/lib/polygonClient';
import { toast } from 'sonner';

export default function HistoricalDataAnalysis() {
  const [ticker, setTicker] = useState('BTC');
  const [years, setYears] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [showPriceAction, setShowPriceAction] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPeriods, setComparisonPeriods] = useState<PeriodMetrics[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [dataSource, setDataSource] = useState<'real' | 'fallback'>('real');

  // tRPC queries
  const getTechnicalIndicatorsQuery = trpc.historicalData.getTechnicalIndicators.useQuery(
    { ticker, years },
    { enabled: false }
  );

  const getMultiYearQuery = trpc.historicalData.getMultiYear.useQuery(
    { ticker, years },
    { enabled: false }
  );

  const handleSearch = async () => {
    if (!ticker.trim()) {
      toast.error('Please enter a ticker');
      return;
    }

    if (!isValidTicker(ticker)) {
      toast.error('Invalid ticker format');
      return;
    }

    setIsSearching(true);
    try {
      // Try to fetch real OHLCV data from Polygon.io
      let mockOHLCVData: PricePoint[] = [];
      let useRealData = false;

      try {
        const result = await fetchOHLCVData(ticker, years);
        if (result.success && result.data) {
          mockOHLCVData = result.data;
          useRealData = true;
          setDataSource('real');
          toast.success(`Loaded ${mockOHLCVData.length} real data points from Polygon.io`);
        } else {
          throw new Error(result.error || 'Failed to fetch real data');
        }
      } catch (apiError) {
        console.warn('Real API failed, using fallback data:', apiError);
        mockOHLCVData = generateFallbackOHLCV(ticker, years);
        setDataSource('fallback');
        toast.info(`Using demo data (${mockOHLCVData.length} points)`);
      }

      setPriceData(mockOHLCVData);

      // Fetch technical indicators
      const indicatorsResult = await getTechnicalIndicatorsQuery.refetch();

      if (indicatorsResult.data?.success && indicatorsResult.data?.indicators) {
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
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading historical data');
    } finally {
      setIsSearching(false);
    }
  };

  const handleComparison = async () => {
    if (!ticker.trim()) {
      toast.error('Please enter a ticker');
      return;
    }

    setIsSearching(true);
    try {
      const periods: PeriodMetrics[] = [];

      // Fetch data for 1Y, 2Y, 3Y
      for (const period of [1, 2, 3]) {
        let data: PricePoint[] = [];

        // Try real API first
        try {
          const result = await fetchOHLCVData(ticker, period);
          if (result.success && result.data) {
            data = result.data;
          } else {
            throw new Error('Real API failed');
          }
        } catch {
          // Fallback to generated data
          data = generateFallbackOHLCV(ticker, period);
        }

        if (data.length > 0) {
          const startPrice = data[0].close;
          const endPrice = data[data.length - 1].close;
          const change = endPrice - startPrice;
          const changePercent = (change / startPrice) * 100;
          const high = Math.max(...data.map(d => d.high));
          const low = Math.min(...data.map(d => d.low));
          const volatility = ((high - low) / low) * 100;
          const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;

          // Determine trend
          const ma20 = data.length >= 20
            ? data.slice(-20).reduce((sum, p) => sum + p.close, 0) / 20
            : data.reduce((sum, p) => sum + p.close, 0) / data.length;

          const ma50 = data.length >= 50
            ? data.slice(-50).reduce((sum, p) => sum + p.close, 0) / 50
            : ma20;

          let trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways';
          let trendStrength = 0;

          if (endPrice > ma20 && ma20 > ma50) {
            trend = 'uptrend';
            trendStrength = Math.min(100, Math.abs(changePercent) * 2);
          } else if (endPrice < ma20 && ma20 < ma50) {
            trend = 'downtrend';
            trendStrength = Math.min(100, Math.abs(changePercent) * 2);
          } else {
            trend = 'sideways';
            trendStrength = Math.max(0, 50 - Math.abs(changePercent) * 2);
          }

          periods.push({
            period: `${period}Y`,
            startPrice,
            endPrice,
            change,
            changePercent,
            high,
            low,
            volatility,
            avgVolume,
            trend,
            trendStrength,
          });
        }
      }

      setComparisonPeriods(periods);
      setShowComparison(true);
      toast.success('Comparison data loaded');
    } catch (error) {
      console.error('Error loading comparison:', error);
      toast.error('Error loading comparison data');
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const elementId = showComparison ? 'comparison-container' : 'price-action-container';
      const element = document.getElementById(elementId);

      if (!element) {
        toast.error('No content to export');
        return;
      }

      if (showComparison) {
        await exportComparisonPDF(elementId, ticker, comparisonPeriods.map(p => p.period));
      } else {
        await exportPriceActionPDF(elementId, {
          title: 'Price Action Analysis',
          ticker,
          period: `${years}Y`,
          includeCharts: true,
          includeMetrics: true,
        });
      }

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error exporting PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    try {
      const data = {
        ticker,
        period: `${years}Y`,
        dataSource,
        timestamp: new Date().toISOString(),
        priceData,
        comparisonPeriods: showComparison ? comparisonPeriods : undefined,
      };

      exportAsJSON(data, `${ticker}-analysis-${new Date().getTime()}.json`);
      toast.success('JSON exported successfully');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      toast.error('Error exporting JSON');
    }
  };

  const handleExportCSV = () => {
    try {
      if (showComparison && comparisonPeriods.length > 0) {
        // Export comparison data
        const csvData = comparisonPeriods.map((p) => ({
          Period: p.period,
          'Start Price': p.startPrice.toFixed(2),
          'End Price': p.endPrice.toFixed(2),
          'Change': p.change.toFixed(2),
          'Change %': p.changePercent.toFixed(2),
          'High': p.high.toFixed(2),
          'Low': p.low.toFixed(2),
          'Volatility %': p.volatility.toFixed(2),
          'Avg Volume': p.avgVolume.toFixed(0),
          'Trend': p.trend,
          'Trend Strength': p.trendStrength.toFixed(0),
        }));

        exportAsCSV(csvData, `${ticker}-comparison-${new Date().getTime()}.csv`);
      } else if (priceData.length > 0) {
        // Export single-period OHLCV data
        const csvData = priceData.map((p) => ({
          Date: p.date,
          Open: p.open.toFixed(2),
          High: p.high.toFixed(2),
          Low: p.low.toFixed(2),
          Close: p.close.toFixed(2),
          Volume: p.volume.toFixed(0),
        }));

        exportAsCSV(csvData, `${ticker}-ohlcv-${new Date().getTime()}.csv`);
      } else {
        toast.error('No data to export');
      }

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Error exporting CSV');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Calculate statistics
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
            Analyze historical price data with technical indicators, price action, and period comparison
          </p>
        </div>

        {/* Search Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Selection</CardTitle>
            <CardDescription>Choose ticker and time period for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

              <Button
                onClick={handleComparison}
                disabled={isSearching}
                variant="outline"
                className="mt-6"
                title="Compare 1Y, 2Y, 3Y periods"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Compare
              </Button>

              <Button
                onClick={handleExportPDF}
                disabled={isExporting || (chartData.length === 0 && comparisonPeriods.length === 0)}
                variant="outline"
                className="mt-6"
                title="Export as PDF"
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>

              <Button
                onClick={handleExportJSON}
                disabled={chartData.length === 0 && comparisonPeriods.length === 0}
                variant="outline"
                className="mt-6"
                title="Export as JSON"
              >
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>

              <Button
                onClick={handleExportCSV}
                disabled={chartData.length === 0 && comparisonPeriods.length === 0}
                variant="outline"
                className="mt-6"
                title="Export as CSV"
              >
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>

            {/* Data Source Badge */}
            {chartData.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Data Source:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  dataSource === 'real'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {dataSource === 'real' ? '🔗 Real Polygon.io Data' : '📊 Demo Data'}
                </span>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Data Points</p>
                  <p className="text-lg font-bold">{stats.dataPoints}</p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Change</p>
                  <p className={`text-lg font-bold ${stats.endPrice >= stats.startPrice ? 'text-green-600' : 'text-red-600'}`}>
                    {((stats.endPrice - stats.startPrice) / stats.startPrice * 100).toFixed(2)}%
                  </p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">High</p>
                  <p className="text-lg font-bold">${stats.highPrice.toFixed(2)}</p>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Low</p>
                  <p className="text-lg font-bold">${stats.lowPrice.toFixed(2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison View */}
        {showComparison && comparisonPeriods.length > 0 && (
          <div id="comparison-container" className="mb-6">
            <PeriodComparison periods={comparisonPeriods} ticker={ticker} />
          </div>
        )}

        {/* Chart */}
        {!showComparison && chartData.length > 0 && (
          <HistoricalDataChart
            data={chartData}
            ticker={ticker}
            isLoading={isSearching}
          />
        )}

        {/* Price Action Analysis */}
        {!showComparison && priceData.length > 0 && showPriceAction && (
          <div id="price-action-container" className="mt-8">
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

        {!showComparison && !showPriceAction && priceData.length > 0 && (
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={() => setShowPriceAction(true)}
            >
              Show Price Action Analysis
            </Button>
          </div>
        )}

        {/* Empty State */}
        {chartData.length === 0 && comparisonPeriods.length === 0 && (
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

        {/* Information */}
        {chartData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Available analysis tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">📊 Technical Indicators</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• SMA 20, 50, 200</li>
                    <li>• EMA 12, 26</li>
                    <li>• MACD, RSI, Bollinger Bands</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📈 Price Action</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Trend analysis</li>
                    <li>• Support/Resistance levels</li>
                    <li>• Volatility metrics (ATR)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📋 Export Options</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• PDF reports with charts</li>
                    <li>• JSON data export</li>
                    <li>• CSV for spreadsheets</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
