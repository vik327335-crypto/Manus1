import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface PeriodMetrics {
  period: string;
  startPrice: number;
  endPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volatility: number;
  avgVolume: number;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  trendStrength: number;
}

interface PeriodComparisonProps {
  periods: PeriodMetrics[];
  ticker: string;
}

export function PeriodComparison({ periods, ticker }: PeriodComparisonProps) {
  const comparisonData = useMemo(() => {
    return periods.map((p) => ({
      period: p.period,
      change: p.changePercent,
      volatility: p.volatility,
      trend: p.trendStrength,
      volume: p.avgVolume / 1000000,
    }));
  }, [periods]);

  const performanceRanking = useMemo(() => {
    return [...periods]
      .sort((a, b) => b.changePercent - a.changePercent)
      .map((p, idx) => ({
        rank: idx + 1,
        period: p.period,
        change: p.changePercent,
        trend: p.trend,
      }));
  }, [periods]);

  const volatilityComparison = useMemo(() => {
    return periods.map((p) => ({
      period: p.period,
      volatility: p.volatility,
      atr: (p.high - p.low) / p.startPrice * 100,
    }));
  }, [periods]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {periods.map((period) => (
          <Card key={period.period}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{period.period}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className={`text-2xl font-bold ${period.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {period.changePercent >= 0 ? '+' : ''}
                    {period.changePercent.toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Return</p>
                </div>
                <div className="flex items-center gap-1">
                  {period.trend === 'uptrend' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : period.trend === 'downtrend' ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <div className="h-4 w-4 bg-yellow-600 rounded" />
                  )}
                  <span className="text-xs capitalize">{period.trend}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>Return and volatility across periods</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" label={{ value: 'Return %', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Volatility %', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="change" fill="#3b82f6" name="Return %" />
              <Bar yAxisId="right" dataKey="volatility" fill="#ef4444" name="Volatility %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trend Strength Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Strength Comparison</CardTitle>
          <CardDescription>Trend strength across different periods</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Trend Strength"
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Ranking</CardTitle>
          <CardDescription>Periods ranked by return</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceRanking.map((item) => (
              <div key={item.period} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {item.rank}
                  </div>
                  <div>
                    <p className="font-medium">{item.period}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.trend}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? '+' : ''}
                  {item.change.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Volatility Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Volatility Analysis</CardTitle>
          <CardDescription>Price volatility across periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Volatility %</h4>
              <div className="space-y-2">
                {volatilityComparison.map((item) => (
                  <div key={item.period} className="flex items-center justify-between">
                    <span className="text-sm">{item.period}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.volatility > 5 ? 'bg-red-600' : 'bg-green-600'}`}
                          style={{ width: `${Math.min(item.volatility * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{item.volatility.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">High-Low Range %</h4>
              <div className="space-y-2">
                {volatilityComparison.map((item) => (
                  <div key={item.period} className="flex items-center justify-between">
                    <span className="text-sm">{item.period}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${Math.min(item.atr * 5, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{item.atr.toFixed(2)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
          <CardDescription>Complete period comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Period</th>
                  <th className="text-right py-2 px-2">Start</th>
                  <th className="text-right py-2 px-2">End</th>
                  <th className="text-right py-2 px-2">Change</th>
                  <th className="text-right py-2 px-2">High</th>
                  <th className="text-right py-2 px-2">Low</th>
                  <th className="text-right py-2 px-2">Volatility</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period.period} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{period.period}</td>
                    <td className="text-right py-2 px-2">${period.startPrice.toFixed(2)}</td>
                    <td className="text-right py-2 px-2">${period.endPrice.toFixed(2)}</td>
                    <td className={`text-right py-2 px-2 font-medium ${period.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {period.changePercent >= 0 ? '+' : ''}
                      {period.changePercent.toFixed(2)}%
                    </td>
                    <td className="text-right py-2 px-2">${period.high.toFixed(2)}</td>
                    <td className="text-right py-2 px-2">${period.low.toFixed(2)}</td>
                    <td className="text-right py-2 px-2">{period.volatility.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Analysis summary</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Best Performer:</strong> {performanceRanking[0].period} with{' '}
                {performanceRanking[0].change >= 0 ? '+' : ''}
                {performanceRanking[0].change.toFixed(2)}% return
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Most Volatile:</strong>{' '}
                {periods.reduce((max, p) => (p.volatility > max.volatility ? p : max)).period} with{' '}
                {periods.reduce((max, p) => (p.volatility > max.volatility ? p : max)).volatility.toFixed(2)}% volatility
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                <strong>Strongest Trend:</strong>{' '}
                {periods.reduce((max, p) => (p.trendStrength > max.trendStrength ? p : max)).period} with{' '}
                {periods.reduce((max, p) => (p.trendStrength > max.trendStrength ? p : max)).trendStrength.toFixed(0)}% strength
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
