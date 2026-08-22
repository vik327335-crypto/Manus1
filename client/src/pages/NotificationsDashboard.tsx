import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  AlertCircle as _AlertCircle,
  CheckCircle,
  Clock as _Clock,
  Trash2,
  Archive,
  Filter as _Filter,
  Search,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'price_alert' | 'signal' | 'portfolio' | 'social' | 'system';
  title: string;
  message: string;
  icon: React.ReactNode;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionLabel?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  data?: Record<string, any>;
}

export const NotificationsDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'price_alert',
      title: 'BTC Price Alert',
      message: 'Bitcoin reached $45,000 - your price alert triggered',
      icon: <TrendingUp className="w-5 h-5" />,
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false,
      actionable: true,
      actionLabel: 'View Chart',
      severity: 'info',
    },
    {
      id: '2',
      type: 'signal',
      title: 'Strong Buy Signal',
      message: 'ETH shows strong buy signal based on CAN SLIM criteria',
      icon: <CheckCircle className="w-5 h-5" />,
      timestamp: new Date(Date.now() - 15 * 60000),
      read: false,
      actionable: true,
      actionLabel: 'Open Position',
      severity: 'success',
    },
    {
      id: '3',
      type: 'portfolio',
      title: 'Portfolio Update',
      message: 'Your portfolio gained 2.5% today',
      icon: <TrendingUp className="w-5 h-5" />,
      timestamp: new Date(Date.now() - 1 * 3600000),
      read: true,
      actionable: false,
      severity: 'info',
    },
    {
      id: '4',
      type: 'signal',
      title: 'Sell Signal',
      message: 'SOL shows sell signal - consider taking profits',
      icon: <TrendingDown className="w-5 h-5" />,
      timestamp: new Date(Date.now() - 2 * 3600000),
      read: true,
      actionable: true,
      actionLabel: 'Review Position',
      severity: 'warning',
    },
    {
      id: '5',
      type: 'social',
      title: 'New Follower',
      message: 'trader_elite started following your strategy',
      icon: <Bell className="w-5 h-5" />,
      timestamp: new Date(Date.now() - 4 * 3600000),
      read: true,
      actionable: false,
      severity: 'info',
    },
  ]);

  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesFilter = selectedFilter === 'all' || notification.type === selectedFilter;
      const matchesSearch =
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [notifications, selectedFilter, searchQuery]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      today: [],
      yesterday: [],
      older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const notification of filteredNotifications) {
      const notifDate = new Date(
        notification.timestamp.getFullYear(),
        notification.timestamp.getMonth(),
        notification.timestamp.getDate()
      );

      if (notifDate.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    }

    return groups;
  }, [filteredNotifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedFilter('all')}
            >
              All
            </Badge>
            <Badge
              variant={selectedFilter === 'price_alert' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedFilter('price_alert')}
            >
              Price Alerts
            </Badge>
            <Badge
              variant={selectedFilter === 'signal' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedFilter('signal')}
            >
              Trading Signals
            </Badge>
            <Badge
              variant={selectedFilter === 'portfolio' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedFilter('portfolio')}
            >
              Portfolio
            </Badge>
            <Badge
              variant={selectedFilter === 'social' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedFilter('social')}
            >
              Social
            </Badge>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {groupedNotifications.today.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Today</h2>
            <div className="space-y-3">
              {groupedNotifications.today.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 cursor-pointer transition ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    setExpandedId(expandedId === notification.id ? null : notification.id);
                  }}
                >
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(notification.severity)}`}>
                      {notification.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>

                        <div className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>

                      {expandedId === notification.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                          {notification.actionable && (
                            <Button className="w-full">{notification.actionLabel || 'Take Action'}</Button>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1">
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {groupedNotifications.yesterday.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Yesterday</h2>
            <div className="space-y-3">
              {groupedNotifications.yesterday.map((notification) => (
                <Card
                  key={notification.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
                >
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(notification.severity)}`}>
                      {notification.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {groupedNotifications.older.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Older</h2>
            <div className="space-y-3">
              {groupedNotifications.older.map((notification) => (
                <Card
                  key={notification.id}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition opacity-75"
                  onClick={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
                >
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(notification.severity)}`}>
                      {notification.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredNotifications.length === 0 && (
          <Card className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No notifications found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or search query</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsDashboard;
