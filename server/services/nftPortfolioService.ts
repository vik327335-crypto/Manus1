/**
 * NFT Portfolio Service
 * Manages NFT portfolio tracking and analysis
 */

export interface NFTAsset {
  id: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  collectionName: string;
  collectionFloorPrice: number;
  currentPrice: number;
  purchasePrice: number;
  purchaseDate: Date;
  gain: number;
  gainPercent: number;
  rarity: number;
  traits: Record<string, string>;
}

export interface NFTPortfolioMetrics {
  totalValue: number;
  totalGain: number;
  gainPercent: number;
  floorValue: number;
  topCollection: string;
  topCollectionValue: number;
  diversificationScore: number;
  raritySummary: Record<string, number>;
}

export class NFTPortfolioService {
  /**
   * Get NFT portfolio from OpenSea
   */
  static async getNFTPortfolio(walletAddress: string): Promise<NFTAsset[]> {
    try {
      const response = await fetch(
        `https://api.opensea.io/api/v1/assets?owner=${walletAddress}&limit=50`,
        {
          headers: {
            'X-API-KEY': process.env.OPENSEA_API_KEY || '',
          },
        }
      );
      const data = (await response.json()) as any;
      return data.assets.map((asset: any) => ({
        id: asset.id,
        contractAddress: asset.asset_contract.address,
        tokenId: asset.token_id,
        name: asset.name,
        description: asset.description,
        imageUrl: asset.image_url,
        collectionName: asset.collection.name,
        collectionFloorPrice: asset.collection.floor_price || 0,
        currentPrice: asset.last_sale?.total_price || 0,
        purchasePrice: 0,
        purchaseDate: new Date(),
        gain: 0,
        gainPercent: 0,
        rarity: asset.rarity_score || 0,
        traits: asset.traits.reduce((acc: any, trait: any) => {
          acc[trait.trait_type] = trait.value;
          return acc;
        }, {}),
      }));
    } catch (error) {
      throw new Error(`Failed to fetch NFT portfolio: ${String(error)}`);
    }
  }

