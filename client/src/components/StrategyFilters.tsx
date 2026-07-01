import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';

interface StrategyFiltersProps {
  strategies: Array<{ id: string; name: string }>;
  selectedStrategies: string[];
  onStrategySelect: (strategy: string) => void;
  onStrategyRemove: (strategy: string) => void;
  onClearAll: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'name' | 'roi' | 'winRate' | 'sharpeRatio';
  onSortChange: (sort: 'name' | 'roi' | 'winRate' | 'sharpeRatio') => void;
}

export function StrategyFilters({
  strategies,
  selectedStrategies,
  onStrategySelect,
  onStrategyRemove,
  onClearAll,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
}: StrategyFiltersProps) {
  const filteredStrategies = strategies.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unselectedStrategies = filteredStrategies.filter(
    (s) => !selectedStrategies.includes(s.name)
  );

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Поиск стратегий</label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Введите название стратегии..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Сортировка</label>
        <Select value={sortBy} onValueChange={(value: any) => onSortChange(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">По названию</SelectItem>
            <SelectItem value="roi">По ROI</SelectItem>
            <SelectItem value="winRate">По Win Rate</SelectItem>
            <SelectItem value="sharpeRatio">По Sharpe Ratio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Strategies */}
      {selectedStrategies.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Выбранные стратегии ({selectedStrategies.length})</label>
            {selectedStrategies.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs"
              >
                Очистить
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedStrategies.map((strategy) => (
              <Badge key={strategy} variant="secondary" className="flex items-center gap-1">
                {strategy}
                <button
                  onClick={() => onStrategyRemove(strategy)}
                  className="ml-1 hover:bg-gray-300 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available Strategies */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Доступные стратегии ({unselectedStrategies.length})
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {unselectedStrategies.map((strategy) => (
            <Button
              key={strategy.id}
              variant="outline"
              size="sm"
              onClick={() => onStrategySelect(strategy.name)}
              className="justify-start text-left"
            >
              + {strategy.name}
            </Button>
          ))}
        </div>
        {unselectedStrategies.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            {searchTerm ? 'Стратегии не найдены' : 'Все стратегии выбраны'}
          </p>
        )}
      </div>
    </div>
  );
}
