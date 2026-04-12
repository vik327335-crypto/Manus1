import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchResult {
  id: number;
  ticker: string;
  name: string;
  category?: string;
  score?: number;
}

interface SearchBarProps {
  items: SearchResult[];
  onSearch: (results: SearchResult[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * SearchBar компонент с полнотекстовым поиском
 * Поддерживает поиск по тикеру, названию и категории
 */
export function SearchBar({
  items,
  onSearch,
  placeholder = "Поиск криптовалют...",
  className,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Фильтрация результатов поиска
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    return items.filter((item) => {
      const tickerMatch = item.ticker.toLowerCase().includes(term);
      const nameMatch = item.name.toLowerCase().includes(term);
      const categoryMatch = item.category?.toLowerCase().includes(term);

      return tickerMatch || nameMatch || categoryMatch;
    });
  }, [searchTerm, items]);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      setIsOpen(true);

      if (value.trim()) {
        const term = value.toLowerCase();
        const results = items.filter((item) => {
          const tickerMatch = item.ticker.toLowerCase().includes(term);
          const nameMatch = item.name.toLowerCase().includes(term);
          const categoryMatch = item.category?.toLowerCase().includes(term);

          return tickerMatch || nameMatch || categoryMatch;
        });
        onSearch(results);
      } else {
        onSearch(items);
      }
    },
    [items, onSearch]
  );

  const handleSelectResult = (item: SearchResult) => {
    setSearchTerm(item.ticker);
    onSearch([item]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch(items);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearch}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Выпадающий список результатов */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {searchResults.slice(0, 10).map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelectResult(result)}
              className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between border-b last:border-b-0"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{result.ticker}</span>
                <span className="text-sm text-muted-foreground">{result.name}</span>
              </div>
              {result.score !== undefined && (
                <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded">
                  {result.score}
                </span>
              )}
            </button>
          ))}
          {searchResults.length > 10 && (
            <div className="px-4 py-2 text-sm text-muted-foreground text-center border-t">
              Показано 10 из {searchResults.length} результатов
            </div>
          )}
        </div>
      )}

      {/* Сообщение о пустом результате */}
      {isOpen && searchTerm && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50 p-4 text-center text-muted-foreground">
          Ничего не найдено по запросу "{searchTerm}"
        </div>
      )}
    </div>
  );
}
