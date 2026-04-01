import axios from "axios";

// Примечание: Glassnode требует API ключ. Используем переменную окружения.
const GLASSNODE_API = "https://api.glassnode.com/v1";
const GLASSNODE_API_KEY = process.env.GLASSNODE_API_KEY || "demo";

export interface OnChainMetrics {
  timestamp: number;
  activeAddresses: number;
  transactions: number;
  volume: number;
  fees: number;
  miningRevenue: number;
}

export interface WhaleActivity {
  timestamp: number;
  largeTransactions: number;
  whaleBalance: number;
  whaleMovement: "accumulating" | "distributing" | "neutral";
}

export interface AddressMetrics {
  totalAddresses: number;
  activeAddresses: number;
  newAddresses: number;
  dormantAddresses: number;
}

// Cache для снижения количества API запросов
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 минут

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
 * Получить активные адреса за период
 */
export async function getActiveAddresses(
  asset: string,
  days: number = 30
): Promise<OnChainMetrics[]> {
  try {
    return await getCachedOrFetch(
      `active_addresses_${asset}_${days}`,
      async () => {
        const response = await axios.get(
          `${GLASSNODE_API}/metrics/addresses/active_count`,
          {
            params: {
              a: asset.toLowerCase(),
              api_key: GLASSNODE_API_KEY,
              timestamp_format: "unix",
              limit: days,
            },
          }
        );

        return response.data.map((entry: any) => ({
          timestamp: entry.t * 1000,
          activeAddresses: entry.v || 0,
          transactions: 0,
          volume: 0,
          fees: 0,
          miningRevenue: 0,
        }));
      }
    );
  } catch (error) {
    console.error(`Failed to fetch active addresses for ${asset}:`, error);
    return [];
  }
}

/**
 * Получить активность китов (крупные адреса)
 */
export async function getWhaleActivity(
  asset: string,
  days: number = 30
): Promise<WhaleActivity[]> {
  try {
    return await getCachedOrFetch(`whale_activity_${asset}_${days}`, async () => {
      const response = await axios.get(
        `${GLASSNODE_API}/metrics/whale_transactions`,
        {
          params: {
            a: asset.toLowerCase(),
            api_key: GLASSNODE_API_KEY,
            timestamp_format: "unix",
            limit: days,
          },
        }
      );

      return response.data.map((entry: any) => {
        const movement = entry.v > 0 ? "accumulating" : "distributing";
        return {
          timestamp: entry.t * 1000,
          largeTransactions: Math.abs(entry.v) || 0,
          whaleBalance: 0,
          whaleMovement: movement as "accumulating" | "distributing" | "neutral",
        };
      });
    });
  } catch (error) {
    console.error(`Failed to fetch whale activity for ${asset}:`, error);
    return [];
  }
}

/**
 * Получить метрики адресов
 */
export async function getAddressMetrics(asset: string): Promise<AddressMetrics> {
  try {
    return await getCachedOrFetch(`address_metrics_${asset}`, async () => {
      const response = await axios.get(
        `${GLASSNODE_API}/metrics/addresses/active_count`,
        {
          params: {
            a: asset.toLowerCase(),
            api_key: GLASSNODE_API_KEY,
            timestamp_format: "unix",
            limit: 1,
          },
        }
      );

      const activeCount = response.data[0]?.v || 0;

      return {
        totalAddresses: activeCount * 1.5, // Примерное значение
        activeAddresses: activeCount,
        newAddresses: Math.floor(activeCount * 0.1),
        dormantAddresses: Math.floor(activeCount * 0.4),
      };
    });
  } catch (error) {
    console.error(`Failed to fetch address metrics for ${asset}:`, error);
    return {
      totalAddresses: 0,
      activeAddresses: 0,
      newAddresses: 0,
      dormantAddresses: 0,
    };
  }
}

/**
 * Получить объем транзакций
 */
export async function getTransactionVolume(
  asset: string,
  days: number = 30
): Promise<Array<{ timestamp: number; volume: number }>> {
  try {
    return await getCachedOrFetch(
      `transaction_volume_${asset}_${days}`,
      async () => {
        const response = await axios.get(
          `${GLASSNODE_API}/metrics/transactions/transfers_volume`,
          {
            params: {
              a: asset.toLowerCase(),
              api_key: GLASSNODE_API_KEY,
              timestamp_format: "unix",
              limit: days,
            },
          }
        );

        return response.data.map((entry: any) => ({
          timestamp: entry.t * 1000,
          volume: entry.v || 0,
        }));
      }
    );
  } catch (error) {
    console.error(
      `Failed to fetch transaction volume for ${asset}:`,
      error
    );
    return [];
  }
}

/**
 * Получить средние комиссии сети
 */
export async function getNetworkFees(
  asset: string,
  days: number = 30
): Promise<Array<{ timestamp: number; fees: number }>> {
  try {
    return await getCachedOrFetch(`network_fees_${asset}_${days}`, async () => {
      const response = await axios.get(
        `${GLASSNODE_API}/metrics/fees/mean`,
        {
          params: {
            a: asset.toLowerCase(),
            api_key: GLASSNODE_API_KEY,
            timestamp_format: "unix",
            limit: days,
          },
        }
      );

      return response.data.map((entry: any) => ({
        timestamp: entry.t * 1000,
        fees: entry.v || 0,
      }));
    });
  } catch (error) {
    console.error(`Failed to fetch network fees for ${asset}:`, error);
    return [];
  }
}

/**
 * Получить статус Glassnode API (проверка доступности)
 */
export async function checkGlassnodeStatus(): Promise<boolean> {
  try {
    const response = await axios.get(`${GLASSNODE_API}/metrics/addresses/active_count`, {
      params: {
        a: "btc",
        api_key: GLASSNODE_API_KEY,
        limit: 1,
      },
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.warn("Glassnode API is unavailable:", error);
    return false;
  }
}
