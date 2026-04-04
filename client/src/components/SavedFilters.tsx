import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Share2, Lock, BookmarkIcon } from "lucide-react";

interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  conditions: any[];
  isPublic: boolean;
  createdAt: Date;
}

interface SavedFiltersProps {
  filters: SavedFilter[];
  onSelectFilter: (filter: SavedFilter) => void;
  onDeleteFilter: (id: string) => void;
  onEditFilter?: (filter: SavedFilter) => void;
  onShareFilter?: (id: string) => void;
  isLoading?: boolean;
}

export function SavedFilters({
  filters,
  onSelectFilter,
  onDeleteFilter,
  onEditFilter,
  onShareFilter,
  isLoading,
}: SavedFiltersProps) {
  if (filters.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border">
        <BookmarkIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-foreground font-medium">No saved filters</p>
        <p className="text-muted-foreground text-sm">
          Create and save filters to quickly access your favorite searches
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Saved Filters</h3>

        <div className="space-y-2">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-start justify-between gap-3 p-3 bg-muted rounded-lg hover:bg-accent transition-colors"
            >
              {/* Filter Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground truncate">{filter.name}</h4>
                  {filter.isPublic && (
                    <Badge variant="secondary" className="text-xs">
                      <Share2 className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  )}
                  {!filter.isPublic && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                {filter.description && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {filter.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {filter.conditions.length} condition{filter.conditions.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectFilter(filter)}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700"
                  title="Apply filter"
                >
                  Apply
                </Button>
                {onEditFilter && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditFilter(filter)}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-foreground"
                    title="Edit filter"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
                {onShareFilter && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onShareFilter(filter.id)}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-foreground"
                    title="Share filter"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteFilter(filter.id)}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive/80"
                  title="Delete filter"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
