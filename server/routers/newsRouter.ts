import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  getAllNews,
  getNewsByAsset,
  getCoinTelegraphNews,
  getTheBlockNews,
} from "../services/rssService";
import { analyzeSentiment, extractCatalysts } from "../services/sentimentService";

export const newsRouter = router({
  all: publicProcedure.query(async () => {
    try {
      const news = await getAllNews();
      return {
        success: true,
        data: news,
        count: news.length,
      };
    } catch (error) {
      console.error("[News] Error fetching all news:", error);
      return {
        success: false,
        data: [],
        count: 0,
        error: "Failed to fetch news",
      };
    }
  }),

  byAsset: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        name: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const news = await getNewsByAsset(input.ticker, input.name);
        return {
          success: true,
          data: news,
          count: news.length,
        };
      } catch (error) {
        console.error(`[News] Error fetching news for ${input.ticker}:`, error);
        return {
          success: false,
          data: [],
          count: 0,
          error: `Failed to fetch news for ${input.ticker}`,
        };
      }
    }),

  cointelegraph: publicProcedure.query(async () => {
    try {
      const news = await getCoinTelegraphNews();
      return {
        success: true,
        data: news,
        count: news.length,
      };
    } catch (error) {
      console.error("[News] Error fetching CoinTelegraph news:", error);
      return {
        success: false,
        data: [],
        count: 0,
        error: "Failed to fetch CoinTelegraph news",
      };
    }
  }),

  theblock: publicProcedure.query(async () => {
    try {
      const news = await getTheBlockNews();
      return {
        success: true,
        data: news,
        count: news.length,
      };
    } catch (error) {
      console.error("[News] Error fetching The Block news:", error);
      return {
        success: false,
        data: [],
        count: 0,
        error: "Failed to fetch The Block news",
      };
    }
  }),

  analyzeWithSentiment: publicProcedure
    .input(
      z.object({
        ticker: z.string(),
        name: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Получить новости по активу
        const news = await getNewsByAsset(input.ticker, input.name);

        if (news.length === 0) {
          return {
            success: true,
            data: [],
            analysis: null,
            count: 0,
          };
        }

        // Преобразовать новости в формат для анализа сентимента
        const newsForAnalysis = news.map((item) => ({
          title: item.title,
          source: item.source,
          url: item.link,
          publishedAt: new Date(item.pubDate),
          sentiment: "neutral" as const,
          score: 0,
          catalysts: [],
          summary: item.description,
          content: item.content || item.description,
        }));

        // Анализировать сентимент
        const sentiment = await analyzeSentiment(newsForAnalysis as any);
        const catalysts = await extractCatalysts(newsForAnalysis as any);

        // Обогатить новости анализом
        const enrichedNews = news.map((item) => ({
          ...item,
          sentiment: sentiment?.sentiment || "neutral",
          score: sentiment?.score || 0,
          catalysts: catalysts || [],
          confidence: sentiment?.confidence || 0,
        }));

        return {
          success: true,
          data: enrichedNews,
          analysis: {
            sentiment: sentiment?.sentiment || "neutral",
            score: sentiment?.score || 0,
            catalysts: catalysts || [],
            summary: sentiment?.summary || "",
            confidence: sentiment?.confidence || 0,
          },
          count: enrichedNews.length,
        };
      } catch (error) {
        console.error(
          `[News] Error analyzing news for ${input.ticker}:`,
          error
        );
        return {
          success: false,
          data: [],
          analysis: null,
          count: 0,
          error: `Failed to analyze news for ${input.ticker}`,
        };
      }
    }),
});
