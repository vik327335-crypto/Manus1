import { useState } from "react";
import { Trash2, Copy, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: {
    search?: string;
    scoreMin?: number;
    scoreMax?: number;
    marketCapMin?: number;
    marketCapMax?: number;
    volumeMin?: number;
    priceChangeMin?: number;
  };
  createdAt: Date;
  isFavorite: boolean;
  usageCount: number;
}

interface SavedFiltersUIProps {
  filters: SavedFilter[];
  onApply: (filter: SavedFilter) => void;
  onDelete: (filterId: string) => void;
  onToggleFavorite: (filterId: string) => void;
  onDuplicate: (filter: SavedFilter) => void;
  isLoading?: boolean;
}

/**
 * UI компонент для отображения и управления сохранёнными фильтрами
 */
export function SavedFiltersUI({
  filters,
  onApply,
  onDelete,
  onToggleFavorite,
  onDuplicate,
  isLoading = false,
}: SavedFiltersUIProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "favorite" | "usage">("recent");

  const favorites = filters.filter((f) => f.isFavorite);
  const recent = filters.filter((f) => !f.isFavorite);

  const filteredFavorites = favorites.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecent = recent.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRecent =
    sortBy === "recent"
      ? filteredRecent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : sortBy === "usage"
      ? filteredRecent.sort((a, b) => b.usageCount - a.usageCount)
      : filteredRecent;

  return (
    <div className="space-y-6">
      {/* Заголовок и поиск */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Сохранённые фильтры</h2>
          <p className="text-muted-foreground">
            {filters.length} фильтров сохранено • {favorites.length} избранных
          </p>
        </div>

        {/* Поиск и сортировка */}
        <div className="flex gap-3">
          <Input
            placeholder="Поиск фильтров..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Сортировка
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("recent")}>
                По дате (новые)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("usage")}>
                По использованию
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("favorite")}>
                Избранные
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Избранные фильтры */}
      {filteredFavorites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            Избранные ({filteredFavorites.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFavorites.map((filter) => (
              <FilterCard
                key={filter.id}
                filter={filter}
                onApply={() => onApply(filter)}
                onDelete={() => onDelete(filter.id)}
                onToggleFavorite={() => onToggleFavorite(filter.id)}
                onDuplicate={() => onDuplicate(filter)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Недавние фильтры */}
      {filteredRecent.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            Недавние ({filteredRecent.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedRecent.map((filter) => (
              <FilterCard
                key={filter.id}
                filter={filter}
                onApply={() => onApply(filter)}
                onDelete={() => onDelete(filter.id)}
                onToggleFavorite={() => onToggleFavorite(filter.id)}
                onDuplicate={() => onDuplicate(filter)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {filters.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground mb-4">Нет сохранённых фильтров</p>
            <p className="text-sm text-muted-foreground">
              Создайте фильтр и сохраните его для быстрого доступа
            </p>
          </CardContent>
        </Card>
      )}

      {/* Пустой результат поиска */}
      {filters.length > 0 && filteredFavorites.length === 0 && filteredRecent.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-8 text-center">
            <p className="text-muted-foreground">
              Фильтры не найдены по запросу "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FilterCardProps {
  filter: SavedFilter;
  onApply: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
}

/**
 * Карточка сохранённого фильтра
 */
function FilterCard({
  filter,
  onApply,
  onDelete,
  onToggleFavorite,
  onDuplicate,
}: FilterCardProps) {
  const filterTags = Object.entries(filter.filters)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (key === "search") return `Поиск: ${value}`;
      if (key === "scoreMin") return `Score ≥ ${value}`;
      if (key === "scoreMax") return `Score ≤ ${value}`;
      if (key === "marketCapMin") return `Cap ≥ $${(value as number).toLocaleString()}`;
      if (key === "marketCapMax") return `Cap ≤ $${(value as number).toLocaleString()}`;
      if (key === "volumeMin") return `Vol ≥ $${(value as number).toLocaleString()}`;
      if (key === "priceChangeMin") return `Change ≥ ${value}%`;
      return null;
    })
    .filter(Boolean);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{filter.name}</CardTitle>
            {filter.description && (
              <CardDescription className="line-clamp-2">
                {filter.description}
              </CardDescription>
            )}
          </div>
          <button
            onClick={onToggleFavorite}
            className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
            aria-label={filter.isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                filter.isFavorite
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground hover:text-yellow-400"
              )}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Теги фильтров */}
        {filterTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filterTags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {filterTags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{filterTags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Метаинформация */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Создано: {new Date(filter.createdAt).toLocaleDateString("ru-RU")}</p>
          <p>Использовано: {filter.usageCount} раз</p>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button
            onClick={onApply}
            size="sm"
            className="flex-1"
          >
            Применить
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Дублировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Компонент для сохранения нового фильтра
 */
export function SaveFilterDialog({
  filters,
  onSave,
  defaultName = "",
}: {
  filters: Record<string, any>;
  onSave: (name: string, description: string) => void;
  defaultName?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSave(name, description);
      setName("");
      setDescription("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сохранить фильтр</CardTitle>
        <CardDescription>
          Дайте имя и описание вашему фильтру
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Имя фильтра *</label>
          <Input
            placeholder="Например: Высокие gainers"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Описание (опционально)</label>
          <Input
            placeholder="Описание фильтра..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="bg-muted p-3 rounded text-sm">
          <p className="font-medium mb-2">Активные фильтры:</p>
          <div className="space-y-1 text-muted-foreground">
            {Object.entries(filters)
              .filter(([, v]) => v !== undefined && v !== null)
              .map(([k, v]) => (
                <p key={k}>• {k}: {String(v)}</p>
              ))}
          </div>
        </div>
        <Button onClick={handleSave} disabled={!name.trim()} className="w-full">
          Сохранить фильтр
        </Button>
      </CardContent>
    </Card>
  );
}
