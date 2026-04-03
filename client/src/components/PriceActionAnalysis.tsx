import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: number; // 0-100, higher = stronger
  touches: number;
}

export interface TrendAnalysis {
  direction: 'uptrend' | 'downtrend' | 'sideways';
  strength: number; // 0-100
  startPrice: number;
  endPrice: number;
  change: number;
  duration: number; // days
}

export interface VolatilityMetrics {
  atr: number; // Average True Range
  volatility: number; // percentage
  highLowRange: number;
  avgVolume: number;
}

interface PriceActionAnalysisProps {
  data: PricePoint[];
  ticker: string;
}

/**
 * Calculate support and resistance levels using pivot points and swing analysis
 */
function calculateSupportResistance(data: PricePoint[]): SupportResistanceLevel[] {
  if (data.length < 5) return [];

  const levels: SupportResistanceLevel[] = [];
  const tolerance = 0.02; // 2% tolerance for grouping levels

  // Find local highs and lows
  const swings = [];
  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const next = data[i + 1];

    // Local high
    if (curr.high >= prev.high && curr.high >= next.high) {
      swings.push({ price: curr.high, type: 'resistance' as const });
    }

    // Local low
    if (curr.low <= prev.low && curr.low <= next.low) {
      swings.push({ price: curr.low, type: 'support' as const });
    }
  }

  // Group similar levels
  const grouped = new Map<string, SupportResistanceLevel>();

  swings.forEach((swing) => {
    let found = false;

    const entries = Array.from(grouped.entries());
    for (const [key, level] of entries) {
      const diff = Math.abs(level.price - swing.price) / level.price;
      if (diff < tolerance) {
        level.touches++;
        level.strength = Math.min(100, level.touches * 20);
        found = true;
        break;
      }
    }

    if (!found) {
      const key = `${swing.type}-${swing.price}`;
      grouped.set(key, {
        price: swing.price,
        type: swing.type,
        strength: 20,
        touches: 1,
      });
    }
  });

  return Array.from(grouped.values()).sort((a, b) => b.strength - a.strength).slice(0, 5);
}

/**
 * Analyze trend direction and strength
 */
function analyzeTrend(data: PricePoint[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      direction: 'sideways',
      strength: 0,
      startPrice: 0,
      endPrice: 0,
      change: 0,
      duration: 0,
    };
  }

  const startPrice = data[0].close;
  const endPrice = data[data.length - 1].close;
  const change = ((endPrice - startPrice) / startPrice) * 100;
  const duration = data.length;

  // Calculate moving averages
  const ma20 = data.length >= 20
    ? data.slice(-20).reduce((sum, p) => sum + p.close, 0) / 20
    : data.reduce((sum, p) => sum + p.close, 0) / data.length;

  const ma50 = data.length >= 50
    ? data.slice(-50).reduce((sum, p) => sum + p.close, 0) / 50
    : ma20;

  // Determine trend direction
  let direction: 'uptrend' | 'downtrend' | 'sideways';
  let strength = 0;

  if (endPrice > ma20 && ma20 > ma50) {
    direction = 'uptrend';
    strength = Math.min(100, Math.abs(change) * 2);
  } else if (endPrice < ma20 && ma20 < ma50) {
    direction = 'downtrend';
    strength = Math.min(100, Math.abs(change) * 2);
  } else {
    direction = 'sideways';
    strength = Math.max(0, 50 - Math.abs(change) * 2);
  }

  return {
    direction,
    strength,
    startPrice,
    endPrice,
    change,
    duration,
  };
}

/**
 * Calculate volatility metrics
 */
function calculateVolatility(data: PricePoint[]): VolatilityMetrics {
  if (data.length < 2) {
    return {
      atr: 0,
      volatility: 0,
      highLowRange: 0,
      avgVolume: 0,
    };
  }

  // Calculate ATR (Average True Range)
  const trueRanges = data.map((point, i) => {
    if (i === 0) return point.high - point.low;
    const prev = data[i - 1];
    const tr1 = point.high - point.low;
    const tr2 = Math.abs(point.high - prev.close);
    const tr3 = Math.abs(point.low - prev.close);
    return Math.max(tr1, tr2, tr3);
  });

  const atr = trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;

  // Calculate volatility (standard deviation)
  const closes = data.map((p) => p.close);
  const avgClose = closes.reduce((a, b) => a + b, 0) / closes.length;
  const variance =
    closes.reduce((sum, close) => sum + Math.pow(close - avgClose, 2), 0) / closes.length;
  const stdDev = Math.sqrt(variance);
  const volatility = (stdDev / avgClose) * 100;

  // High-Low range
  const highLowRange =
    ((Math.max(...data.map((p) => p.high)) - Math.min(...data.map((p) => p.low))) /
      Math.min(...data.map((p) => p.low))) *
    100;

  // Average volume
  const avgVolume = data.reduce((sum, p) => sum + p.volume, 0) / data.length;

  return {
    atr,
    volatility,
    highLowRange,
    avgVolume,
  };
}

