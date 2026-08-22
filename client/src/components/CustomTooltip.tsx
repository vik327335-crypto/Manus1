import React from 'react';
import { cn } from '@/lib/utils';

interface TooltipPayload {
  name: string;
  value: number | string;
  color?: string;
  dataKey?: string;
  payload?: any;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
  labelFormatter?: (value: any) => string;
  contentStyle?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  showMetricDescription?: boolean;
  showTrend?: boolean;
  showPercentage?: boolean;
  customFormat?: (value: number, key: string) => string;
}

const metricDescriptions: Record<string, string> = {
  roi: 'Return on Investment - процент прибыли от инвестиций',
  winRate: 'Win Rate - процент выигрышных сделок',
  sharpeRatio: 'Sharpe Ratio - риск-скорректированный доход',
  profitFactor: 'Profit Factor - соотношение прибыли к убыткам',
  maxDrawdown: 'Max Drawdown - максимальный спад от пика',
  totalProfit: 'Total Profit - общая прибыль в абсолютных числах',
  timestamp: 'Дата/Время',
  period: 'Период анализа',
  name: 'Название стратегии',
};

const metricUnits: Record<string, string> = {
  roi: '%',
  winRate: '%',
  sharpeRatio: '',
  profitFactor: 'x',
  maxDrawdown: '%',
  totalProfit: '$',
};

const metricColors: Record<string, string> = {
  roi: '#3b82f6',
  winRate: '#10b981',
  sharpeRatio: '#f59e0b',
  profitFactor: '#8b5cf6',
  maxDrawdown: '#ef4444',
  totalProfit: '#06b6d4',
};

const formatMetricValue = (value: number | string, key: string, customFormat?: (value: number, key: string) => string): string => {
  if (customFormat && typeof value === 'number') {
    return customFormat(value, key);
  }

  if (typeof value === 'string') {
    return value;
  }

  const unit = metricUnits[key] || '';

  switch (key) {
    case 'roi':
    case 'winRate':
    case 'maxDrawdown':
      return `${value.toFixed(2)}${unit}`;
    case 'sharpeRatio':
      return `${value.toFixed(3)}`;
    case 'profitFactor':
      return `${value.toFixed(2)}${unit}`;
    case 'totalProfit':
      return `${value.toFixed(2)}${unit}`;
    default:
      return `${value}`;
  }
};

const getMetricStatus = (key: string, value: number): 'good' | 'warning' | 'danger' => {
  switch (key) {
    case 'roi':
      if (value > 20) return 'good';
      if (value > 5) return 'warning';
      return 'danger';
    case 'winRate':
      if (value > 0.6) return 'good';
      if (value > 0.4) return 'warning';
      return 'danger';
    case 'sharpeRatio':
      if (value > 1.5) return 'good';
      if (value > 0.5) return 'warning';
      return 'danger';
    case 'profitFactor':
      if (value > 2) return 'good';
      if (value > 1.5) return 'warning';
      return 'danger';
    case 'maxDrawdown':
      if (value < 5) return 'good';
      if (value < 15) return 'warning';
      return 'danger';
    default:
      return 'warning';
  }
};

const statusBgColors = {
  good: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  danger: 'bg-red-50 border-red-200',
};

const statusTextColors = {
  good: 'text-green-700',
  warning: 'text-yellow-700',
  danger: 'text-red-700',
};

export function CustomTooltip({
  active,
  payload,
  label,
  labelFormatter,
  contentStyle: _contentStyle,
  wrapperStyle,
  showMetricDescription = true,
  showTrend = false,
  showPercentage = false,
  customFormat,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-50"
      style={wrapperStyle}
    >
      {/* Label */}
      {formattedLabel && (
        <p className="mb-2 text-sm font-semibold text-gray-900">{formattedLabel}</p>
      )}

      {/* Metrics */}
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const key = entry.dataKey || entry.name;
          const status = typeof entry.value === 'number' ? getMetricStatus(key, entry.value) : 'warning';
          const formattedValue = formatMetricValue(entry.value, key, customFormat);

          return (
            <div
              key={`${key}-${index}`}
              className={cn(
                'rounded border px-2 py-1.5 text-xs',
                statusBgColors[status]
              )}
            >
              {/* Metric name and value */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color || metricColors[key] || '#999' }}
                  />
                  <span className="font-medium text-gray-700">{entry.name}</span>
                </div>
                <span className={cn('font-semibold', statusTextColors[status])}>
                  {formattedValue}
                </span>
              </div>

              {/* Description */}
              {showMetricDescription && metricDescriptions[key] && (
                <p className="mt-1 text-xs text-gray-600 leading-tight">
                  {metricDescriptions[key]}
                </p>
              )}

              {/* Trend indicator */}
              {showTrend && entry.payload?.trend && (
                <div className="mt-1 text-xs text-gray-600">
                  Тренд: {entry.payload.trend === 'up' ? '📈 Растёт' : entry.payload.trend === 'down' ? '📉 Падает' : '➡️ Стабильно'}
                </div>
              )}

              {/* Percentage change */}
              {showPercentage && entry.payload?.percentChange !== undefined && (
                <div className={cn(
                  'mt-1 text-xs font-medium',
                  entry.payload.percentChange > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {entry.payload.percentChange > 0 ? '+' : ''}{entry.payload.percentChange.toFixed(2)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      {payload.length > 1 && (
        <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-500">
          {payload.length} метрик(и)
        </div>
      )}
    </div>
  );
}

// Специализированный tooltip для KPI карточек
export function KPITooltip({
  title,
  value,
  unit,
  description,
  trend,
  trendValue,
  status,
}: {
  title: string;
  value: number;
  unit?: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status?: 'good' | 'warning' | 'danger';
}) {
  const statusBg = {
    good: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };

  const statusText = {
    good: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-3 shadow-lg z-50 w-max max-w-xs',
        statusBg[status || 'warning']
      )}
    >
      <p className="font-semibold text-gray-900">{title}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn('text-xl font-bold', statusText[status || 'warning'])}>
          {value.toFixed(2)}
        </span>
        {unit && <span className="text-sm text-gray-600">{unit}</span>}
      </div>

      {description && (
        <p className="mt-2 text-xs text-gray-600 leading-tight">{description}</p>
      )}

      {trend && trendValue !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs font-medium">
          <span>
            {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
          </span>
          <span className={cn(
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          )}>
            {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(trendValue).toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Tooltip для сравнительных графиков
export function ComparisonTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-xl z-50">
      <p className="mb-3 font-semibold text-gray-900">{label}</p>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">{entry.name}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
