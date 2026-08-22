import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationManager() {
  const {
    isSupported,
    isSubscribed,
    requestPermission: _requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isSupported) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Push-уведомления не поддерживаются</p>
            <p className="text-sm text-yellow-800 mt-1">
              Ваш браузер или устройство не поддерживает push-уведомления. Используйте современный браузер (Chrome, Firefox, Edge).
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleSubscribe = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const success = await subscribe();
      if (success) {
        setMessage({ type: 'success', text: 'Push-уведомления включены' });
      } else {
        setMessage({ type: 'error', text: 'Не удалось включить push-уведомления' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при включении push-уведомлений' });
      console.error('Subscribe error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const success = await unsubscribe();
      if (success) {
        setMessage({ type: 'success', text: 'Push-уведомления отключены' });
      } else {
        setMessage({ type: 'error', text: 'Не удалось отключить push-уведомления' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при отключении push-уведомлений' });
      console.error('Unsubscribe error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendLocalNotification({
        title: 'CAN SLIM Alert',
        body: 'Это тестовое уведомление. Если вы его видите, push-уведомления работают корректно.',
        tag: 'test-notification',
        requireInteraction: false,
      });
      setMessage({ type: 'success', text: 'Тестовое уведомление отправлено' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при отправке тестового уведомления' });
      console.error('Test notification error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isSubscribed ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Push-уведомления включены</h3>
                </>
              ) : (
                <>
                  <BellOff className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Push-уведомления отключены</h3>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isSubscribed
                ? 'Вы будете получать уведомления о ценовых изменениях, новых катализаторах и обновлениях CAN SLIM оценок.'
                : 'Включите push-уведомления, чтобы получать оповещения о важных событиях в вашем вотчлисте.'}
            </p>
          </div>
          <Bell className="w-6 h-6 text-blue-600 flex-shrink-0" />
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {isSubscribed ? (
            <>
              <Button
                onClick={handleTestNotification}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                Тест уведомления
              </Button>
              <Button
                onClick={handleUnsubscribe}
                variant="destructive"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? 'Отключение...' : 'Отключить'}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSubscribe}
              variant="default"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? 'Включение...' : 'Включить push-уведомления'}
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Типы уведомлений</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• <strong>Ценовые оповещения:</strong> Пробой ключевых уровней цены</li>
          <li>• <strong>Обновления оценок:</strong> Изменение CAN SLIM оценки актива</li>
          <li>• <strong>Новые катализаторы:</strong> Важные новости и события</li>
          <li>• <strong>Изменения портфеля:</strong> Корреляция и переб балансировка</li>
        </ul>
      </Card>
    </div>
  );
}
