import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Settings } from "lucide-react";

interface FilterCondition {
  field: string;
  operator: "equals" | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "contains";
  value: any;
  value2?: any;
}

interface FilterBuilderProps {
  onApplyFilters: (conditions: FilterCondition[]) => void;
  onSaveFilter?: (name: string, conditions: FilterCondition[]) => void;
  isLoading?: boolean;
}

const FILTER_FIELDS = [
  { value: "totalScore", label: "CAN SLIM Score" },
  { value: "priceChange24h", label: "24h Price Change %" },
  { value: "cScore", label: "Current Price (C)" },
  { value: "aScore", label: "Annual Growth (A)" },
  { value: "nScore", label: "New Catalysts (N)" },
  { value: "sScore", label: "Supply Dynamics (S)" },
  { value: "lScore", label: "Leader Status (L)" },
  { value: "iScore", label: "Institutional Support (I)" },
  { value: "mScore", label: "Market Direction (M)" },
];

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "gt", label: "Greater than >" },
  { value: "gte", label: "Greater or equal >=" },
  { value: "lt", label: "Less than <" },
  { value: "lte", label: "Less or equal <=" },
  { value: "between", label: "Between" },
  { value: "contains", label: "Contains" },
];

export function FilterBuilder({
  onApplyFilters,
  onSaveFilter,
  isLoading,
}: FilterBuilderProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [filterName, setFilterName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        field: "totalScore",
        operator: "gte",
        value: 70,
      },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    setConditions(updated);
  };

  const handleApply = () => {
    onApplyFilters(conditions);
  };

  const handleSave = () => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter(filterName, conditions);
      setFilterName("");
      setShowSaveForm(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
          </div>
          <Button
            size="sm"
            onClick={addCondition}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Filter
          </Button>
        </div>

        {/* Conditions */}
        {conditions.length > 0 ? (
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={index} className="flex gap-2 items-end p-3 bg-muted rounded-lg">
                {/* Field */}
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">Field</Label>
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, { field: value })}
                  >
                    <SelectTrigger className="h-8 text-sm bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTER_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator */}
                <div className="flex-1 min-w-[120px]">
                  <Label className="text-xs text-muted-foreground">Operator</Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(value: any) => updateCondition(index, { operator: value })}
                  >
                    <SelectTrigger className="h-8 text-sm bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Value */}
                <div className="flex-1 min-w-[100px]">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <Input
                    type="number"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    className="h-8 text-sm bg-background border-border"
                    placeholder="Value"
                  />
                </div>

                {/* Value2 (for between) */}
                {condition.operator === "between" && (
                  <div className="flex-1 min-w-[100px]">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="number"
                      value={condition.value2 || ""}
                      onChange={(e) => updateCondition(index, { value2: e.target.value })}
                      className="h-8 text-sm bg-background border-border"
                      placeholder="Max value"
                    />
                  </div>
                )}

                {/* Delete */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCondition(index)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No filters added. Click "Add Filter" to get started.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleApply}
            disabled={isLoading || conditions.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Applying..." : "Apply Filters"}
          </Button>
          {onSaveFilter && (
            <Button
              onClick={() => setShowSaveForm(!showSaveForm)}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-accent"
            >
              Save Filter
            </Button>
          )}
        </div>

        {/* Save Filter Form */}
        {showSaveForm && onSaveFilter && (
          <div className="p-3 bg-muted rounded-lg space-y-3 border border-border">
            <Label className="text-foreground">Filter Name</Label>
            <Input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="e.g., My High Score Assets"
              className="bg-background border-border text-foreground"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!filterName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Save
              </Button>
              <Button
                onClick={() => setShowSaveForm(false)}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-accent"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
