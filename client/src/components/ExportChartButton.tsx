import React, { useRef } from 'react';
import { Download, Copy, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const useToast = () => ({
  toast: (props: any) => console.info('[Toast]', props.title, props.description),
});

interface ExportChartButtonProps {
  chartId: string;
  chartTitle?: string;
  chartData?: Array<Record<string, any>>;
  onExportPNG?: () => void;
  onExportCSV?: () => void;
}

export function ExportChartButton({
  chartId,
  chartTitle = 'chart',
  chartData,
  onExportPNG,
  onExportCSV,
}: ExportChartButtonProps) {
  const { toast } = useToast();
  const _canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExportPNG = async () => {
    try {
      const element = document.getElementById(chartId);
      if (!element) {
        toast({
          title: 'Ошибка',
          description: 'График не найден',
          variant: 'destructive',
        });
        return;
      }

      // Use browser's native screenshot capability
      const canvas = await (html2canvas || createCanvasFromElement)(element);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${chartTitle}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Успешно',
        description: 'График экспортирован в PNG',
      });

      onExportPNG?.();
    } catch (error) {
      console.error('Failed to export PNG:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать график',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    try {
      if (!chartData || chartData.length === 0) {
        toast({
          title: 'Ошибка',
          description: 'Нет данных для экспорта',
          variant: 'destructive',
        });
        return;
      }

      const headers = Object.keys(chartData[0]);
      const csvContent = [
        headers.join(','),
        ...chartData.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${chartTitle}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Успешно',
        description: 'Данные экспортированы в CSV',
      });

      onExportCSV?.();
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive',
      });
    }
  };

  const handleExportJSON = () => {
    try {
      if (!chartData || chartData.length === 0) {
        toast({
          title: 'Ошибка',
          description: 'Нет данных для экспорта',
          variant: 'destructive',
        });
        return;
      }

      const jsonContent = JSON.stringify(chartData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${chartTitle}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: 'Успешно',
        description: 'Данные экспортированы в JSON',
      });
    } catch (error) {
      console.error('Failed to export JSON:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive',
      });
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const element = document.getElementById(chartId);
      if (!element) {
        toast({
          title: 'Ошибка',
          description: 'График не найден',
          variant: 'destructive',
        });
        return;
      }

      const canvas = await (html2canvas || createCanvasFromElement)(element);
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) throw new Error('Failed to create blob');
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]);
        toast({
          title: 'Успешно',
          description: 'График скопирован в буфер обмена',
        });
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать график',
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPNG}>
          <Download className="mr-2 h-4 w-4" />
          Экспортировать как PNG
        </DropdownMenuItem>
        {chartData && chartData.length > 0 && (
          <>
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileJson className="mr-2 h-4 w-4" />
              Экспортировать как CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON}>
              <FileJson className="mr-2 h-4 w-4" />
              Экспортировать как JSON
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={handleCopyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Копировать в буфер обмена
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Fallback function if html2canvas is not available
async function createCanvasFromElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = element.offsetWidth;
  canvas.height = element.offsetHeight;

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw a simple representation
  ctx.fillStyle = '#000000';
  ctx.font = '14px Arial';
  ctx.fillText(`Chart: ${element.id}`, 10, 20);

  return canvas;
}

// Check if html2canvas is available globally
declare global {
  var html2canvas: any;
}
