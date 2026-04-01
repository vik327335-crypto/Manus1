import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Share2, FileJson, FileText, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface StrategyExportButtonProps {
  strategyId: string;
  strategyName: string;
  backtestResults: {
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalReturn: number;
    backtestPeriod: {
      startDate: string;
      endDate: string;
    };
  };
}

export function StrategyExportButton({
  strategyId,
  strategyName,
  backtestResults,
}: StrategyExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const exportJSONMutation = trpc.strategyExport.exportJSON.useMutation();
  const exportYAMLMutation = trpc.strategyExport.exportYAML.useMutation();
  const shareMutation = trpc.strategyExport.shareStrategy.useMutation();

  const handleExportJSON = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await exportJSONMutation.mutateAsync({
        strategyId,
        strategyName,
        backtestResults,
      });

      if (result.success && result.content) {
        downloadFile(result.content, result.filename, result.mimeType);
        setMessage({ type: 'success', text: 'Стратегия экспортирована в JSON' });
      } else {
        setMessage({ type: 'error', text: 'Ошибка при экспорте' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при экспорте в JSON' });
      console.error('Export JSON error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportYAML = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await exportYAMLMutation.mutateAsync({
        strategyId,
        strategyName,
        backtestResults,
      });

      if (result.success && result.content) {
        downloadFile(result.content, result.filename, result.mimeType);
        setMessage({ type: 'success', text: 'Стратегия экспортирована в YAML' });
      } else {
        setMessage({ type: 'error', text: 'Ошибка при экспорте' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при экспорте в YAML' });
      console.error('Export YAML error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await shareMutation.mutateAsync({
        strategyId,
        strategyName,
      });

      if (result.success && result.shareUrl) {
        const fullUrl = `${window.location.origin}${result.shareUrl}`;
        navigator.clipboard.writeText(fullUrl);
        setMessage({
          type: 'success',
          text: 'Ссылка скопирована в буфер обмена',
        });
      } else {
        setMessage({ type: 'error', text: 'Ошибка при создании ссылки' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при создании ссылки' });
      console.error('Share error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        <Download className="w-4 h-4 mr-2" />
        {isOpen ? 'Скрыть опции' : 'Экспортировать стратегию'}
      </Button>

      {isOpen && (
        <Card className="p-4 space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Выберите формат экспорта:</p>

            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleExportJSON}
                variant="secondary"
                size="sm"
                disabled={isLoading}
                className="justify-start"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileJson className="w-4 h-4 mr-2" />
                )}
                JSON формат
              </Button>

              <Button
                onClick={handleExportYAML}
                variant="secondary"
                size="sm"
                disabled={isLoading}
                className="justify-start"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                YAML формат
              </Button>

              <Button
                onClick={handleShare}
                variant="secondary"
                size="sm"
                disabled={isLoading}
                className="justify-start"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4 mr-2" />
                )}
                Поделиться ссылкой
              </Button>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
            <p className="font-medium mb-1">Информация о стратегии:</p>
            <ul className="space-y-1 text-xs">
              <li>• Win Rate: {(backtestResults.winRate * 100).toFixed(1)}%</li>
              <li>• Profit Factor: {backtestResults.profitFactor.toFixed(2)}</li>
              <li>• Sharpe Ratio: {backtestResults.sharpeRatio.toFixed(2)}</li>
              <li>• Max Drawdown: {backtestResults.maxDrawdown.toFixed(1)}%</li>
              <li>• Total Return: {backtestResults.totalReturn.toFixed(1)}%</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Helper function to download file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
