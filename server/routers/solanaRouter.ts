/**
 * Solana NFT Router
 * Handles Solana NFT portfolio and collection operations
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import SolanaIntegrationService from '../services/solanaIntegrationService';
import { getDb } from '../db';
import { solanaPortfolios, solanaCollections } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const solanaRouter = router({
  /**
   * Get user's Solana NFT portfolio from Magic Eden
   */
  getMagicEdenPortfolio: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const portfolio = await SolanaIntegrationService.getMagicEdenPortfolio(
          input.walletAddress
        );

        // Save to database
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        for (const nft of portfolio) {
          await db
            .insert(solanaPortfolios)
            .values({
              userId: ctx.user.id,
              walletAddress: input.walletAddress,
              nftId: nft.id,
              name: nft.name,
              collection: nft.collection,
              floorPrice: nft.floorPrice,
              yourPrice: nft.yourPrice,
              gain: nft.gain,
              gainPercent: nft.gainPercent,
              rarity: nft.rarity,
              marketplace: nft.marketplace,
              image: nft.image,
              lastUpdated: nft.lastUpdated,
            });
        }

        return portfolio;
      } catch (error) {
        throw new Error(`Failed to fetch Magic Eden portfolio: ${String(error)}`);
      }
    }),

  /**
   * Get user's Solana NFT portfolio from Tensor
   */
  getTensorPortfolio: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const portfolio = await SolanaIntegrationService.getTensorPortfolio(
          input.walletAddress
        );

        // Save to database
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        for (const nft of portfolio) {
          await db
            .insert(solanaPortfolios)
            .values({
              userId: ctx.user.id,
              walletAddress: input.walletAddress,
              nftId: nft.id,
              name: nft.name,
              collection: nft.collection,
              floorPrice: nft.floorPrice,
              yourPrice: nft.yourPrice,
              gain: nft.gain,
              gainPercent: nft.gainPercent,
              rarity: nft.rarity,
              marketplace: nft.marketplace,
              image: nft.image,
              lastUpdated: nft.lastUpdated,
            });
        }

        return portfolio;
      } catch (error) {
        throw new Error(`Failed to fetch Tensor portfolio: ${String(error)}`);
      }
    }),

  /**
   * Get portfolio metrics
   */
  getPortfolioMetrics: protectedProcedure
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

        const metrics = SolanaIntegrationService.calculatePortfolioMetrics(
          (nfts as any[]).map((nft: any) => ({
            id: nft.nftId,
            name: nft.name,
            collection: nft.collection,
            floorPrice: nft.floorPrice,
            yourPrice: nft.yourPrice,
            gain: nft.gain,
            gainPercent: nft.gainPercent,
            rarity: nft.rarity,
            traits: {},
            image: nft.image,
            marketplace: nft.marketplace as 'magic-eden' | 'tensor' | 'solanart' | 'other',
            lastUpdated: nft.lastUpdated,
          }))
        );

        return metrics;
      } catch (error) {
        throw new Error(`Failed to get portfolio metrics: ${String(error)}`);
      }
    }),

  /**
   * Get collection stats from Tensor
   */
  getCollectionStats: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const stats = await SolanaIntegrationService.getTensorCollectionStats(
          input.collectionId
        );

        // Save to database
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        await db
          .insert(solanaCollections)
          .values({
            collectionId: stats.id,
            name: stats.name,
            floorPrice: stats.floorPrice,
            floorPriceChange24h: stats.floorPriceChange24h,
            volume24h: stats.volume24h,
            holders: stats.holders,
            supply: stats.supply,
            image: stats.image,
            verified: stats.verified ? 1 : 0,
          });

        return stats;
      } catch (error) {
        throw new Error(`Failed to get collection stats: ${String(error)}`);
      }
    }),

  /**
   * Get trending collections
   */
  getTrendingCollections: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      try {
        const collections = await SolanaIntegrationService.getTrendingCollections(
          input.limit
        );
        return collections;
      } catch (error) {
        throw new Error(`Failed to get trending collections: ${String(error)}`);
      }
    }),

  /**
   * Get collection floor price history
   */
  getCollectionFloorHistory: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        timeframe: z.enum(['24h', '7d', '30d']).default('24h'),
      })
    )
    .query(async ({ input }) => {
      try {
        const history = await SolanaIntegrationService.getCollectionFloorHistory(
          input.collectionId,
          input.timeframe
        );
        return history;
      } catch (error) {
        throw new Error(`Failed to get floor history: ${String(error)}`);
      }
    }),

  /**
   * Get collection opportunities
   */
  getCollectionOpportunities: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        threshold: z.number().default(0.8),
      })
    )
    .query(async ({ input }) => {
      try {
        const opportunities = await SolanaIntegrationService.getCollectionOpportunities(
          input.collectionId,
          input.threshold
        );
        return opportunities;
      } catch (error) {
        throw new Error(`Failed to get opportunities: ${String(error)}`);
      }
    }),

  /**
   * Get portfolio recommendations
   */
  getPortfolioRecommendations: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        budget: z.number(),
      })
    )
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

        const recommendations = await SolanaIntegrationService.getPortfolioRecommendations(
          (nfts as any[]).map((nft: any) => ({
            id: nft.nftId,
            name: nft.name,
            collection: nft.collection,
            floorPrice: nft.floorPrice,
            yourPrice: nft.yourPrice,
            gain: nft.gain,
            gainPercent: nft.gainPercent,
            rarity: nft.rarity,
            traits: {},
            image: nft.image,
            marketplace: nft.marketplace as 'magic-eden' | 'tensor' | 'solanart' | 'other',
            lastUpdated: nft.lastUpdated,
          })),
          input.budget
        );

        return recommendations;
      } catch (error) {
        throw new Error(`Failed to get recommendations: ${String(error)}`);
      }
    }),

  /**
   * Get wallet Solana balance
   */
  getWalletBalance: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input }) => {
      try {
        const balance = await SolanaIntegrationService.getWalletBalance(
          input.walletAddress
        );
        return { balance };
      } catch (error) {
        throw new Error(`Failed to get wallet balance: ${String(error)}`);
      }
    }),

  /**
   * Get collection rarity distribution
   */
  getCollectionRarityDistribution: protectedProcedure
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ input }) => {
      try {
        const distribution = await SolanaIntegrationService.getCollectionRarityDistribution(
          input.collectionId
        );
        return distribution;
      } catch (error) {
        throw new Error(`Failed to get rarity distribution: ${String(error)}`);
      }
    }),

  /**
   * Get user's saved Solana portfolios
   */
  getSavedPortfolios: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const portfolios = await db
        .select()
        .from(solanaPortfolios)
        .where(eq(solanaPortfolios.userId, ctx.user.id));

      const grouped = (portfolios as any[]).reduce(
        (acc: any, nft: any) => {
          if (!acc[nft.walletAddress]) {
            acc[nft.walletAddress] = [];
          }
          acc[nft.walletAddress].push(nft);
          return acc;
        },
        {} as Record<string, any[]>
      );

      return Object.entries(grouped).map(([walletAddress, nfts]: any) => ({
        walletAddress,
        nfts,
        count: (nfts as any[]).length,
      }));
    } catch (error) {
      throw new Error(`Failed to get saved portfolios: ${String(error)}`);
    }
  }),
});

export default solanaRouter;
