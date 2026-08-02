/**
 * NFT Analytics Router
 * Provides advanced analytics and insights for NFT portfolios
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { solanaPortfolios, solanaCollections } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const nftAnalyticsRouter = router({
  /**
   * Get portfolio analytics summary
   */
  getPortfolioAnalytics: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const nfts = await db
          .select()
          .from(solanaPortfolios)
          .where(
            and(
              eq(solanaPortfolios.userId, ctx.user.id),
              eq(solanaPortfolios.walletAddress, input.walletAddress)
            )
          );

        const totalValue = (nfts as any[]).reduce((sum: number, nft: any) => sum + (nft.yourPrice || 0), 0);
        const totalGain = (nfts as any[]).reduce((sum: number, nft: any) => sum + (nft.gain || 0), 0);
        const avgRarity = (nfts as any[]).reduce((sum: number, nft: any) => sum + (nft.rarity || 0), 0) / (nfts.length || 1);
        const avgFloorPrice = (nfts as any[]).reduce((sum: number, nft: any) => sum + (nft.floorPrice || 0), 0) / (nfts.length || 1);

        return {
          portfolioValue: totalValue,
          totalGain,
          gainPercent: totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0,
          totalNFTs: nfts.length,
          averageRarity: avgRarity,
          floorPriceAverage: avgFloorPrice,
          gainAverage: totalGain / (nfts.length || 1),
          gainAveragePercent: totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0,
        };
      } catch (error) {
        throw new Error(`Failed to get portfolio analytics: ${String(error)}`);
      }
    }),

  /**
   * Get collection performance metrics
   */
  getCollectionMetrics: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const collection = await db
          .select()
          .from(solanaCollections)
          .where(eq(solanaCollections.collectionId, input.collectionId));

        if (!collection.length) {
          throw new Error('Collection not found');
        }

        const col = collection[0];

        return {
          id: col.collectionId,
          name: col.name,
          floorPrice: col.floorPrice,
          floorPriceChange24h: col.floorPriceChange24h,
          volume24h: col.volume24h,
          holders: col.holders,
          supply: col.supply,
          verified: col.verified,
          lastUpdated: col.lastUpdated,
        };
      } catch (error) {
        throw new Error(`Failed to get collection metrics: ${String(error)}`);
      }
    }),

  /**
   * Get rarity distribution for portfolio
   */
  getRarityDistribution: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const nfts = await db
          .select()
          .from(solanaPortfolios)
          .where(
            and(
              eq(solanaPortfolios.userId, ctx.user.id),
              eq(solanaPortfolios.walletAddress, input.walletAddress)
            )
          );

        const distribution = [
          { range: '0-20', count: 0, percentage: 0 },
          { range: '20-40', count: 0, percentage: 0 },
          { range: '40-60', count: 0, percentage: 0 },
          { range: '60-80', count: 0, percentage: 0 },
          { range: '80-100', count: 0, percentage: 0 },
        ];

        (nfts as any[]).forEach((nft: any) => {
          const rarity = nft.rarity || 0;
          if (rarity < 20) distribution[0].count++;
          else if (rarity < 40) distribution[1].count++;
          else if (rarity < 60) distribution[2].count++;
          else if (rarity < 80) distribution[3].count++;
          else distribution[4].count++;
        });

        const total = nfts.length;
        distribution.forEach(d => {
          d.percentage = total > 0 ? (d.count / total) * 100 : 0;
        });

        return distribution;
      } catch (error) {
        throw new Error(`Failed to get rarity distribution: ${String(error)}`);
      }
    }),

  /**
   * Get portfolio composition by collection
   */
  getPortfolioComposition: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const nfts = await db
          .select()
          .from(solanaPortfolios)
          .where(
            and(
              eq(solanaPortfolios.userId, ctx.user.id),
              eq(solanaPortfolios.walletAddress, input.walletAddress)
            )
          );

        const composition: Record<string, any> = {};
        let totalValue = 0;

        (nfts as any[]).forEach((nft: any) => {
          if (!composition[nft.collection]) {
            composition[nft.collection] = {
              name: nft.collection,
              count: 0,
              totalValue: 0,
              averageRarity: 0,
              totalGain: 0,
            };
          }
          composition[nft.collection].count++;
          composition[nft.collection].totalValue += nft.yourPrice || 0;
          composition[nft.collection].averageRarity += nft.rarity || 0;
          composition[nft.collection].totalGain += nft.gain || 0;
          totalValue += nft.yourPrice || 0;
        });

        Object.values(composition).forEach((col: any) => {
          col.averageRarity = col.averageRarity / col.count;
          col.percentage = totalValue > 0 ? (col.totalValue / totalValue) * 100 : 0;
          col.gainPercent = col.totalValue > 0 ? (col.totalGain / (col.totalValue - col.totalGain)) * 100 : 0;
        });

        return Object.values(composition);
      } catch (error) {
        throw new Error(`Failed to get portfolio composition: ${String(error)}`);
      }
    }),

  /**
   * Get top performers
   */
  getTopPerformers: protectedProcedure
    .input(z.object({
      walletAddress: z.string(),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const nfts = await db
          .select()
          .from(solanaPortfolios)
          .where(
            and(
              eq(solanaPortfolios.userId, ctx.user.id),
              eq(solanaPortfolios.walletAddress, input.walletAddress)
            )
          );

        const sorted = (nfts as any[])
          .sort((a: any, b: any) => (b.gainPercent || 0) - (a.gainPercent || 0))
          .slice(0, input.limit)
          .map((nft: any) => ({
            id: nft.nftId,
            name: nft.name,
            collection: nft.collection,
            yourPrice: nft.yourPrice,
            floorPrice: nft.floorPrice,
            gain: nft.gain,
            gainPercent: nft.gainPercent,
            rarity: nft.rarity,
            image: nft.image,
          }));

        return sorted;
      } catch (error) {
        throw new Error(`Failed to get top performers: ${String(error)}`);
      }
    }),

  /**
   * Get worst performers
   */
  getWorstPerformers: protectedProcedure
    .input(z.object({
      walletAddress: z.string(),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const nfts = await db
          .select()
          .from(solanaPortfolios)
          .where(
            and(
              eq(solanaPortfolios.userId, ctx.user.id),
              eq(solanaPortfolios.walletAddress, input.walletAddress)
            )
          );

        const sorted = (nfts as any[])
          .sort((a: any, b: any) => (a.gainPercent || 0) - (b.gainPercent || 0))
          .slice(0, input.limit)
          .map((nft: any) => ({
            id: nft.nftId,
            name: nft.name,
            collection: nft.collection,
            yourPrice: nft.yourPrice,
            floorPrice: nft.floorPrice,
            gain: nft.gain,
            gainPercent: nft.gainPercent,
            rarity: nft.rarity,
            image: nft.image,
          }));

        return sorted;
      } catch (error) {
        throw new Error(`Failed to get worst performers: ${String(error)}`);
      }
    }),

  /**
   * Get rarest NFTs
   */
  getRarestNFTs: protectedProcedure
    .input(z.object({
      walletAddress: z.string(),
      limit: z.number().default(10),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const nfts = await db
          .select()
          .from(solanaPortfolios)
          .where(
            and(
              eq(solanaPortfolios.userId, ctx.user.id),
              eq(solanaPortfolios.walletAddress, input.walletAddress)
            )
          );

        const sorted = (nfts as any[])
          .sort((a: any, b: any) => (b.rarity || 0) - (a.rarity || 0))
          .slice(0, input.limit)
          .map((nft: any) => ({
            id: nft.nftId,
            name: nft.name,
            collection: nft.collection,
            rarity: nft.rarity,
            yourPrice: nft.yourPrice,
            floorPrice: nft.floorPrice,
            image: nft.image,
          }));

        return sorted;
      } catch (error) {
        throw new Error(`Failed to get rarest NFTs: ${String(error)}`);
      }
    }),

  /**
   * Get portfolio risk metrics
   */
  getRiskMetrics: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const nfts = await db
          .select()
          .from(solanaPortfolios)
          .where(
            and(
              eq(solanaPortfolios.userId, ctx.user.id),
              eq(solanaPortfolios.walletAddress, input.walletAddress)
            )
          );

        const gains = (nfts as any[]).map((nft: any) => nft.gainPercent || 0);
        const mean = gains.reduce((a: number, b: number) => a + b, 0) / (gains.length || 1);
        const variance = gains.reduce((sum: number, g: number) => sum + Math.pow(g - mean, 2), 0) / (gains.length || 1);
        const stdDev = Math.sqrt(variance);

        const positiveGains = gains.filter((g: number) => g > 0).length;
        const winRate = (positiveGains / (gains.length || 1)) * 100;

        const maxGain = Math.max(...gains);
        const minGain = Math.min(...gains);
        const maxDrawdown = Math.abs(minGain);

        return {
          volatility: stdDev,
          winRate,
          maxGain,
          maxDrawdown,
          sharpeRatio: mean > 0 ? mean / (stdDev || 1) : 0,
          diversificationScore: (nfts.length / 100) * 100, // Simplified
        };
      } catch (error) {
        throw new Error(`Failed to get risk metrics: ${String(error)}`);
      }
    }),

  /**
   * Export portfolio analytics as CSV
   */
  exportAnalytics: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const nfts = await db
          .select()
          .from(solanaPortfolios)
          .where(
            and(
              eq(solanaPortfolios.userId, ctx.user.id),
              eq(solanaPortfolios.walletAddress, input.walletAddress)
            )
          );

        let csv = 'NFT Portfolio Export\n\n';
        csv += 'NFT ID,Name,Collection,Your Price,Floor Price,Gain,Gain %,Rarity,Marketplace,Last Updated\n';

        (nfts as any[]).forEach((nft: any) => {
          csv += `"${nft.nftId}","${nft.name}","${nft.collection}",${nft.yourPrice},${nft.floorPrice},${nft.gain},${nft.gainPercent},${nft.rarity},${nft.marketplace},${nft.lastUpdated}\n`;
        });

        return {
          success: true,
          csv,
          filename: `nft-portfolio-${new Date().toISOString().split('T')[0]}.csv`,
        };
      } catch (error) {
        throw new Error(`Failed to export analytics: ${String(error)}`);
      }
    }),
});

export default nftAnalyticsRouter;
