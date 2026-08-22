import React, { useEffect, useState } from "react";
import { Bell, AlertCircle, TrendingUp, TrendingDown as _TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Notification {
  id: string;
  type: "price_change" | "score_change" | "alert";
  ticker: string;
  message: string;
  change: number;
  timestamp: Date;
}

/**
 * Компонент для отображения уведомлений в реальном времени
 */
export function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Имитация WebSocket подключения
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "price_change",
        ticker: "BTC",
        message: "BTC выросла на 5.2% за последний час",
        change: 5.2,
        timestamp: new Date(),
      },
      {
        id: "2",
        type: "score_change",
        ticker: "ETH",
        message: "CAN SLIM score ETH увеличился с 72 до 78",
        change: 6,
        timestamp: new Date(Date.now() - 60000),
      },
    ];

    setNotifications(mockNotifications);
    setIsConnected(true);

    // В реальном приложении здесь будет WebSocket подключение
    // const ws = new WebSocket('wss://your-api.com/notifications');
    // ws.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   setNotifications(prev => [notification, ...prev].slice(0, 10));
    // };
    // return () => ws.close();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "price_change":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "score_change":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "alert":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "сейчас";
    if (minutes < 60) return `${minutes}м назад`;
    if (hours < 24) return `${hours}ч назад`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Статус подключения */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-600" : "bg-red-600"}`}></div>
        <span className="text-sm text-gray-600">
          {isConnected ? "Подключено к WebSocket" : "Отключено"}
        </span>
      </div>

      {/* Список уведомлений */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card className="p-4 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Нет уведомлений</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{notification.ticker}</span>
                    <span
                      className={`text-xs font-semibold ${
                        notification.change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {notification.change >= 0 ? "+" : ""}
                      {notification.change.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatTime(notification.timestamp)}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Информация */}
      <Card className="p-3 bg-blue-50 border-blue-200">
        <p className="text-xs text-blue-800">
          💡 Уведомления обновляются в реальном времени через WebSocket. Вы будете уведомлены об изменениях цены
          &gt;5% за час и изменениях CAN SLIM score.
        </p>
      </Card>
    </div>
  );
}