export function PriceActionAnalysis({ data, ticker }: PriceActionAnalysisProps) {
  const supportResistance = useMemo(() => calculateSupportResistance(data), [data]);
  const trend = useMemo(() => analyzeTrend(data), [data]);
  const volatility = useMemo(() => calculateVolatility(data), [data]);

  // Prepare chart data with support/resistance lines
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      close: point.close,
      high: point.high,
      low: point.low,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {trend.direction === 'uptrend' ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : trend.direction === 'downtrend' ? (
              <TrendingDown className="h-5 w-5 text-red-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            Trend Analysis
          </CardTitle>
          <CardDescription>Current market direction and strength</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Direction</p>
              <p className={`text-lg font-bold capitalize ${
                trend.direction === 'uptrend'
                  ? 'text-green-600'
                  : trend.direction === 'downtrend'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}>
                {trend.direction}
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Strength</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-background rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${trend.strength}%` }}
                  />
                </div>
                <span className="text-lg font-bold">{trend.strength.toFixed(0)}%</span>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Change</p>
              <p className={`text-lg font-bold ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.change >= 0 ? '+' : ''}
                {trend.change.toFixed(2)}%
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-lg font-bold">{trend.duration} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support & Resistance */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Resistance Levels</CardTitle>
          <CardDescription>Key price levels based on swing analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {supportResistance.length > 0 ? (
            <div className="space-y-3">
              {supportResistance.map((level, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      {level.type === 'resistance' ? '📈 Resistance' : '📉 Support'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {level.touches} touch{level.touches !== 1 ? 'es' : ''} • Strength: {level.strength}%
                    </p>
                  </div>
                  <p className="text-lg font-bold">${level.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Insufficient data for analysis</p>
          )}
        </CardContent>
      </Card>

      {/* Volatility Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Volatility Metrics</CardTitle>
          <CardDescription>Price movement and volatility indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">ATR (14)</p>
              <p className="text-lg font-bold">${volatility.atr.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Average True Range</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Volatility</p>
              <p className={`text-lg font-bold ${volatility.volatility > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {volatility.volatility.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {volatility.volatility > 5 ? 'High' : 'Low'} volatility
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">High-Low Range</p>
              <p className="text-lg font-bold">{volatility.highLowRange.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Period range</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Avg Volume</p>
              <p className="text-lg font-bold">{(volatility.avgVolume / 1000000).toFixed(2)}M</p>
              <p className="text-xs text-muted-foreground mt-1">Daily average</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Chart with Support/Resistance */}
      <Card>
        <CardHeader>
          <CardTitle>Price Action with Levels</CardTitle>
          <CardDescription>Price movement with support and resistance overlays</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#2563eb"
                name="Price"
                dot={false}
                strokeWidth={2}
              />

              {/* Support/Resistance lines */}
              {supportResistance.map((level, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={() => level.price}
                  stroke={level.type === 'resistance' ? '#ef4444' : '#10b981'}
                  strokeDasharray="5 5"
                  name={`${level.type === 'resistance' ? 'R' : 'S'}: $${level.price.toFixed(2)}`}
                  dot={false}
                  strokeWidth={1}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
          <CardDescription>Key insights from price action analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Trend:</strong> The market is in a {trend.direction} with {trend.strength.toFixed(0)}% strength
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Volatility:</strong> {volatility.volatility > 5 ? 'High' : 'Low'} volatility at{' '}
                {volatility.volatility.toFixed(2)}% with ATR of ${volatility.atr.toFixed(2)}
              </span>
            </li>
            {supportResistance.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>
                  <strong>Key Levels:</strong> Strongest resistance at ${supportResistance[0].price.toFixed(2)} and
                  support at ${supportResistance[supportResistance.length - 1].price.toFixed(2)}
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Range:</strong> Price moved {volatility.highLowRange.toFixed(2)}% within the analysis period
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
