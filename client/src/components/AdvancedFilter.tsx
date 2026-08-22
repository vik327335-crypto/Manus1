import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Filter, X, Plus as _Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterCriteria {
  minScore?: number;
  maxScore?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume24h?: number;
  maxVolume24h?: number;
  minPriceChange24h?: number;
  maxPriceChange24h?: number;
  category?: string;
}

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterCriteria) => void;
  className?: string;
}

/**
 * AdvancedFilter компонент для расширенной фильтрации активов
 * Позволяет устанавливать диапазоны для различных метрик
 */
export function AdvancedFilter({ onFilterChange, className }: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [activeCount, setActiveCount] = useState(0);

  const handleFilterChange = (key: keyof FilterCriteria, value: number | string | undefined) => {
    const newFilters = { ...filters };

    if (value === "" || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value as any;
    }

    setFilters(newFilters);

    // Подсчёт активных фильтров
    const count = Object.values(newFilters).filter((v) => v !== undefined).length;
    setActiveCount(count);

    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    setActiveCount(0);
    onFilterChange({});
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Filter className="h-4 w-4 mr-2" />
        Фильтры
        {activeCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {activeCount}
          </span>
        )}
      </Button>

      {/* Панель фильтров */}
      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 p-4 w-96 shadow-lg z-50">
          <div className="space-y-4">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Расширенные фильтры</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CAN SLIM Score */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">CAN SLIM Score</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Мин"
                  min="0"
                  max="100"
                  value={filters.minScore ?? ""}
                  onChange={(e) =>
                    handleFilterChange("minScore", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-1/2"
                />
                <Input
                  type="number"
                  placeholder="Макс"
                  min="0"
                  max="100"
                  value={filters.maxScore ?? ""}
                  onChange={(e) =>
                    handleFilterChange("maxScore", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-1/2"
                />
              </div>
            </div>

            {/* Рыночная капитализация */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Рыночная капитализация ($)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Мин"
                  value={filters.minMarketCap ?? ""}
                  onChange={(e) =>
                    handleFilterChange("minMarketCap", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-1/2"
                />
                <Input
                  type="number"
                  placeholder="Макс"
                  value={filters.maxMarketCap ?? ""}
                  onChange={(e) =>
                    handleFilterChange("maxMarketCap", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-1/2"
                />
              </div>
            </div>

            {/* Объём торговли 24h */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Объём 24h ($)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Мин"
                  value={filters.minVolume24h ?? ""}
                  onChange={(e) =>
                    handleFilterChange("minVolume24h", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-1/2"
                />
                <Input
                  type="number"
                  placeholder="Макс"
                  value={filters.maxVolume24h ?? ""}
                  onChange={(e) =>
                    handleFilterChange("maxVolume24h", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-1/2"
                />
              </div>
            </div>

            {/* Изменение цены 24h */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Изменение цены 24h (%)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Мин"
                  step="0.01"
                  value={filters.minPriceChange24h ?? ""}
                  onChange={(e) =>
                    handleFilterChange("minPriceChange24h", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-1/2"
                />
                <Input
                  type="number"
                  placeholder="Макс"
                  step="0.01"
                  value={filters.maxPriceChange24h ?? ""}
                  onChange={(e) =>
                    handleFilterChange("maxPriceChange24h", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-1/2"
                />
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-1/2"
              >
                Сбросить
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="w-1/2"
              >
                Применить
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
