import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Edit2, Check, AlertTriangle } from 'lucide-react';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'drawdown_exceeded' | 'roi_below' | 'winrate_below' | 'sharpe_below';
  triggerValue: number;
  action: 'close_position' | 'send_alert' | 'reduce_size' | 'pause_trading';
  actionValue?: number;
  enabled: boolean;
  createdAt: Date;
}

export function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Закрыть при drawdown > 20%',
      trigger: 'drawdown_exceeded',
      triggerValue: 20,
      action: 'close_position',
      enabled: true,
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Алерт при ROI < 5%',
      trigger: 'roi_below',
      triggerValue: 5,
      action: 'send_alert',
      enabled: true,
      createdAt: new Date(),
    },
  ]);

  const [_editingId, setEditingId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    trigger: 'drawdown_exceeded',
    action: 'send_alert',
    enabled: true,
  });

  const triggerLabels = {
    drawdown_exceeded: 'Drawdown превышен',
    roi_below: 'ROI ниже',
    winrate_below: 'Win Rate ниже',
    sharpe_below: 'Sharpe Ratio ниже',
  };

  const actionLabels = {
    close_position: 'Закрыть позицию',
    send_alert: 'Отправить алерт',
    reduce_size: 'Уменьшить размер',
    pause_trading: 'Приостановить торговлю',
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.triggerValue) {
      return;
    }

    const rule: AutomationRule = {
      id: Date.now().toString(),
      name: newRule.name,
      trigger: newRule.trigger as AutomationRule['trigger'],
      triggerValue: newRule.triggerValue,
      action: newRule.action as AutomationRule['action'],
      actionValue: newRule.actionValue,
      enabled: newRule.enabled ?? true,
      createdAt: new Date(),
    };

    setRules([...rules, rule]);
    setNewRule({
      trigger: 'drawdown_exceeded',
      action: 'send_alert',
      enabled: true,
    });
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleSaveRules = () => {
    localStorage.setItem('automationRules', JSON.stringify(rules));
    alert('Правила сохранены');
  };

  return (
    <div className="space-y-6">
      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Активные правила
          </CardTitle>
          <CardDescription>
            Управляйте автоматическими действиями при срабатывании условий
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <Alert>
              <AlertDescription>
                Нет активных правил. Создайте первое правило ниже.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-lg ${
                    rule.enabled
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => handleToggleRule(rule.id)}
                          className="w-4 h-4"
                        />
                        <h4 className="font-semibold text-gray-900">
                          {rule.name}
                        </h4>
                      </div>
                      <div className="mt-2 ml-6 space-y-1 text-sm text-gray-600">
                        <p>
                          Условие:{' '}
                          <span className="font-medium">
                            {triggerLabels[rule.trigger]} {rule.triggerValue}%
                          </span>
                        </p>
                        <p>
                          Действие:{' '}
                          <span className="font-medium">
                            {actionLabels[rule.action]}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(rule.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Создать новое правило
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Название правила
            </label>
            <input
              type="text"
              value={newRule.name || ''}
              onChange={(e) =>
                setNewRule({ ...newRule, name: e.target.value })
              }
              placeholder="Например: Закрыть при drawdown > 20%"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Условие
              </label>
              <select
                value={newRule.trigger || 'drawdown_exceeded'}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    trigger: e.target.value as AutomationRule['trigger'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(triggerLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Значение (%)
              </label>
              <input
                type="number"
                value={newRule.triggerValue || ''}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    triggerValue: parseFloat(e.target.value),
                  })
                }
                placeholder="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Действие
            </label>
            <select
              value={newRule.action || 'send_alert'}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  action: e.target.value as AutomationRule['action'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAddRule} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Добавить правило
            </Button>
            <Button onClick={handleSaveRules} variant="outline" className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Важно:</strong> Автоматические действия будут выполняться только если
          правило включено. Убедитесь, что вы понимаете последствия каждого действия перед
          его активацией.
        </AlertDescription>
      </Alert>
    </div>
  );
}
