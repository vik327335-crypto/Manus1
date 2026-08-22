import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge as _Badge } from '@/components/ui/badge';
import { TrendingUp as _TrendingUp, TrendingDown as _TrendingDown, X, Edit2 } from 'lucide-react';

interface Position {
  id: string;
  asset: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: Date;
  status: 'OPEN' | 'CLOSED' | 'STOPPED';
  pnl: number;
  pnlPercentage: number;
}

export default function DayTradingPositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Position>>({});
  const [totalPnL, setTotalPnL] = useState(0);
  const [winRate, setWinRate] = useState(0);

  // Симуляция получения позиций
  useEffect(() => {
    const mockPositions: Position[] = [
      {
        id: '1',
        asset: 'BTC/USD',
        entryPrice: 45000,
        currentPrice: 45230,
        quantity: 0.5,
        stopLoss: 44800,
        takeProfit: 45500,
        entryTime: new Date(Date.now() - 30 * 60000),
        status: 'OPEN',
        pnl: 115,
        pnlPercentage: 0.51,
      },
      {
        id: '2',
        asset: 'ETH/USD',
        entryPrice: 2500,
        currentPrice: 2480,
        quantity: 1,
        stopLoss: 2450,
        takeProfit: 2550,
        entryTime: new Date(Date.now() - 15 * 60000),
        status: 'OPEN',
        pnl: -20,
        pnlPercentage: -0.8,
      },
      {
        id: '3',
        asset: 'SOL/USD',
        entryPrice: 85,
        currentPrice: 87,
        quantity: 10,
        stopLoss: 83,
        takeProfit: 90,
        entryTime: new Date(Date.now() - 2 * 60 * 60000),
        status: 'CLOSED',
        pnl: 20,
        pnlPercentage: 2.35,
      },
    ];

    setPositions(mockPositions);
    calculateStats(mockPositions);

    // Обновление цен каждые 2 секунды
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => ({
          ...pos,
          currentPrice: pos.currentPrice + (Math.random() - 0.5) * 10,
          pnl: (pos.currentPrice - pos.entryPrice) * pos.quantity,
          pnlPercentage: ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const calculateStats = (positionList: Position[]) => {
    const _openPositions = positionList.filter((p) => p.status === 'OPEN');
    const closedPositions = positionList.filter((p) => p.status === 'CLOSED');

    const totalPnL = positionList.reduce((sum, p) => sum + p.pnl, 0);
    setTotalPnL(totalPnL);

    if (closedPositions.length > 0) {
      const winCount = closedPositions.filter((p) => p.pnl > 0).length;
      setWinRate((winCount / closedPositions.length) * 100);
    }
  };

  const closePosition = (id: string) => {
    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === id ? { ...pos, status: 'CLOSED' } : pos
      )
    );
  };

  const updatePosition = (id: string) => {
    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === id ? { ...pos, ...editValues } : pos
      )
    );
    setEditingId(null);
    setEditValues({});
  };

  const openPositions = positions.filter((p) => p.status === 'OPEN');
  const closedPositions = positions.filter((p) => p.status === 'CLOSED');

  return (
    <div className="space-y-6 p-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Day Trading Positions</h1>
        <p className="text-gray-600">Управление открытыми и закрытыми позициями</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Общий P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Открытые позиции</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openPositions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Закрытые позиции</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedPositions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Открытые позиции */}
      <Card>
        <CardHeader>
          <CardTitle>Открытые позиции ({openPositions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Актив</th>
                  <th className="text-right py-2 px-4">Кол-во</th>
                  <th className="text-right py-2 px-4">Вход</th>
                  <th className="text-right py-2 px-4">Текущая</th>
                  <th className="text-right py-2 px-4">Stop Loss</th>
                  <th className="text-right py-2 px-4">Take Profit</th>
                  <th className="text-right py-2 px-4">P&L</th>
                  <th className="text-center py-2 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((position) => (
                  <tr key={position.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{position.asset}</td>
                    <td className="text-right py-3 px-4">{position.quantity}</td>
                    <td className="text-right py-3 px-4">
                      ${position.entryPrice.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${position.currentPrice.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-red-600">
                        ${position.stopLoss.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-green-600">
                        ${position.takeProfit.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <div
                        className={`font-bold ${
                          position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${position.pnl.toFixed(2)}
                        <div className="text-xs">
                          {position.pnlPercentage >= 0 ? '+' : ''}
                          {position.pnlPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(position.id);
                            setEditValues(position);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => closePosition(position.id)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Редактирование позиции */}
          {editingId && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Редактирование позиции</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Stop Loss</label>
                  <Input
                    type="number"
                    value={editValues.stopLoss || ''}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        stopLoss: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Take Profit</label>
                  <Input
                    type="number"
                    value={editValues.takeProfit || ''}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        takeProfit: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => updatePosition(editingId)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setEditValues({});
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Закрытые позиции */}
      <Card>
        <CardHeader>
          <CardTitle>Закрытые позиции ({closedPositions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Актив</th>
                  <th className="text-right py-2 px-4">Кол-во</th>
                  <th className="text-right py-2 px-4">Вход</th>
                  <th className="text-right py-2 px-4">Выход</th>
                  <th className="text-right py-2 px-4">P&L</th>
                  <th className="text-right py-2 px-4">Время</th>
                </tr>
              </thead>
              <tbody>
                {closedPositions.map((position) => (
                  <tr key={position.id} className="border-b">
                    <td className="py-3 px-4 font-medium">{position.asset}</td>
                    <td className="text-right py-3 px-4">{position.quantity}</td>
                    <td className="text-right py-3 px-4">
                      ${position.entryPrice.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${position.currentPrice.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <div
                        className={`font-bold ${
                          position.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${position.pnl.toFixed(2)}
                        <div className="text-xs">
                          {position.pnlPercentage >= 0 ? '+' : ''}
                          {position.pnlPercentage.toFixed(2)}%
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {position.entryTime.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Калькулятор риска/прибыли */}
      <Card>
        <CardHeader>
          <CardTitle>Калькулятор риска/прибыли</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Цена входа</label>
                <Input type="number" placeholder="45000" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Stop Loss</label>
                <Input type="number" placeholder="44800" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Take Profit</label>
                <Input type="number" placeholder="45500" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Размер позиции (BTC)</label>
                <Input type="number" placeholder="0.5" className="mt-1" />
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Риск на позицию</p>
                <p className="text-2xl font-bold text-red-600">$100.00</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Потенциальная прибыль</p>
                <p className="text-2xl font-bold text-green-600">$250.00</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Соотношение риск/прибыль</p>
                <p className="text-2xl font-bold text-blue-600">1:2.5</p>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Открыть позицию
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
