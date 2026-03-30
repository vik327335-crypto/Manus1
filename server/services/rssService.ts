import Parser from "rss-parser";
import axios from "axios";

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  content?: string;
  image?: string;
}

// RSS feed URLs
const RSS_FEEDS = {
  cointelegraph: "https://cointelegraph.com/feed",
  theblock: "https://feeds.theblockcrypto.com/feed",
};

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "content"],
      ["media:content", "image"],
    ],
  },
});

// Cache для RSS фидов (10 минут)
const feedCache: Map<string, { data: NewsItem[]; timestamp: number }> = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

async function getCachedOrFetch(
  key: string,
  fetchFn: () => Promise<NewsItem[]>
): Promise<NewsItem[]> {
  const cached = feedCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFn();
  feedCache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Получить новости с CoinTelegraph
 */
export async function getCoinTelegraphNews(): Promise<NewsItem[]> {
  return getCachedOrFetch("cointelegraph", async () => {
    try {
      const feed = await parser.parseURL(RSS_FEEDS.cointelegraph);
      return (feed.items || [])
        .slice(0, 20) // Берем последние 20 новостей
        .map((item, idx) => ({
          id: `ct-${idx}-${Date.now()}`,
          title: item.title || "Untitled",
          description: item.contentSnippet || (item as any).summary || "",
          link: item.link || "",
          pubDate: item.pubDate || new Date().toISOString(),
          source: "CoinTelegraph",
          content: (item as any).content || (item as any).description || "",
        }));
    } catch (error) {
      console.error("[RSS] Error fetching CoinTelegraph feed:", error);
      return [];
    }
  });
}

/**
 * Получить новости с The Block
 */
export async function getTheBlockNews(): Promise<NewsItem[]> {
  return getCachedOrFetch("theblock", async () => {
    try {
      const feed = await parser.parseURL(RSS_FEEDS.theblock);
      return (feed.items || [])
        .slice(0, 20)
        .map((item, idx) => ({
          id: `tb-${idx}-${Date.now()}`,
          title: item.title || "Untitled",
          description: item.contentSnippet || (item as any).summary || "",
          link: item.link || "",
          pubDate: item.pubDate || new Date().toISOString(),
          source: "The Block",
          content: (item as any).content || (item as any).description || "",
        }));
    } catch (error) {
      console.error("[RSS] Error fetching The Block feed:", error);
      return [];
    }
  });
}

/**
 * Получить все новости из всех источников
 */
export async function getAllNews(): Promise<NewsItem[]> {
  try {
    const [cointelegraphNews, theblockNews] = await Promise.all([
      getCoinTelegraphNews(),
      getTheBlockNews(),
    ]);

    // Объединяем и сортируем по дате (новые первыми)
    const allNews = [...cointelegraphNews, ...theblockNews];
    allNews.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    return allNews;
  } catch (error) {
    console.error("[RSS] Error fetching all news:", error);
    return [];
  }
}

/**
 * Фильтровать новости по ключевым словам (например, по названию криптовалюты)
 */
export function filterNewsByKeywords(
  news: NewsItem[],
  keywords: string[]
): NewsItem[] {
  if (!keywords || keywords.length === 0) {
    return news;
  }

  return news.filter((item) => {
    const text = `${item.title} ${item.description}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });
}

/**
 * Получить новости по конкретному активу
 */
export async function getNewsByAsset(
  assetTicker: string,
  assetName: string
): Promise<NewsItem[]> {
  try {
    const allNews = await getAllNews();
    const keywords = [assetTicker, assetName, assetTicker.toUpperCase()];
    return filterNewsByKeywords(allNews, keywords);
  } catch (error) {
    console.error(`[RSS] Error fetching news for ${assetTicker}:`, error);
    return [];
  }
}

/**
 * Очистить кеш (для тестирования)
 */
export function clearFeedCache(): void {
  feedCache.clear();
}

/**
 * Получить статистику кеша
 */
export function getCacheStats(): {
  cacheSize: number;
  cacheKeys: string[];
} {
  return {
    cacheSize: feedCache.size,
    cacheKeys: Array.from(feedCache.keys()),
  };
}
