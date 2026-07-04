import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CriticalAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  actionable: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface CriticalAlertsProps {
  alerts?: CriticalAlert[];
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string) => void;
}

export function CriticalAlerts({ alerts = [], onDismiss, onAction }: CriticalAlertsProps) {
  const getAlertIcon = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertStyles = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getAlertTextColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
        return 'text-blue-900';
    }
  };

  const criticalAlerts = alerts.filter((a) => a.type === 'critical');
  const warningAlerts = alerts.filter((a) => a.type === 'warning');
  const infoAlerts = alerts.filter((a) => a.type === 'info');

  if (alerts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-center text-gray-600">Нет активных алертов</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              <p className="text-sm text-red-900">Критических</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</p>
              <p className="text-sm text-yellow-900">Предупреждений</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{infoAlerts.length}</p>
              <p className="text-sm text-blue-900">Информационных</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">🚨 Критические алерты</h3>
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border-2 p-4 ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${getAlertTextColor(alert.type)}`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm mt-1 ${getAlertTextColor(alert.type)}`}>
                        {alert.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className={getAlertTextColor(alert.type)}>
                          Метрика: <strong>{alert.metric}</strong>
                        </span>
                        <span className={getAlertTextColor(alert.type)}>
                          Текущее: <strong>{alert.currentValue.toFixed(2)}</strong>
                        </span>
                        <span className={getAlertTextColor(alert.type)}>
                          Порог: <strong>{alert.threshold.toFixed(2)}</strong>
                        </span>
                        <span className={getAlertTextColor(alert.type)}>
                          {alert.timestamp.toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.actionable && alert.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction?.(alert.id)}
                        className="text-red-600 border-red-200 hover:bg-red-100"
                      >
                        {alert.action.label}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDismiss?.(alert.id)}
                      className="text-red-600 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">⚠️ Предупреждения</h3>
          <div className="space-y-3">
            {warningAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border-2 p-4 ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${getAlertTextColor(alert.type)}`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm mt-1 ${getAlertTextColor(alert.type)}`}>
                        {alert.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className={getAlertTextColor(alert.type)}>
                          Метрика: <strong>{alert.metric}</strong>
                        </span>
                        <span className={getAlertTextColor(alert.type)}>
                          Текущее: <strong>{alert.currentValue.toFixed(2)}</strong>
                        </span>
                        <span className={getAlertTextColor(alert.type)}>
                          Порог: <strong>{alert.threshold.toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss?.(alert.id)}
                    className="text-yellow-600 hover:bg-yellow-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Alerts */}
      {infoAlerts.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">ℹ️ Информация</h3>
          <div className="space-y-3">
            {infoAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border-2 p-4 ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${getAlertTextColor(alert.type)}`}>
                        {alert.title}
                      </h4>
                      <p className={`text-sm mt-1 ${getAlertTextColor(alert.type)}`}>
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss?.(alert.id)}
                    className="text-blue-600 hover:bg-blue-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
