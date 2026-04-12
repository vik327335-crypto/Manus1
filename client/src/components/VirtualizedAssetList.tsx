import { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AssetItem {
  id: number;
  ticker: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  score: number;
  category?: string;
}

interface VirtualizedAssetListProps {
  items: AssetItem[];
  isLoading?: boolean;
  onItemClick?: (item: AssetItem) => void;
  itemsPerPage?: number;
  className?: string;
}

/**
 * VirtualizedAssetList компонент для отображения больших списков активов
 * Использует пагинацию для оптимизации производительности
 * Отображает только видимые элементы в DOM
 */
export function VirtualizedAssetList({
  items,
  isLoading = false,
  onItemClick,
  itemsPerPage = 20,
  className,
}: VirtualizedAssetListProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // Вычисляем видимые элементы
  const { visibleItems, totalPages } = useMemo(() => {
    const total = Math.ceil(items.length / itemsPerPage);
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      visibleItems: items.slice(start, end),
      totalPages: total,
    };
  }, [items, currentPage, itemsPerPage]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  if (isLoading) {
    return (
      <Card className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Загрузка активов...</span>
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <p className="text-muted-foreground">Активы не найдены</p>
          <p className="text-xs text-muted-foreground mt-1">Попробуйте изменить фильтры или поиск</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Заголовок таблицы */}
      <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Актив</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Цена</span>
        </div>
        <div className="text-right min-w-fit">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Score</span>
        </div>
      </div>

      {/* Список активов */}
      <div className="divide-y divide-border">
        {visibleItems.map((item) => {
          const isPositive = item.priceChange24h >= 0;

          return (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className={cn(
                "px-4 py-4 hover:bg-accent transition-colors",
                onItemClick && "cursor-pointer"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Левая часть: Информация об активе */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.ticker}</span>
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    {item.category && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Кап: ${(item.marketCap / 1e9).toFixed(2)}B • Объём: ${(item.volume24h / 1e6).toFixed(2)}M
                  </div>
                </div>

                {/* Средняя часть: Цена */}
                <div className="text-right">
                  <div className="font-semibold text-sm">${item.currentPrice.toFixed(2)}</div>
                  <div
                    className={cn(
                      "text-xs font-medium",
                      isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {isPositive ? "+" : ""}{item.priceChange24h.toFixed(2)}%
                  </div>
                </div>

                {/* Правая часть: Score */}
                <div className="text-right min-w-fit">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                    <span className="font-bold text-sm text-primary">{item.score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Подвал с пагинацией */}
      <div className="px-4 py-3 border-t border-border bg-muted/50 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Показано {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, items.length)} из {items.length} активов
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <span className="text-xs text-muted-foreground min-w-[2rem] text-center">
            {currentPage + 1} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
