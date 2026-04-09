import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, RotateCcw } from "lucide-react";

export interface FilterCriteria {
  priceMin: number | null;
  priceMax: number | null;
  marketCapMin: number | null;
  marketCapMax: number | null;
  volumeMin: number | null;
  volumeMax: number | null;
  changeMin: number | null;
  changeMax: number | null;
  canSlimScoreMin: number | null;
  preset?: "topGainers" | "topLosers" | "highVolume" | null;
}

interface AdvancedFiltersProps {
  onApply: (filters: FilterCriteria) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const FILTER_PRESETS = {
  topGainers: {
    label: "Top Gainers",
    filters: { changeMin: 5, changeMax: null, priceMin: null, priceMax: null, marketCapMin: null, marketCapMax: null, volumeMin: null, volumeMax: null, canSlimScoreMin: null },
  },
  topLosers: {
    label: "Top Losers",
    filters: { changeMin: null, changeMax: -5, priceMin: null, priceMax: null, marketCapMin: null, marketCapMax: null, volumeMin: null, volumeMax: null, canSlimScoreMin: null },
  },
  highVolume: {
    label: "High Volume",
    filters: { volumeMin: 1000000000, volumeMax: null, priceMin: null, priceMax: null, marketCapMin: null, marketCapMax: null, changeMin: null, changeMax: null, canSlimScoreMin: null },
  },
};

export function AdvancedFilters({ onApply, onReset, isLoading }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    priceMin: null,
    priceMax: null,
    marketCapMin: null,
    marketCapMax: null,
    volumeMin: null,
    volumeMax: null,
    changeMin: null,
    changeMax: null,
    canSlimScoreMin: null,
    preset: null,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof FilterCriteria, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setFilters((prev) => ({
      ...prev,
      [field]: isNaN(numValue as number) ? null : numValue,
    }));
  };

  const handlePresetSelect = (presetKey: keyof typeof FILTER_PRESETS) => {
    const preset = FILTER_PRESETS[presetKey];
    setFilters((prev) => ({
      ...preset.filters,
      preset: presetKey,
    }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({
      priceMin: null,
      priceMax: null,
      marketCapMin: null,
      marketCapMax: null,
      volumeMin: null,
      volumeMax: null,
      changeMin: null,
      changeMax: null,
      canSlimScoreMin: null,
      preset: null,
    });
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== null && v !== undefined && v !== ""
  );

  return (
    <Card className="card-elevated p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Advanced Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? <X className="h-5 w-5" /> : <span>▼</span>}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Filter Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={filters.preset === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetSelect(key as keyof typeof FILTER_PRESETS)}
                  className="w-full"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priceMin" className="text-xs font-medium">
                Min Price
              </Label>
              <Input
                id="priceMin"
                type="number"
                placeholder="0"
                value={filters.priceMin ?? ""}
                onChange={(e) => handleInputChange("priceMin", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="priceMax" className="text-xs font-medium">
                Max Price
              </Label>
              <Input
                id="priceMax"
                type="number"
                placeholder="∞"
                value={filters.priceMax ?? ""}
                onChange={(e) => handleInputChange("priceMax", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Market Cap Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marketCapMin" className="text-xs font-medium">
                Min Market Cap (B)
              </Label>
              <Input
                id="marketCapMin"
                type="number"
                placeholder="0"
                value={filters.marketCapMin ?? ""}
                onChange={(e) => handleInputChange("marketCapMin", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="marketCapMax" className="text-xs font-medium">
                Max Market Cap (B)
              </Label>
              <Input
                id="marketCapMax"
                type="number"
                placeholder="∞"
                value={filters.marketCapMax ?? ""}
                onChange={(e) => handleInputChange("marketCapMax", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Volume Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volumeMin" className="text-xs font-medium">
                Min Volume (24h)
              </Label>
              <Input
                id="volumeMin"
                type="number"
                placeholder="0"
                value={filters.volumeMin ?? ""}
                onChange={(e) => handleInputChange("volumeMin", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="volumeMax" className="text-xs font-medium">
                Max Volume (24h)
              </Label>
              <Input
                id="volumeMax"
                type="number"
                placeholder="∞"
                value={filters.volumeMax ?? ""}
                onChange={(e) => handleInputChange("volumeMax", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Price Change Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="changeMin" className="text-xs font-medium">
                Min Change (%)
              </Label>
              <Input
                id="changeMin"
                type="number"
                placeholder="-∞"
                value={filters.changeMin ?? ""}
                onChange={(e) => handleInputChange("changeMin", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="changeMax" className="text-xs font-medium">
                Max Change (%)
              </Label>
              <Input
                id="changeMax"
                type="number"
                placeholder="∞"
                value={filters.changeMax ?? ""}
                onChange={(e) => handleInputChange("changeMax", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* CAN SLIM Score */}
          <div>
            <Label htmlFor="canSlimScoreMin" className="text-xs font-medium">
              Min CAN SLIM Score
            </Label>
            <Input
              id="canSlimScoreMin"
              type="number"
              placeholder="0"
              min="0"
              max="100"
              value={filters.canSlimScoreMin ?? ""}
              onChange={(e) => handleInputChange("canSlimScoreMin", e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleApply}
              disabled={isLoading}
              className="flex-1"
            >
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
