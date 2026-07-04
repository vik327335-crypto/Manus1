import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Prediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface AIInsightsProps {
  strategyName?: string;
  predictions?: Prediction[];
  isLoading?: boolean;
  analysisText?: string;
}

export function AIInsights({
  strategyName = 'Стратегия',
  predictions,
  isLoading = false,
  analysisText,
}: AIInsightsProps) {
  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-green-50 border-green-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'high':
        return 'bg-red-50 border-red-200';
    }
  };

  const getRiskTextColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'text-green-700';
      case 'medium':
        return 'text-yellow-700';
      case 'high':
        return 'text-red-700';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />;
      case 'stable':
        return <div className="h-5 w-5 bg-blue-600 rounded" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Предсказания и рекомендации
          </CardTitle>
          <CardDescription>
            Анализ стратегии "{strategyName}" с использованием машинного обучения
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Analysis Text */}
      {analysisText && (
        <Alert>
          <AlertTitle>Анализ</AlertTitle>
          <AlertDescription className="mt-2 whitespace-pre-wrap">{analysisText}</AlertDescription>
        </Alert>
      )}

      {/* Predictions */}
      {predictions && predictions.length > 0 && (
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <Card
              key={prediction.metric}
              className={`border-2 ${getRiskColor(prediction.riskLevel)}`}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Metric Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{prediction.metric}</h4>
                      <p className="text-sm text-gray-600 mt-1">{prediction.recommendation}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(prediction.trend)}
                      <span
                        className={`text-sm font-semibold px-2 py-1 rounded ${getRiskTextColor(
                          prediction.riskLevel
                        )}`}
                      >
                        {prediction.riskLevel === 'low'
                          ? 'Низкий риск'
                          : prediction.riskLevel === 'medium'
                            ? 'Средний риск'
                            : 'Высокий риск'}
                      </span>
                    </div>
                  </div>

                  {/* Values */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Текущее значение</p>
                      <p className="text-lg font-bold text-gray-900">
                        {prediction.currentValue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Предсказанное значение</p>
                      <p className="text-lg font-bold text-blue-600">
                        {prediction.predictedValue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Уверенность</p>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${prediction.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {prediction.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Change Indicator */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Ожидаемое изменение:</span>
                    <span
                      className={`font-semibold ${
                        prediction.predictedValue > prediction.currentValue
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {prediction.predictedValue > prediction.currentValue ? '+' : ''}
                      {(prediction.predictedValue - prediction.currentValue).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!predictions || (predictions.length === 0 && !isLoading) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-center text-gray-600">
              Нет доступных предсказаний. Выберите стратегию для анализа.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin mb-4">
              <Lightbulb className="h-12 w-12 text-yellow-500" />
            </div>
            <p className="text-center text-gray-600">Анализ стратегии...</p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Советы по использованию</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Предсказания основаны на исторических данных и текущих тенденциях</li>
            <li>• Уверенность показывает надёжность предсказания (выше = надёжнее)</li>
            <li>• Рассмотрите уровень риска перед принятием решения</li>
            <li>• Используйте рекомендации как дополнение к вашему анализу</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
