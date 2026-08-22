/**
 * Solana NFT Integration Service
 * Manages Solana NFT portfolio tracking and analysis
 */

export interface SolanaNFT {
  id: string;
  name: string;
  collection: string;
  floorPrice: number;
  yourPrice: number;
  gain: number;
  gainPercent: number;
  rarity: number;
  traits: Record<string, string>;
  image: string;
  marketplace: 'magic-eden' | 'tensor' | 'solanart' | 'other';
  lastUpdated: Date;
}

export interface SolanaCollection {
  id: string;
  name: string;
  floorPrice: number;
  floorPriceChange24h: number;
  volume24h: number;
  holders: number;
  supply: number;
  image: string;
  verified: boolean;
}

export interface SolanaPortfolioMetrics {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  floorValue: number;
  collections: number;
  nfts: number;
  rarity: {
    rare: number;
    uncommon: number;
    common: number;
  };
}

export class SolanaIntegrationService {
  private static readonly MAGIC_EDEN_API = 'https://api-mainnet.magiceden.dev/v2';
  private static readonly TENSOR_API = 'https://api.tensor.trade/api/v1';
  private static readonly SOLANART_API = 'https://api.solanart.io';

  /**
   * Get user's Solana NFT portfolio from Magic Eden
   */
  static async getMagicEdenPortfolio(walletAddress: string): Promise<SolanaNFT[]> {
    try {
      const response = await fetch(
        `${this.MAGIC_EDEN_API}/wallet/${walletAddress}/tokens?offset=0&limit=100`
      );
      const data = await response.json();

      return data.results?.map((nft: any) => ({
        id: nft.mint,
        name: nft.name,
        collection: nft.collectionName,
        floorPrice: nft.floorPrice || 0,
        yourPrice: nft.price || 0,
        gain: (nft.price || 0) - (nft.floorPrice || 0),
        gainPercent: nft.floorPrice ? (((nft.price || 0) - nft.floorPrice) / nft.floorPrice) * 100 : 0,
        rarity: nft.rarity || 0,
        traits: nft.attributes || {},
        image: nft.image || '',
        marketplace: 'magic-eden' as const,
        lastUpdated: new Date(),
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch Magic Eden portfolio: ${String(error)}`);
    }
  }

  /**
   * Get user's Solana NFT portfolio from Tensor
   */
  static async getTensorPortfolio(walletAddress: string): Promise<SolanaNFT[]> {
    try {
      const response = await fetch(`${this.TENSOR_API}/wallet/${walletAddress}/nfts`);
      const data = await response.json();

      return data.nfts?.map((nft: any) => ({
        id: nft.mint,
        name: nft.name,
        collection: nft.collection,
        floorPrice: nft.floorPrice || 0,
        yourPrice: nft.price || 0,
        gain: (nft.price || 0) - (nft.floorPrice || 0),
        gainPercent: nft.floorPrice ? (((nft.price || 0) - nft.floorPrice) / nft.floorPrice) * 100 : 0,
        rarity: nft.rarity || 0,
        traits: nft.traits || {},
        image: nft.image || '',
        marketplace: 'tensor' as const,
        lastUpdated: new Date(),
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch Tensor portfolio: ${String(error)}`);
    }
  }

  /**
   * Get collection floor price from Magic Eden
   */
  static async getMagicEdenCollectionFloor(collectionSymbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.MAGIC_EDEN_API}/collections/${collectionSymbol}`);
      const data = await response.json();
      return data.floorPrice || 0;
    } catch (error) {
      throw new Error(`Failed to fetch collection floor price: ${String(error)}`);
    }
  }

  /**
   * Get collection stats from Tensor
   */
  static async getTensorCollectionStats(collectionId: string): Promise<SolanaCollection> {
    try {
      const response = await fetch(`${this.TENSOR_API}/collections/${collectionId}/stats`);
      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        floorPrice: data.floorPrice || 0,
        floorPriceChange24h: data.floorPriceChange24h || 0,
        volume24h: data.volume24h || 0,
        holders: data.holders || 0,
        supply: data.supply || 0,
        image: data.image || '',
        verified: data.verified || false,
      };
    } catch (error) {
      throw new Error(`Failed to fetch collection stats: ${String(error)}`);
    }
  }

  /**
   * Calculate portfolio metrics
   */
  static calculatePortfolioMetrics(nfts: SolanaNFT[]): SolanaPortfolioMetrics {
    const totalValue = nfts.reduce((sum, nft) => sum + (nft.yourPrice || 0), 0);
    const floorValue = nfts.reduce((sum, nft) => sum + (nft.floorPrice || 0), 0);
    const totalGain = totalValue - floorValue;
    const totalGainPercent = floorValue > 0 ? (totalGain / floorValue) * 100 : 0;

    const rarity = {
      rare: nfts.filter(nft => nft.rarity >= 0.8).length,
      uncommon: nfts.filter(nft => nft.rarity >= 0.5 && nft.rarity < 0.8).length,
      common: nfts.filter(nft => nft.rarity < 0.5).length,
    };

    const collections = new Set(nfts.map(nft => nft.collection)).size;

    return {
      totalValue,
      totalGain,
      totalGainPercent,
      floorValue,
      collections,
      nfts: nfts.length,
      rarity,
    };
  }

  /**
   * Get trending collections on Tensor
   */
  static async getTrendingCollections(limit: number = 10): Promise<SolanaCollection[]> {
    try {
      const response = await fetch(
        `${this.TENSOR_API}/collections/trending?limit=${limit}&timeframe=24h`
      );
      const data = await response.json();

      return data.collections?.map((col: any) => ({
        id: col.id,
        name: col.name,
        floorPrice: col.floorPrice || 0,
        floorPriceChange24h: col.floorPriceChange24h || 0,
        volume24h: col.volume24h || 0,
        holders: col.holders || 0,
        supply: col.supply || 0,
        image: col.image || '',
        verified: col.verified || false,
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch trending collections: ${String(error)}`);
    }
  }

  /**
   * Get collection floor price history
   */
  static async getCollectionFloorHistory(
    collectionId: string,
    timeframe: '24h' | '7d' | '30d' = '24h'
  ): Promise<Array<{ timestamp: Date; price: number }>> {
    try {
      const response = await fetch(
        `${this.TENSOR_API}/collections/${collectionId}/floor-history?timeframe=${timeframe}`
      );
      const data = await response.json();

      return data.history?.map((entry: any) => ({
        timestamp: new Date(entry.timestamp),
        price: entry.price,
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch floor history: ${String(error)}`);
    }
  }

  /**
   * Get NFT rarity ranking
   */
  static async getNFTRarity(mint: string, collectionId: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.TENSOR_API}/nfts/${mint}/rarity?collection=${collectionId}`
      );
      const data = await response.json();
      return data.rarity || 0;
    } catch (error) {
      throw new Error(`Failed to fetch NFT rarity: ${String(error)}`);
    }
  }

  /**
   * Get collection opportunities (undervalued NFTs)
   */
  static async getCollectionOpportunities(
    collectionId: string,
    threshold: number = 0.8
  ): Promise<SolanaNFT[]> {
    try {
      const response = await fetch(
        `${this.TENSOR_API}/collections/${collectionId}/opportunities?threshold=${threshold}`
      );
      const data = await response.json();

      return data.nfts?.map((nft: any) => ({
        id: nft.mint,
        name: nft.name,
        collection: nft.collection,
        floorPrice: nft.floorPrice || 0,
        yourPrice: nft.price || 0,
        gain: (nft.price || 0) - (nft.floorPrice || 0),
        gainPercent: nft.floorPrice ? (((nft.price || 0) - nft.floorPrice) / nft.floorPrice) * 100 : 0,
        rarity: nft.rarity || 0,
        traits: nft.traits || {},
        image: nft.image || '',
        marketplace: 'tensor' as const,
        lastUpdated: new Date(),
      })) || [];
    } catch (error) {
      throw new Error(`Failed to fetch collection opportunities: ${String(error)}`);
    }
  }

  /**
   * Get portfolio recommendations
   */
  static async getPortfolioRecommendations(
    nfts: SolanaNFT[],
    _budget: number
  ): Promise<Array<{ collection: string; reason: string; opportunity: number }>> {
    try {
      const collections = Array.from(new Set(nfts.map(nft => nft.collection)));
      const recommendations = [];

      for (const collection of collections) {
        const response = await fetch(
          `${this.TENSOR_API}/collections/${collection}/recommendations`
        );
        const data = await response.json();

        if (data.recommendation) {
          recommendations.push({
            collection,
            reason: data.recommendation.reason,
            opportunity: data.recommendation.opportunity,
          });
        }
      }

      return recommendations.sort((a, b) => b.opportunity - a.opportunity).slice(0, 5);
    } catch (error) {
      throw new Error(`Failed to fetch recommendations: ${String(error)}`);
    }
  }

  /**
   * Get wallet Solana balance
   */
  static async getWalletBalance(walletAddress: string): Promise<number> {
    try {
      const response = await fetch(`${this.MAGIC_EDEN_API}/wallet/${walletAddress}/balance`);
      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      throw new Error(`Failed to fetch wallet balance: ${String(error)}`);
    }
  }

  /**
   * Get collection rarity distribution
   */
  static async getCollectionRarityDistribution(
    collectionId: string
  ): Promise<{ rare: number; uncommon: number; common: number }> {
    try {
      const response = await fetch(
        `${this.TENSOR_API}/collections/${collectionId}/rarity-distribution`
      );
      const data = await response.json();

      return {
        rare: data.rare || 0,
        uncommon: data.uncommon || 0,
        common: data.common || 0,
      };
    } catch (error) {
      throw new Error(`Failed to fetch rarity distribution: ${String(error)}`);
    }
  }
}

export default SolanaIntegrationService;
