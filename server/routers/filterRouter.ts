import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// Filter types
export interface FilterCondition {
  field: string;
  operator: "equals" | "gt" | "gte" | "lt" | "lte" | "between" | "in" | "contains";
  value: any;
  value2?: any; // For "between" operator
}

export interface SavedFilter {
  id: string;
  userId: number;
  name: string;
  description?: string;
  conditions: FilterCondition[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock storage for filters
const savedFilters: Map<string, SavedFilter> = new Map();

export const filterRouter = router({
  /**
   * Get all available filter presets
   */
  getPresets: publicProcedure.query(async () => {
    return [
      {
        id: "high_score",
        name: "High Score Assets",
        description: "Assets with CAN SLIM score > 80",
        conditions: [{ field: "totalScore", operator: "gt", value: 80 }],
      },
      {
        id: "bullish_trend",
        name: "Bullish Trend",
        description: "Assets with positive 24h change and score > 70",
        conditions: [
          { field: "priceChange24h", operator: "gt", value: 0 },
          { field: "totalScore", operator: "gt", value: 70 },
        ],
      },
      {
        id: "new_catalysts",
        name: "New Catalysts",
        description: "Assets with high N score (New Catalysts)",
        conditions: [{ field: "nScore", operator: "gt", value: 75 }],
      },
      {
        id: "strong_supply",
        name: "Strong Supply Dynamics",
        description: "Assets with S score > 75",
        conditions: [{ field: "sScore", operator: "gt", value: 75 }],
      },
      {
        id: "institutional_support",
        name: "Institutional Support",
        description: "Assets with I score > 75",
        conditions: [{ field: "iScore", operator: "gt", value: 75 }],
      },
      {
        id: "market_leaders",
        name: "Market Leaders",
        description: "Top performers: score > 85, positive change",
        conditions: [
          { field: "totalScore", operator: "gt", value: 85 },
          { field: "priceChange24h", operator: "gt", value: 0 },
        ],
      },
    ];
  }),

  /**
   * Get user's saved filters
   */
  getSavedFilters: protectedProcedure.query(async ({ ctx }) => {
    const userFilters = Array.from(savedFilters.values()).filter(
      (f) => f.userId === ctx.user.id || f.isPublic
    );
    return userFilters;
  }),

  /**
   * Get a specific saved filter
   */
  getSavedFilter: publicProcedure
    .input((val: any) => ({
      id: val.id as string,
    }))
    .query(async ({ input }) => {
      const filter = savedFilters.get(input.id);
      if (!filter) return null;
      return filter;
    }),

  /**
   * Create a new saved filter
   */
  createSavedFilter: protectedProcedure
    .input((val: any) => ({
      name: val.name as string,
      description: val.description as string | undefined,
      conditions: val.conditions as FilterCondition[],
      isPublic: val.isPublic as boolean | undefined,
    }))
    .mutation(async ({ ctx, input }) => {
      const id = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filter: SavedFilter = {
        id,
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        conditions: input.conditions,
        isPublic: input.isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      savedFilters.set(id, filter);
      return filter;
    }),

  /**
   * Update a saved filter
   */
  updateSavedFilter: protectedProcedure
    .input((val: any) => ({
      id: val.id as string,
      name: val.name as string | undefined,
      description: val.description as string | undefined,
      conditions: val.conditions as FilterCondition[] | undefined,
      isPublic: val.isPublic as boolean | undefined,
    }))
    .mutation(async ({ ctx, input }) => {
      const filter = savedFilters.get(input.id);
      if (!filter || filter.userId !== ctx.user.id) {
        throw new Error("Filter not found or unauthorized");
      }

      if (input.name !== undefined) filter.name = input.name;
      if (input.description !== undefined) filter.description = input.description;
      if (input.conditions !== undefined) filter.conditions = input.conditions;
      if (input.isPublic !== undefined) filter.isPublic = input.isPublic;
      filter.updatedAt = new Date();

      savedFilters.set(input.id, filter);
      return filter;
    }),

  /**
   * Delete a saved filter
   */
  deleteSavedFilter: protectedProcedure
    .input((val: any) => ({
      id: val.id as string,
    }))
    .mutation(async ({ ctx, input }) => {
      const filter = savedFilters.get(input.id);
      if (!filter || filter.userId !== ctx.user.id) {
        throw new Error("Filter not found or unauthorized");
      }

      savedFilters.delete(input.id);
      return { success: true };
    }),

  /**
   * Apply filters to assets (mock implementation)
   */
  applyFilters: publicProcedure
    .input((val: any) => ({
      conditions: val.conditions as FilterCondition[],
      assets: val.assets as any[],
    }))
    .query(async ({ input }) => {
      // Mock filter application
      let filtered = input.assets;

      for (const condition of input.conditions) {
        filtered = filtered.filter((asset: any) => {
          const value = asset[condition.field];
          if (value === undefined) return false;

          switch (condition.operator) {
            case "equals":
              return value === condition.value;
            case "gt":
              return value > condition.value;
            case "gte":
              return value >= condition.value;
            case "lt":
              return value < condition.value;
            case "lte":
              return value <= condition.value;
            case "between":
              return value >= condition.value && value <= condition.value2;
            case "in":
              return Array.isArray(condition.value) && condition.value.includes(value);
            case "contains":
              return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
            default:
              return true;
          }
        });
      }

      return filtered;
    }),

  /**
   * Get filter suggestions based on current assets
   */
  getSuggestions: publicProcedure
    .input((val: any) => ({
      assets: val.assets as any[],
    }))
    .query(async ({ input }) => {
      if (input.assets.length === 0) return [];

      // Calculate statistics
      const scores = input.assets.map((a: any) => a.totalScore).filter((s: any) => s);
      const prices = input.assets.map((a: any) => a.priceChange24h).filter((p: any) => p !== undefined);

      const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b) / scores.length : 0;
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const _avgChange = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b) / prices.length : 0;

      return [
        {
          name: `Above Average Score (${Math.round(avgScore)})`,
          conditions: [{ field: "totalScore", operator: "gte", value: Math.round(avgScore) }],
        },
        {
          name: `High Performers (${Math.round(maxScore * 0.8)})`,
          conditions: [{ field: "totalScore", operator: "gte", value: Math.round(maxScore * 0.8) }],
        },
        {
          name: `Positive Momentum`,
          conditions: [{ field: "priceChange24h", operator: "gt", value: 0 }],
        },
        {
          name: `Strong Growth (>10%)`,
          conditions: [{ field: "priceChange24h", operator: "gt", value: 1000 }], // 1000 basis points = 10%
        },
      ];
    }),
});
