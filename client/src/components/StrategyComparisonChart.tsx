import React from 'react';
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ComparisonData {
  name: string;
  roi: number;
  winRate: number;
  sharpeRatio: number;
  profitFactor: number;
  maxDrawdown: number;
}

interface StrategyComparisonChartProps {
  data: ComparisonData[];
  title: string;
  description?: string;
  type?: 'bar' | 'line' | 'radar' | 'scatter';
  metrics?: Array<'roi' | 'winRate' | 'sharpeRatio' | 'profitFactor' | 'maxDrawdown'>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function StrategyComparisonChart({
  data,
  title,
  description,
  type = 'bar',
  metrics = ['roi', 'winRate', 'sharpeRatio'],
}: StrategyComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80 text-gray-500">
          Нет данных для отображения
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {metrics.map((metric, index) => (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={COLORS[index % COLORS.length]}
                  name={metric}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {metrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={COLORS[index % COLORS.length]}
                  name={metric}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar
                name="ROI"
                dataKey="roi"
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.25}
              />
              <Radar
                name="Win Rate"
                dataKey="winRate"
                stroke={COLORS[1]}
                fill={COLORS[1]}
                fillOpacity={0.25}
              />
              <Radar
                name="Sharpe Ratio"
                dataKey="sharpeRatio"
                stroke={COLORS[2]}
                fill={COLORS[2]}
                fillOpacity={0.25}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="roi" name="ROI" />
              <YAxis dataKey="sharpeRatio" name="Sharpe Ratio" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              {data.map((item, index) => (
                <Scatter
                  key={item.name}
                  name={item.name}
                  data={[item]}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}
