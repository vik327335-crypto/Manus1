import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StrategyKPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  description?: string;
  icon?: React.ReactNode;
  status?: 'good' | 'warning' | 'danger' | 'neutral';
  onClick?: () => void;
}

const statusColors = {
  good: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  danger: 'bg-red-50 border-red-200',
  neutral: 'bg-gray-50 border-gray-200',
};

const statusTextColors = {
  good: 'text-green-700',
  warning: 'text-yellow-700',
  danger: 'text-red-700',
  neutral: 'text-gray-700',
};

const trendIcons = {
  up: <TrendingUp className="h-4 w-4 text-green-600" />,
  down: <TrendingDown className="h-4 w-4 text-red-600" />,
  stable: <Activity className="h-4 w-4 text-gray-600" />,
};

export function StrategyKPICard({
  title,
  value,
  unit = '',
  trend,
  trendValue,
  description,
  icon,
  status = 'neutral',
  onClick,
}: StrategyKPICardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        statusColors[status],
        onClick && 'hover:scale-105'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          {icon || (status === 'danger' && <AlertCircle className="h-4 w-4 text-red-600" />)}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-1">
          <span className={cn('text-2xl font-bold', statusTextColors[status])}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>

        {(trend || description) && (
          <div className="flex items-center justify-between">
            {trend && trendValue !== undefined && (
              <div className="flex items-center gap-1">
                {trendIcons[trend]}
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend === 'up' && 'text-green-600',
                    trend === 'down' && 'text-red-600',
                    trend === 'stable' && 'text-gray-600'
                  )}
                >
                  {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(trendValue).toFixed(2)}%
                </span>
              </div>
            )}
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
