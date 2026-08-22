import { invokeLLM } from "../_core/llm";

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  content: string;
}

export interface SentimentAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  score: number; // -1 to 1
  catalysts: string[];
  summary: string;
  confidence: number; // 0 to 1
}

/**
 * Анализ сентимента новостей с помощью LLM
 */
export async function analyzeSentiment(
  newsItems: NewsItem[]
): Promise<SentimentAnalysis> {
  if (newsItems.length === 0) {
    return {
      sentiment: "neutral",
      score: 0,
      catalysts: [],
      summary: "No news items to analyze",
      confidence: 0,
    };
  }

  const newsText = newsItems
    .map(
      (item) =>
        `Title: ${item.title}\nSource: ${item.source}\nContent: ${item.content}`
    )
    .join("\n\n---\n\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a cryptocurrency market sentiment analyst. Analyze the provided news items and determine:
1. Overall sentiment (positive/neutral/negative)
2. Sentiment score from -1 (very negative) to 1 (very positive)
3. Key catalysts mentioned (partnerships, listings, upgrades, etc.)
4. Brief summary of market implications
5. Confidence level (0-1)

Respond in JSON format with keys: sentiment, score, catalysts (array), summary, confidence`,
        },
        {
          role: "user",
          content: `Analyze these cryptocurrency news items:\n\n${newsText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
              },
              score: { type: "number", minimum: -1, maximum: 1 },
              catalysts: { type: "array", items: { type: "string" } },
              summary: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["sentiment", "score", "catalysts", "summary", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content);
    return {
      sentiment: parsed.sentiment,
      score: parsed.score,
      catalysts: parsed.catalysts,
      summary: parsed.summary,
      confidence: parsed.confidence,
    };
  } catch (error) {
    console.error("Failed to analyze sentiment:", error);
    return {
      sentiment: "neutral",
      score: 0,
      catalysts: [],
      summary: "Analysis failed",
      confidence: 0,
    };
  }
}

/**
 * Определить ключевые события из новостей
 */
export async function extractCatalysts(newsItems: NewsItem[]): Promise<string[]> {
  if (newsItems.length === 0) return [];

  const newsText = newsItems
    .map((item) => `${item.title}: ${item.content}`)
    .join("\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Extract key catalysts from cryptocurrency news. Catalysts include:
- New partnerships or collaborations
- Exchange listings
- Protocol upgrades or technical improvements
- Regulatory news
- Institutional adoption
- Major funding rounds
- Security incidents
- Market events

Return a JSON array of catalyst strings.`,
        },
        {
          role: "user",
          content: `Extract catalysts from:\n\n${newsText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "catalysts",
          strict: true,
          schema: {
            type: "object",
            properties: {
              catalysts: { type: "array", items: { type: "string" } },
            },
            required: ["catalysts"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") return [];

    const parsed = JSON.parse(content);
    return parsed.catalysts || [];
  } catch (error) {
    console.error("Failed to extract catalysts:", error);
    return [];
  }
}

/**
 * Получить сентимент для конкретного актива (mock)
 */
export async function getAssetSentimentScore(_assetTicker: string): Promise<{
  score: number;
  trend: "bullish" | "neutral" | "bearish";
  lastUpdated: Date;
}> {
  // В реальном приложении здесь будет запрос к БД
  // или интеграция с сервисом анализа новостей
  return {
    score: Math.random() * 2 - 1, // -1 to 1
    trend: Math.random() > 0.5 ? "bullish" : "neutral",
    lastUpdated: new Date(),
  };
}
