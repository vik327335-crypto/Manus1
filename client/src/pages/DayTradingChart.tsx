import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: '1m' | '5m' | '15m' | '30m';
}

interface Indicator {
  timestamp: number;
  rsi?: number;
  macdLine?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
}

interface Signal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: number;
  price: number;
  reasons: string[];
}

export default function DayTradingChart() {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '30m'>('5m');
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(
    new Set(['rsi', 'macd', 'bollingerBands'])
  );
  const [candles] = useState<Candle[]>([]);
  const [indicators] = useState<Indicator[]>([]);
  const [signals] = useState<Signal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const _chartRef = useRef<HTMLDivElement>(null);

  const toggleIndicator = (indicator: string) => {
    const newSet = new Set(selectedIndicators);
    if (newSet.has(indicator)) {
      newSet.delete(indicator);
    } else {
      newSet.add(indicator);
    }
    setSelectedIndicators(newSet);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel((prev) => (direction === 'in' ? prev * 1.2 : prev / 1.2));
  };

  const handlePan = (direction: 'left' | 'right') => {
    setPanOffset((prev) => (direction === 'left' ? prev - 10 : prev + 10));
  };

  const chartData = candles.slice(panOffset, panOffset + Math.floor(50 / zoomLevel)).map((candle, index) => {
    const indicator = indicators[index + panOffset] || {};
    return {
      ...candle,
      ...indicator,
      time: new Date(candle.timestamp).toLocaleTimeString(),
    };
  });

  return (
    <div className="space-y-6 p-6">
      {/* Заголовок и управление */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Day Trading Chart</h1>
          <p className="text-gray-600">Внутридневной анализ доступен только для верифицированного OHLCV-потока</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 минута</SelectItem>
              <SelectItem value="5m">5 минут</SelectItem>
              <SelectItem value="15m">15 минут</SelectItem>
              <SelectItem value="30m">30 минут</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <CardContent className="pt-6 text-sm">
          Верифицированный intraday OHLCV-поток для этого экрана пока не подключён. Поэтому приложение не генерирует случайные цены, индикаторы или сигналы. Пустые графики и отсутствие сигналов являются намеренным состоянием unavailable, а не торговой рекомендацией.
        </CardContent>
      </Card>

      {/* Управление индикаторами */}
      <Card>
        <CardHeader>
          <CardTitle>Индикаторы</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {['rsi', 'macd', 'bollingerBands', 'volumeProfile'].map((indicator) => (
            <Button
              key={indicator}
              variant={selectedIndicators.has(indicator) ? 'default' : 'outline'}
              onClick={() => toggleIndicator(indicator)}
              className="capitalize"
            >
              {indicator === 'rsi' && 'RSI'}
              {indicator === 'macd' && 'MACD'}
              {indicator === 'bollingerBands' && 'Bollinger Bands'}
              {indicator === 'volumeProfile' && 'Volume Profile'}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* График цены */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Цена и объём</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
              Увеличить
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
              Уменьшить
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePan('left')}>
              ←
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePan('right')}>
              →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                dot={false}
                name="Цена"
                isAnimationActive={false}
              />
              <Bar
                yAxisId="right"
                dataKey="volume"
                fill="#10b981"
                opacity={0.3}
                name="Объём"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Индикатор RSI */}
      {selectedIndicators.has('rsi') && (
        <Card>
          <CardHeader>
            <CardTitle>RSI (Relative Strength Index)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="#f59e0b"
                  dot={false}
                  name="RSI"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey={() => 70}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Перекупленность (70)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey={() => 30}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Перепроданность (30)"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Индикатор MACD */}
      {selectedIndicators.has('macd') && (
        <Card>
          <CardHeader>
            <CardTitle>MACD (Moving Average Convergence Divergence)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="macdLine"
                  stroke="#3b82f6"
                  dot={false}
                  name="MACD Line"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  stroke="#ef4444"
                  dot={false}
                  name="Signal Line"
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="macdHistogram"
                  fill="#10b981"
                  opacity={0.3}
                  name="Histogram"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bollinger Bands */}
      {selectedIndicators.has('bollingerBands') && (
        <Card>
          <CardHeader>
            <CardTitle>Bollinger Bands</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#3b82f6"
                  dot={false}
                  name="Цена"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Верхняя полоса"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="bbMiddle"
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Средняя полоса"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="bbLower"
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Нижняя полоса"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Сигналы */}
      <Card>
        <CardHeader>
          <CardTitle>Сигналы торговли</CardTitle>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет верифицированных intraday данных — торговые сигналы не отображаются.</p>
          ) : <div className="space-y-2 max-h-64 overflow-y-auto">
            {signals.map((signal, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedSignal === signal
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSignal(signal)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {signal.type === 'BUY' ? (
                      <TrendingUp className="text-green-500" />
                    ) : (
                      <TrendingDown className="text-red-500" />
                    )}
                    <div>
                      <Badge
                        variant={signal.type === 'BUY' ? 'default' : 'destructive'}
                        className="mr-2"
                      >
                        {signal.type}
                      </Badge>
                      <span className="text-sm font-medium">
                        ${signal.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="text-yellow-500 w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {signal.confidence.toFixed(0)}%
                    </span>
                  </div>
                </div>
                {selectedSignal === signal && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-semibold mb-1">Причины:</p>
                    <ul className="list-disc list-inside">
                      {signal.reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>

      {/* Горячие клавиши */}
      <Card>
        <CardHeader>
          <CardTitle>Горячие клавиши</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <kbd className="px-2 py-1 bg-gray-200 rounded">B</kbd>
              <span className="ml-2">Быстрая покупка</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-200 rounded">S</kbd>
              <span className="ml-2">Быстрая продажа</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-200 rounded">+/-</kbd>
              <span className="ml-2">Размер позиции</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-200 rounded">Esc</kbd>
              <span className="ml-2">Отмена</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
