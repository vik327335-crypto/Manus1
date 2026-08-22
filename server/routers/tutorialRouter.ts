import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tutorials as _tutorials, tutorialSteps as _tutorialSteps, tutorialProgress as _tutorialProgress } from "../../drizzle/schema";

export const tutorialRouter = router({
  /**
   * Получает список всех доступных туториалов
   */
  getTutorials: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      })
    )
    .query(async ({ input: _input }) => {
      // TODO: Implement when db.query is available
      return [];
    }),

  /**
   * Получает детали туториала с шагами
   */
  getTutorialDetail: publicProcedure
    .input(z.object({ tutorialId: z.number() }))
    .query(async ({ input: _input }) => {
      // TODO: Implement when db.query is available
      return null;
    }),

  /**
   * Получает шаги туториала
   */
  getTutorialSteps: publicProcedure
    .input(z.object({ tutorialId: z.number() }))
    .query(async ({ input: _input }) => {
      // TODO: Implement when db.query is available
      return [];
    }),

  /**
   * Начинает туториал для пользователя
   */
  startTutorial: protectedProcedure
    .input(z.object({ tutorialId: z.number() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // TODO: Implement when db.insert is available
        return { success: true, progressId: 0 };
      } catch (error) {
        console.error("Start tutorial error:", error);
        throw new Error("Failed to start tutorial");
      }
    }),

  /**
   * Обновляет прогресс туториала
   */
  updateTutorialProgress: protectedProcedure
    .input(
      z.object({
        progressId: z.number(),
        currentStep: z.number(),
        completedSteps: z.number(),
      })
    )
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      // TODO: Implement when db.update is available
      return { success: true };
    }),

  /**
   * Завершает туториал
   */
  completeTutorial: protectedProcedure
    .input(z.object({ progressId: z.number() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      // TODO: Implement when db.update is available
      return { success: true };
    }),

  /**
   * Получает прогресс пользователя по туториалам
   */
  getUserTutorialProgress: protectedProcedure.query(async ({ ctx: _ctx }) => {
    // TODO: Implement when db.query is available
    return [];
  }),

  /**
   * Получает рекомендуемые туториалы для нового пользователя
   */
  getRecommendedTutorials: protectedProcedure.query(async ({ ctx: _ctx }) => {
    // TODO: Implement when db.query is available
    return [];
  }),

  /**
   * Пропускает туториал
   */
  skipTutorial: protectedProcedure
    .input(z.object({ progressId: z.number() }))
    .mutation(async ({ input: _input, ctx: _ctx }) => {
      // TODO: Implement when db.delete is available
      return { success: true };
    }),
});
