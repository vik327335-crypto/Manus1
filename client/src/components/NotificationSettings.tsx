import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, Check, AlertTriangle, Loader } from 'lucide-react';
import { pushNotificationService } from '@/lib/pushNotifications';

interface NotificationSettings {
  enabled: boolean;
  criticalAlerts: boolean;
  warningAlerts: boolean;
  infoAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    criticalAlerts: true,
    warningAlerts: true,
    infoAlerts: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = pushNotificationService.isSupported();
    setIsSupported(supported);

    // Load saved settings from localStorage
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Check current notification permission
    if (supported && Notification.permission === 'granted') {
      setSettings((prev) => ({ ...prev, enabled: true }));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    setSuccess('Параметры сохранены');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      setError('Push-уведомления не поддерживаются вашим браузером');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permission = await pushNotificationService.requestPermission();

      if (permission === 'granted') {
        // Register service worker
        await pushNotificationService.registerServiceWorker();

        // Subscribe to push notifications
        const vapidKey = process.env.VITE_VAPID_PUBLIC_KEY || '';
        if (vapidKey) {
          await pushNotificationService.subscribe(vapidKey);
        }

        setSettings((prev) => ({ ...prev, enabled: true }));
        setSuccess('Push-уведомления включены');

        // Send test notification
        await pushNotificationService.sendLocalNotification({
          title: 'CAN SLIM Crypto Scanner',
          body: 'Push-уведомления успешно включены!',
          icon: '/icon-192x192.png',
        });
      } else if (permission === 'denied') {
        setError('Вы отклонили запрос на разрешение уведомлений');
      }
    } catch (err) {
      console.error('Failed to enable notifications:', err);
      setError(
        err instanceof Error ? err.message : 'Ошибка при включении уведомлений'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationService.unsubscribe();
      setSettings((prev) => ({ ...prev, enabled: false }));
      setSuccess('Push-уведомления отключены');
    } catch (err) {
      console.error('Failed to disable notifications:', err);
      setError(
        err instanceof Error ? err.message : 'Ошибка при отключении уведомлений'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.sendLocalNotification({
        title: 'Тестовое уведомление',
        body: 'Это тестовое push-уведомление от CAN SLIM Crypto Scanner',
        icon: '/icon-192x192.png',
        tag: 'test-notification',
        requireInteraction: true,
      });
      setSuccess('Тестовое уведомление отправлено');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ошибка при отправке тестового уведомления'
      );
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900">
                Push-уведомления не поддерживаются
              </h4>
              <p className="text-sm text-yellow-800 mt-1">
                Ваш браузер не поддерживает Web Push API. Пожалуйста, используйте
                современный браузер (Chrome, Firefox, Edge) для включения
                push-уведомлений.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Параметры уведомлений
          </CardTitle>
          <CardDescription>
            Управляйте push-уведомлениями и их типами
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">
                Push-уведомления
              </h4>
              <p className="text-sm text-gray-600">
                {settings.enabled ? 'Включены' : 'Отключены'}
              </p>
            </div>
            <Button
              onClick={
                settings.enabled
                  ? handleDisableNotifications
                  : handleEnableNotifications
              }
              disabled={isLoading}
              variant={settings.enabled ? 'destructive' : 'default'}
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : settings.enabled ? (
                'Отключить'
              ) : (
                'Включить'
              )}
            </Button>
          </div>

          {/* Notification Types */}
          {settings.enabled && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Типы уведомлений</h4>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.criticalAlerts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      criticalAlerts: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Критические алерты
                  </p>
                  <p className="text-sm text-gray-600">
                    Срочные уведомления о проблемах
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.warningAlerts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      warningAlerts: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Предупреждения</p>
                  <p className="text-sm text-gray-600">
                    Важные уведомления о метриках
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.infoAlerts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      infoAlerts: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Информационные
                  </p>
                  <p className="text-sm text-gray-600">
                    Общая информация и обновления
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Sound and Vibration */}
          {settings.enabled && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Эффекты</h4>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      soundEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Звук</p>
                  <p className="text-sm text-gray-600">
                    Воспроизводить звук при уведомлении
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.vibrationEnabled}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      vibrationEnabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Вибрация</p>
                  <p className="text-sm text-gray-600">
                    Вибрировать при уведомлении
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={saveSettings} variant="outline" className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
            {settings.enabled && (
              <Button
                onClick={handleTestNotification}
                variant="secondary"
                className="flex-1"
              >
                Тестовое уведомление
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Успешно</AlertTitle>
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Info */}
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertTitle>О push-уведомлениях</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Вы будете получать уведомления даже при закрытом приложении</li>
            <li>• Уведомления отправляются на основе выбранных типов</li>
            <li>• Вы можете отключить уведомления в любой момент</li>
            <li>• Параметры сохраняются локально на вашем устройстве</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
