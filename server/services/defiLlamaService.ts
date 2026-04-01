import axios from "axios";

const DEFILLAMA_API = "https://api.llama.fi";

export interface ProtocolMetrics {
  name: string;
  symbol: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  tvlChange30d: number;
  chains: string[];
  category: string;
  description?: string;
  url?: string;
  logo?: string;
}

export interface ChainTVL {
  name: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
}

// Cache для снижения количества API запросов
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 минут

async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

/**
 * Получить TVL всех протоколов
 */
export async function getAllProtocolsTVL(): Promise<ProtocolMetrics[]> {
  try {
    return await getCachedOrFetch("all_protocols_tvl", async () => {
      const response = await axios.get(`${DEFILLAMA_API}/protocols`);
      const protocols = response.data;

      return protocols
        .slice(0, 50) // Берем топ 50 протоколов
        .map((protocol: any) => ({
          name: protocol.name,
          symbol: protocol.symbol || "",
          tvl: protocol.tvl || 0,
          tvlChange24h: protocol.change_1d || 0,
          tvlChange7d: protocol.change_7d || 0,
          tvlChange30d: protocol.change_30d || 0,
          chains: protocol.chains || [],
          category: protocol.category || "Other",
          description: protocol.description,
          url: protocol.url,
          logo: protocol.logo,
        }));
    });
  } catch (error) {
    console.error("Failed to fetch all protocols TVL:", error);
    return [];
  }
}

/**
 * Получить TVL конкретного протокола
 */
export async function getProtocolTVL(
  protocolSlug: string
): Promise<ProtocolMetrics | null> {
  try {
    return await getCachedOrFetch(`protocol_tvl_${protocolSlug}`, async () => {
      const response = await axios.get(
        `${DEFILLAMA_API}/protocol/${protocolSlug}`
      );
      const protocol = response.data;

      return {
        name: protocol.name,
        symbol: protocol.symbol || "",
        tvl: protocol.tvl || 0,
        tvlChange24h: protocol.change_1d || 0,
        tvlChange7d: protocol.change_7d || 0,
        tvlChange30d: protocol.change_30d || 0,
        chains: protocol.chains || [],
        category: protocol.category || "Other",
        description: protocol.description,
        url: protocol.url,
        logo: protocol.logo,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch TVL for ${protocolSlug}:`, error);
    return null;
  }
}

/**
 * Получить TVL по блокчейнам
 */
export async function getChainsTVL(): Promise<ChainTVL[]> {
  try {
    return await getCachedOrFetch("chains_tvl", async () => {
      const response = await axios.get(`${DEFILLAMA_API}/chains`);
      const chains = response.data;

      return chains.map((chain: any) => ({
        name: chain.name,
        tvl: chain.tvl || 0,
        tvlChange24h: chain.change_1d || 0,
        tvlChange7d: chain.change_7d || 0,
      }));
    });
  } catch (error) {
    console.error("Failed to fetch chains TVL:", error);
    return [];
  }
}

/**
 * Получить исторический TVL протокола
 */
export async function getProtocolTVLHistory(
  protocolSlug: string,
  days: number = 30
): Promise<Array<{ timestamp: number; tvl: number }>> {
  try {
    return await getCachedOrFetch(
      `protocol_tvl_history_${protocolSlug}_${days}`,
      async () => {
        const response = await axios.get(
          `${DEFILLAMA_API}/protocol/${protocolSlug}`
        );
        const protocol = response.data;

        if (!protocol.tvlHistory) {
          return [];
        }

        // Берем последние N дней
        return protocol.tvlHistory
          .slice(-days)
          .map((entry: [number, number]) => ({
            timestamp: entry[0] * 1000, // Конвертируем в миллисекунды
            tvl: entry[1],
          }));
      }
    );
  } catch (error) {
    console.error(
      `Failed to fetch TVL history for ${protocolSlug}:`,
      error
    );
    return [];
  }
}

/**
 * Получить категории протоколов
 */
export async function getProtocolCategories(): Promise<string[]> {
  try {
    return await getCachedOrFetch("protocol_categories", async () => {
      const response = await axios.get(`${DEFILLAMA_API}/protocols`);
      const protocols = response.data;

      const categories = new Set(
        protocols.map((p: any) => p.category || "Other")
      );
      return Array.from(categories).sort() as string[];
    });
  } catch (error) {
    console.error("Failed to fetch protocol categories:", error);
    return [];
  }
}
