import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, Zap } from "lucide-react";

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  conditions: any[];
}

interface FilterPresetsProps {
  presets: FilterPreset[];
  onSelectPreset: (preset: FilterPreset) => void;
  selectedPresetId?: string;
  isLoading?: boolean;
}

export function FilterPresets({
  presets,
  onSelectPreset,
  selectedPresetId,
  isLoading,
}: FilterPresetsProps) {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">Quick Filters</h3>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedPresetId === preset.id ? "default" : "outline"}
              onClick={() => onSelectPreset(preset)}
              disabled={isLoading}
              className="h-auto flex-col items-start justify-start p-3 text-left"
            >
              <div className="flex items-center gap-2 w-full">
                <Zap className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">{preset.name}</span>
              </div>
              {preset.description && (
                <span className="text-xs opacity-75 mt-1 line-clamp-2">
                  {preset.description}
                </span>
              )}
              {preset.conditions.length > 0 && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {preset.conditions.length} condition{preset.conditions.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