  /**
   * Get NFT portfolio from Blur
   */
  static async getNFTPortfolioFromBlur(walletAddress: string): Promise<NFTAsset[]> {
    try {
      const response = await fetch(
        `https://api.blur.io/v1/portfolio/${walletAddress}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.BLUR_API_KEY || ''}`,
          },
        }
      );
      const data = (await response.json()) as any;
      return data.nfts.map((nft: any) => ({
        id: nft.id,
        contractAddress: nft.contract,
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description,
        imageUrl: nft.image,
        collectionName: nft.collection,
        collectionFloorPrice: nft.floorPrice || 0,
        currentPrice: nft.lastSalePrice || 0,
        purchasePrice: 0,
        purchaseDate: new Date(),
        gain: 0,
        gainPercent: 0,
        rarity: nft.rarityScore || 0,
        traits: nft.traits || {},
      }));
    } catch (error) {
      throw new Error(`Failed to fetch NFT portfolio from Blur: ${String(error)}`);
    }
  }

  /**
   * Calculate portfolio metrics
   */
  static calculateMetrics(assets: NFTAsset[]): NFTPortfolioMetrics {
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentPrice, 0);
    const totalGain = assets.reduce((sum, asset) => sum + asset.gain, 0);
    const gainPercent = totalValue > 0 ? (totalGain / totalValue) * 100 : 0;
    const floorValue = assets.reduce((sum, asset) => sum + asset.collectionFloorPrice, 0);

    // Top collection
    const collectionValues = assets.reduce((acc, asset) => {
      acc[asset.collectionName] = (acc[asset.collectionName] || 0) + asset.currentPrice;
      return acc;
    }, {} as Record<string, number>);

    const topCollection = Object.entries(collectionValues).sort(([, a], [, b]) => b - a)[0];
    const topCollectionValue = topCollection ? topCollection[1] : 0;

    // Diversification score (0-100)
    const diversificationScore = Math.min(
      100,
      (Object.keys(collectionValues).length / assets.length) * 100
    );

    // Rarity summary
    const raritySummary = assets.reduce((acc, asset) => {
      const rarityBucket = Math.floor(asset.rarity / 10) * 10;
      acc[`${rarityBucket}-${rarityBucket + 10}`] =
        (acc[`${rarityBucket}-${rarityBucket + 10}`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalValue,
      totalGain,
      gainPercent,
      floorValue,
      topCollection: topCollection ? topCollection[0] : '',
      topCollectionValue,
      diversificationScore,
      raritySummary,
    };
  }

  /**
   * Get NFT market trends
   */
  static async getNFTMarketTrends(): Promise<Record<string, any>> {
    try {
      const response = await fetch('https://api.opensea.io/api/v1/collections?limit=20', {
        headers: {
          'X-API-KEY': process.env.OPENSEA_API_KEY || '',
        },
      });
      const data = (await response.json()) as any;
      return data.collections.reduce((acc: any, collection: any) => {
        acc[collection.name] = {
          floorPrice: collection.floor_price,
          volume24h: collection.one_day_volume,
          volumeChange: collection.one_day_change,
          owners: collection.owner_count,
          items: collection.item_count,
        };
        return acc;
      }, {});
    } catch (error) {
      throw new Error(`Failed to fetch NFT market trends: ${String(error)}`);
    }
  }

  /**
   * Get NFT rarity analysis
   */
  static async getNFTRarityAnalysis(
    contractAddress: string,
    tokenId: string
  ): Promise<Record<string, any>> {
    try {
      const response = await fetch(
        `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}`,
        {
          headers: {
            'X-API-KEY': process.env.OPENSEA_API_KEY || '',
          },
        }
      );
      const data = (await response.json()) as any;
      return {
        rarityScore: data.rarity_score,
        rarityRank: data.rarity_rank,
        traits: data.traits,
        collection: data.collection.name,
        floorPrice: data.collection.floor_price,
      };
    } catch (error) {
      throw new Error(`Failed to fetch NFT rarity analysis: ${String(error)}`);
    }
  }

  /**
   * Compare NFT portfolio with market
   */
  static compareWithMarket(
    portfolio: NFTAsset[],
    marketTrends: Record<string, any>
  ): Record<string, any> {
    const comparison: Record<string, any> = {};

    portfolio.forEach((asset) => {
      const marketData = marketTrends[asset.collectionName];
      if (marketData) {
        comparison[asset.collectionName] = {
          portfolioValue: asset.currentPrice,
          marketFloorPrice: marketData.floorPrice,
          difference: asset.currentPrice - marketData.floorPrice,
          volume24h: marketData.volume24h,
          volumeChange: marketData.volumeChange,
          owners: marketData.owners,
          items: marketData.items,
        };
      }
    });

    return comparison;
  }

  /**
   * Get NFT portfolio recommendations
   */
  static getRecommendations(
    portfolio: NFTAsset[],
    metrics: NFTPortfolioMetrics
  ): Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }> {
    const recommendations: Array<{
      type: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Diversification recommendation
    if (metrics.diversificationScore < 30) {
      recommendations.push({
        type: 'diversification',
        message: 'Consider diversifying into more collections to reduce risk',
        priority: 'high',
      });
    }

    // Collection concentration
    const topCollectionPercent = (metrics.topCollectionValue / metrics.totalValue) * 100;
    if (topCollectionPercent > 50) {
      recommendations.push({
        type: 'concentration',
        message: `Your portfolio is heavily concentrated in ${metrics.topCollection} (${topCollectionPercent.toFixed(1)}%)`,
        priority: 'medium',
      });
    }

    // Rarity optimization
    const lowRarityCount = portfolio.filter((asset) => asset.rarity < 30).length;
    if (lowRarityCount > portfolio.length * 0.3) {
      recommendations.push({
        type: 'rarity',
        message: 'Consider focusing on higher rarity NFTs for better long-term value',
        priority: 'low',
      });
    }

    return recommendations;
  }
}

export default NFTPortfolioService;
