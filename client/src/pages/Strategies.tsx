import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Share2, Download, Star, Trash2 } from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  description: string;
  filters: Record<string, any>;
  rating: number;
  author: string;
  isPublic: boolean;
  createdAt: string;
  usageCount: number;
}

/**
 * Страница для управления и обмена стратегиями CAN SLIM
 */
export function Strategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: "1",
      name: "Агрессивный рост",
      description: "Стратегия для поиска активов с высоким потенциалом роста",
      filters: {
        scoreMin: 75,
        marketCapMin: 100000000,
        volumeMin: 50000000,
        priceChange24hMin: 5,
      },
      rating: 4.8,
      author: "Вы",
      isPublic: true,
      createdAt: "2026-04-10",
      usageCount: 245,
    },
    {
      id: "2",
      name: "Консервативный",
      description: "Стратегия для стабильных активов с хорошим фундаментом",
      filters: {
        scoreMin: 60,
        marketCapMin: 1000000000,
        volumeMin: 100000000,
        priceChange24hMin: 0,
      },
      rating: 4.5,
      author: "CryptoAnalyst",
      isPublic: true,
      createdAt: "2026-03-15",
      usageCount: 512,
    },
    {
      id: "3",
      name: "Momentum Trading",
      description: "Стратегия для поиска активов с сильным momentum",
      filters: {
        scoreMin: 70,
        marketCapMin: 50000000,
        volumeMin: 25000000,
        priceChange24hMin: 10,
      },
      rating: 4.2,
      author: "TradingPro",
      isPublic: true,
      createdAt: "2026-02-20",
      usageCount: 189,
    },
  ]);

  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  const deleteStrategy = (id: string) => {
    setStrategies(strategies.filter((s) => s.id !== id));
    setSelectedStrategy(null);
  };

  const _togglePublic = (id: string) => {
    setStrategies(
      strategies.map((s) => (s.id === id ? { ...s, isPublic: !s.isPublic } : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Стратегии</h1>
          <p className="text-gray-500 mt-1">Сохраняйте и делитесь своими CAN SLIM стратегиями</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Создать стратегию
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список стратегий */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Доступные стратегии</CardTitle>
              <CardDescription>{strategies.length} стратегий</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {strategies.map((strategy) => (
                <div
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedStrategy?.id === strategy.id
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{strategy.name}</p>
                      <p className="text-xs text-gray-600 truncate">{strategy.author}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold">{strategy.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Детали стратегии */}
        <div className="lg:col-span-2">
          {selectedStrategy ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedStrategy.name}</CardTitle>
                      <CardDescription>{selectedStrategy.author}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{selectedStrategy.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Описание</h3>
                    <p className="text-gray-700">{selectedStrategy.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Параметры фильтра</h3>
                    <div className="bg-gray-50 p-3 rounded space-y-2">
                      {Object.entries(selectedStrategy.filters).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-semibold">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Использований</p>
                      <p className="text-lg font-bold">{selectedStrategy.usageCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Создана</p>
                      <p className="text-lg font-bold">{selectedStrategy.createdAt}</p>
                    </div>
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button className="flex-1 gap-2">
                      <Download className="w-4 h-4" />
                      Использовать
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Поделиться
                    </Button>
                    {selectedStrategy.author === "Вы" && (
                      <Button
                        variant="outline"
                        className="gap-2 text-red-600 hover:text-red-700"
                        onClick={() => deleteStrategy(selectedStrategy.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Рейтинги и отзывы */}
              <Card>
                <CardHeader>
                  <CardTitle>Рейтинг и статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Эффективность</span>
                      <span className="text-sm font-semibold text-green-600">
                        {selectedStrategy.rating * 20}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${selectedStrategy.rating * 20}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Статус</p>
                      <p className="text-sm font-semibold">
                        {selectedStrategy.isPublic ? "Публичная" : "Приватная"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Пользователей</p>
                      <p className="text-sm font-semibold">
                        {Math.floor(selectedStrategy.usageCount / 10)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Выберите стратегию для просмотра деталей</p>
            </Card>
          )}
        </div>
      </div>

      {/* Информация */}
      <Card>
        <CardHeader>
          <CardTitle>О стратегиях</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>
            💡 <strong>Стратегии</strong> — это сохранённые наборы фильтров и параметров для поиска активов.
          </p>
          <p>
            💡 Вы можете <strong>делиться</strong> своими стратегиями с другими пользователями и использовать их.
          </p>
          <p>
            💡 <strong>Рейтинг</strong> показывает эффективность стратегии на основе результатов пользователей.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
