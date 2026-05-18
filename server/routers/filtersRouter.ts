import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

/**
 * Схема для валидации сохранённого фильтра
 */
const SavedFilterSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: z.record(z.string(), z.any()).optional(),
  isFavorite: z.boolean().default(false),
});

// Mock база данных для демонстрации
const mockFiltersDB = new Map<string, any>();

/**
 * tRPC роутер для управления сохранёнными фильтрами
 */
export const filtersRouter = router({
  /**
   * Получить все сохранённые фильтры пользователя
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userFilters = Array.from(mockFiltersDB.values())
        .filter((f: any) => f.userId === ctx.user.id)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return userFilters.map((f: any) => ({
        id: f.id,
        name: f.name,
        description: f.description || undefined,
        filters: f.filters || {},
        createdAt: f.createdAt,
        isFavorite: f.isFavorite,
        usageCount: f.usageCount,
      }));
    } catch (error) {
      console.error("Error fetching saved filters:", error);
      throw new Error("Failed to fetch saved filters");
    }
  }),

  /**
   * Получить избранные фильтры
   */
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const favorites = Array.from(mockFiltersDB.values())
        .filter((f: any) => f.userId === ctx.user.id && f.isFavorite)
        .sort((a: any, b: any) => b.usageCount - a.usageCount);

      return favorites.map((f: any) => ({
        id: f.id,
        name: f.name,
        description: f.description || undefined,
        filters: f.filters || {},
        createdAt: f.createdAt,
        isFavorite: f.isFavorite,
        usageCount: f.usageCount,
      }));
    } catch (error) {
      console.error("Error fetching favorite filters:", error);
      throw new Error("Failed to fetch favorite filters");
    }
  }),

  /**
   * Получить фильтр по ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const filter = mockFiltersDB.get(input.id);

        if (!filter || filter.userId !== ctx.user.id) {
          throw new Error("Filter not found");
        }

        return {
          id: filter.id,
          name: filter.name,
          description: filter.description || undefined,
          filters: filter.filters || {},
          createdAt: filter.createdAt,
          isFavorite: filter.isFavorite,
          usageCount: filter.usageCount,
        };
      } catch (error) {
        console.error("Error fetching filter:", error);
        throw new Error("Failed to fetch filter");
      }
    }),

  /**
   * Создать новый сохранённый фильтр
   */
  create: protectedProcedure
    .input(SavedFilterSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const id = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        const newFilter = {
          id,
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          filters: input.filters || {},
          isFavorite: input.isFavorite,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        mockFiltersDB.set(id, newFilter);

        return {
          id,
          name: input.name,
          description: input.description,
          filters: input.filters || {},
          createdAt: now,
          isFavorite: input.isFavorite,
          usageCount: 0,
        };
      } catch (error) {
        console.error("Error creating filter:", error);
        throw new Error("Failed to create filter");
      }
    }),

  /**
   * Обновить сохранённый фильтр
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...SavedFilterSchema.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        const filter = mockFiltersDB.get(id);

        if (!filter || filter.userId !== ctx.user.id) {
          throw new Error("Filter not found");
        }

        const updatedFilter = {
          ...filter,
          name: updateData.name,
          description: updateData.description,
          filters: updateData.filters || {},
          isFavorite: updateData.isFavorite,
          updatedAt: new Date(),
        };

        mockFiltersDB.set(id, updatedFilter);

        return {
          id,
          name: updateData.name,
          description: updateData.description,
          filters: updateData.filters || {},
          createdAt: filter.createdAt,
          isFavorite: updateData.isFavorite,
          usageCount: filter.usageCount,
        };
      } catch (error) {
        console.error("Error updating filter:", error);
        throw new Error("Failed to update filter");
      }
    }),

  /**
   * Удалить сохранённый фильтр
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const filter = mockFiltersDB.get(input.id);

        if (!filter || filter.userId !== ctx.user.id) {
          throw new Error("Filter not found");
        }

        mockFiltersDB.delete(input.id);

        return { success: true };
      } catch (error) {
        console.error("Error deleting filter:", error);
        throw new Error("Failed to delete filter");
      }
    }),

  /**
   * Переключить избранное состояние фильтра
   */
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const filter = mockFiltersDB.get(input.id);

        if (!filter || filter.userId !== ctx.user.id) {
          throw new Error("Filter not found");
        }

        const newFavoriteState = !filter.isFavorite;

        mockFiltersDB.set(input.id, {
          ...filter,
          isFavorite: newFavoriteState,
          updatedAt: new Date(),
        });

        return { isFavorite: newFavoriteState };
      } catch (error) {
        console.error("Error toggling favorite:", error);
        throw new Error("Failed to toggle favorite");
      }
    }),

  /**
   * Увеличить счётчик использования фильтра
   */
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const filter = mockFiltersDB.get(input.id);

        if (!filter || filter.userId !== ctx.user.id) {
          throw new Error("Filter not found");
        }

        mockFiltersDB.set(input.id, {
          ...filter,
          usageCount: filter.usageCount + 1,
          updatedAt: new Date(),
        });

        return { usageCount: filter.usageCount + 1 };
      } catch (error) {
        console.error("Error incrementing usage:", error);
        throw new Error("Failed to increment usage");
      }
    }),

  /**
   * Дублировать фильтр
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string(), newName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const filter = mockFiltersDB.get(input.id);

        if (!filter || filter.userId !== ctx.user.id) {
          throw new Error("Filter not found");
        }

        const newId = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        const newFilter = {
          id: newId,
          userId: ctx.user.id,
          name: input.newName,
          description: filter.description,
          filters: filter.filters,
          isFavorite: false,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        mockFiltersDB.set(newId, newFilter);

        return {
          id: newId,
          name: input.newName,
          description: filter.description,
          filters: filter.filters || {},
          createdAt: now,
          isFavorite: false,
          usageCount: 0,
        };
      } catch (error) {
        console.error("Error duplicating filter:", error);
        throw new Error("Failed to duplicate filter");
      }
    }),

  /**
   * Поиск фильтров по названию
   */
  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const results = Array.from(mockFiltersDB.values())
          .filter((f: any) => f.userId === ctx.user.id)
          .filter((f: any) =>
            f.name.toLowerCase().includes(input.query.toLowerCase())
          )
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return results.map((f: any) => ({
          id: f.id,
          name: f.name,
          description: f.description || undefined,
          filters: f.filters || {},
          createdAt: f.createdAt,
          isFavorite: f.isFavorite,
          usageCount: f.usageCount,
        }));
      } catch (error) {
        console.error("Error searching filters:", error);
        throw new Error("Failed to search filters");
      }
    }),
});
