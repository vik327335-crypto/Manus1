import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  rsi?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
}

export interface ChartDataPoint extends OHLCVData {
  indicators?: TechnicalIndicators;
}

interface HistoricalDataChartProps {
  data: ChartDataPoint[];
  ticker: string;
  isLoading?: boolean;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

type IndicatorType = 'price' | 'sma' | 'ema' | 'macd' | 'rsi' | 'bollinger';

export function HistoricalDataChart({
  data,
  ticker,
  isLoading = false,
  onDateRangeChange,
}: HistoricalDataChartProps) {
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorType[]>(['price', 'sma']);
  const [timeframe, setTimeframe] = useState<'1d' | '1w' | '1m'>('1d');

  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      date: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [data]);

  const priceStats = useMemo(() => {
    if (data.length === 0) return null;

    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const volumes = data.map((d) => d.volume);

    const highest = Math.max(...highs);
    const lowest = Math.min(...lows);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const startPrice = data[0].close;
    const endPrice = data[data.length - 1].close;
    const change = ((endPrice - startPrice) / startPrice) * 100;

    return {
      highest,
      lowest,
      avgVolume,
      change,
      startPrice,
      endPrice,
    };
  }, [data]);

  const renderChart = () => {
    if (selectedIndicators.includes('macd') || selectedIndicators.includes('rsi')) {
      // For MACD and RSI, use separate charts
      return (
        <div className="space-y-6">
          {/* Price Chart */}
          <div>
            <h4 className="text-sm font-medium mb-2">Price Action</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" fill="#8884d8" opacity={0.3} name="Volume" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="close"
                  stroke="#2563eb"
                  name="Close Price"
                  dot={false}
                />
                {selectedIndicators.includes('sma') && (
                  <>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="indicators.sma20"
                      stroke="#f59e0b"
                      name="SMA 20"
                      dot={false}
                      strokeWidth={1}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="indicators.sma50"
                      stroke="#ef4444"
                      name="SMA 50"
                      dot={false}
                      strokeWidth={1}
                    />
                  </>
                )}
                {selectedIndicators.includes('bollinger') && (
                  <>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="indicators.bb_upper"
                      stroke="#10b981"
                      name="BB Upper"
                      dot={false}
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="indicators.bb_lower"
                      stroke="#10b981"
                      name="BB Lower"
                      dot={false}
                      strokeWidth={1}
                      strokeDasharray="5 5"
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* RSI Chart */}
          {selectedIndicators.includes('rsi') && (
            <div>
              <h4 className="text-sm font-medium mb-2">RSI (14)</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="indicators.rsi"
                    stroke="#8b5cf6"
                    name="RSI"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={() => 70}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    name="Overbought (70)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={() => 30}
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    name="Oversold (30)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* MACD Chart */}
          {selectedIndicators.includes('macd') && (
            <div>
              <h4 className="text-sm font-medium mb-2">MACD</h4>
              <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="indicators.histogram" fill="#8884d8" name="Histogram" />
                  <Line
                    type="monotone"
                    dataKey="indicators.macd"
                    stroke="#2563eb"
                    name="MACD"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="indicators.signal"
                    stroke="#ef4444"
                    name="Signal"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      );
    }

    // Default price chart with selected indicators
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />

          {/* Volume */}
          <Bar yAxisId="left" dataKey="volume" fill="#8884d8" opacity={0.3} name="Volume" />

          {/* Price */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="close"
            stroke="#2563eb"
            name="Close Price"
            strokeWidth={2}
            dot={false}
          />

          {/* SMA */}
          {selectedIndicators.includes('sma') && (
            <>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.sma20"
                stroke="#f59e0b"
                name="SMA 20"
                dot={false}
                strokeWidth={1}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.sma50"
                stroke="#ef4444"
                name="SMA 50"
                dot={false}
                strokeWidth={1}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.sma200"
                stroke="#6366f1"
                name="SMA 200"
                dot={false}
                strokeWidth={1}
              />
            </>
          )}

          {/* EMA */}
          {selectedIndicators.includes('ema') && (
            <>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.ema12"
                stroke="#06b6d4"
                name="EMA 12"
                dot={false}
                strokeWidth={1}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.ema26"
                stroke="#ec4899"
                name="EMA 26"
                dot={false}
                strokeWidth={1}
              />
            </>
          )}

          {/* Bollinger Bands */}
          {selectedIndicators.includes('bollinger') && (
            <>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.bb_upper"
                stroke="#10b981"
                name="BB Upper"
                dot={false}
                strokeWidth={1}
                strokeDasharray="5 5"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.bb_middle"
                stroke="#10b981"
                name="BB Middle"
                dot={false}
                strokeWidth={1}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="indicators.bb_lower"
                stroke="#10b981"
                name="BB Lower"
                dot={false}
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{ticker} Historical Data</CardTitle>
            <CardDescription>Technical analysis with multiple indicators</CardDescription>
          </div>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Timeframe</label>
            <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Daily</SelectItem>
                <SelectItem value="1w">Weekly</SelectItem>
                <SelectItem value="1m">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Indicators</label>
            <div className="mt-2 space-y-2">
              {(['price', 'sma', 'ema', 'bollinger', 'macd', 'rsi'] as IndicatorType[]).map(
                (indicator) => (
                  <label key={indicator} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIndicators.includes(indicator)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIndicators([...selectedIndicators, indicator]);
                        } else {
                          setSelectedIndicators(selectedIndicators.filter((i) => i !== indicator));
                        }
                      }}
                      className="rounded"
                    />
                    {indicator.toUpperCase()}
                  </label>
                )
              )}
            </div>
          </div>

          {priceStats && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Statistics</h4>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="text-muted-foreground">High:</span> ${priceStats.highest.toFixed(2)}
                </p>
                <p>
                  <span className="text-muted-foreground">Low:</span> ${priceStats.lowest.toFixed(2)}
                </p>
                <p>
                  <span className="text-muted-foreground">Change:</span>{' '}
                  <span className={priceStats.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {priceStats.change >= 0 ? '+' : ''}
                    {priceStats.change.toFixed(2)}%
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Avg Volume:</span>{' '}
                  {(priceStats.avgVolume / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          renderChart()
        ) : (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
