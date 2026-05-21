import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart3,
} from "lucide-react";

interface PaperAccount {
  id: number;
  name: string;
  initialBalance: number;
  currentBalance: number;
  totalProfit: number;
  totalReturn: number;
  trades: number;
  winRate: number;
  maxDrawdown: number;
}

interface PaperTrade {
  id: number;
  symbol: string;
  type: "BUY" | "SELL";
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  pnlPercent?: number;
  status: "OPEN" | "CLOSED";
  createdAt: string;
}

const mockAccounts: PaperAccount[] = [
  {
    id: 1,
    name: "Мой первый счёт",
    initialBalance: 10000,
    currentBalance: 12500,
    totalProfit: 2500,
    totalReturn: 2500,
    trades: 15,
    winRate: 6667,
    maxDrawdown: -1500,
  },
];

const mockTrades: PaperTrade[] = [
  {
    id: 1,
    symbol: "BTC",
    type: "BUY",
    entryPrice: 45000,
    exitPrice: 48000,
    quantity: 0.1,
    pnl: 300,
    pnlPercent: 667,
    status: "CLOSED",
    createdAt: "2026-05-20",
  },
  {
    id: 2,
    symbol: "ETH",
    type: "BUY",
    entryPrice: 2500,
    exitPrice: 2800,
    quantity: 1,
    pnl: 300,
    pnlPercent: 1200,
    status: "CLOSED",
    createdAt: "2026-05-19",
  },
  {
    id: 3,
    symbol: "SOL",
    type: "BUY",
    entryPrice: 100,
    quantity: 10,
    status: "OPEN",
    createdAt: "2026-05-21",
  },
];

export default function PaperTrading() {
  const [selectedAccount, setSelectedAccount] = useState<PaperAccount | null>(
    mockAccounts[0] || null
  );
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("10000");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return (value / 100).toFixed(2) + "%";
  };

  if (!selectedAccount) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Виртуальная торговля</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 mb-4">
              Создайте виртуальный счёт для практики без риска
            </p>
            <Button onClick={() => setShowNewAccountForm(true)}>
              <Plus size={16} className="mr-2" />
              Создать новый счёт
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{selectedAccount.name}</h1>
          <p className="text-gray-600">Виртуальная торговля для практики</p>
        </div>
        <Button variant="outline">
          <Plus size={16} className="mr-2" />
          Новый счёт
        </Button>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Баланс</p>
            <p className="text-2xl font-bold">
              {formatCurrency(selectedAccount.currentBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Начальный: {formatCurrency(selectedAccount.initialBalance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Прибыль</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {formatCurrency(selectedAccount.totalProfit)}
              </p>
              {selectedAccount.totalProfit > 0 ? (
                <TrendingUp className="text-green-500" />
              ) : (
                <TrendingDown className="text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatPercent(selectedAccount.totalReturn)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Процент побед</p>
            <p className="text-2xl font-bold">
              {formatPercent(selectedAccount.winRate)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedAccount.trades} сделок
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Макс. просадка</p>
            <p className="text-2xl font-bold text-red-600">
              {formatPercent(Math.abs(selectedAccount.maxDrawdown))}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(selectedAccount.maxDrawdown)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trades">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trades">Сделки</TabsTrigger>
          <TabsTrigger value="positions">Открытые позиции</TabsTrigger>
          <TabsTrigger value="statistics">Статистика</TabsTrigger>
        </TabsList>

        {/* Trades Tab */}
        <TabsContent value="trades" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">История сделок</h2>
            <Button>
              <Plus size={16} className="mr-2" />
              Новая сделка
            </Button>
          </div>

          <div className="space-y-2">
            {mockTrades.map((trade) => (
              <Card key={trade.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-semibold">{trade.symbol}</p>
                          <p className="text-sm text-gray-600">
                            {trade.createdAt}
                          </p>
                        </div>
                        <Badge
                          variant={
                            trade.type === "BUY" ? "default" : "secondary"
                          }
                        >
                          {trade.type === "BUY" ? "Покупка" : "Продажа"}
                        </Badge>
                        <Badge
                          variant={
                            trade.status === "OPEN" ? "outline" : "secondary"
                          }
                        >
                          {trade.status === "OPEN" ? "Открыто" : "Закрыто"}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold">
                            {trade.quantity} {trade.symbol}
                          </p>
                          <p className="text-sm text-gray-600">
                            @ ${trade.entryPrice.toLocaleString()}
                          </p>
                        </div>

                        {trade.status === "CLOSED" && trade.pnl !== undefined && trade.pnlPercent !== undefined && (
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                trade.pnl > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {trade.pnl > 0 ? "+" : ""}
                              {formatCurrency(trade.pnl)}
                            </p>
                            <p
                              className={`text-sm ${
                                trade.pnlPercent > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {trade.pnlPercent > 0 ? "+" : ""}
                              {formatPercent(trade.pnlPercent)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <h2 className="text-lg font-semibold">Открытые позиции</h2>

          <div className="space-y-2">
            {mockTrades
              .filter((t) => t.status === "OPEN")
              .map((trade) => (
                <Card key={trade.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{trade.symbol}</p>
                        <p className="text-sm text-gray-600">
                          {trade.quantity} шт @ ${trade.entryPrice}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Закрыть
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {mockTrades.filter((t) => t.status === "OPEN").length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                Нет открытых позиций
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 size={20} />
                  Производительность
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Всего сделок:</span>
                  <span className="font-semibold">{selectedAccount.trades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Выигрышных:</span>
                  <span className="font-semibold text-green-600">
                    {Math.round(
                      (selectedAccount.trades * selectedAccount.winRate) / 10000
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Проигрышных:</span>
                  <span className="font-semibold text-red-600">
                    {selectedAccount.trades -
                      Math.round(
                        (selectedAccount.trades * selectedAccount.winRate) /
                          10000
                      )}
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="text-gray-600">Процент побед:</span>
                  <span className="font-semibold">
                    {formatPercent(selectedAccount.winRate)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Риск/Награда
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Макс. прибыль:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      Math.max(
                        ...mockTrades
                          .filter((t) => t.pnl)
                          .map((t) => t.pnl || 0)
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Макс. убыток:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(
                      Math.min(
                        ...mockTrades
                          .filter((t) => t.pnl)
                          .map((t) => t.pnl || 0)
                      )
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Макс. просадка:</span>
                  <span className="font-semibold text-red-600">
                    {formatPercent(Math.abs(selectedAccount.maxDrawdown))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
