/**
 * NFT Portfolio Router
 * tRPC routes for NFT portfolio management
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { NFTPortfolioService } from '../services/nftPortfolioService';

export const nftPortfolioRouter = router({
  /**
   * Get NFT portfolio from OpenSea
   */
  getPortfolioOpenSea: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input }) => {
      return await NFTPortfolioService.getNFTPortfolio(input.walletAddress);
    }),

  /**
   * Get NFT portfolio from Blur
   */
  getPortfolioBlur: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input }) => {
      return await NFTPortfolioService.getNFTPortfolioFromBlur(input.walletAddress);
    }),

  /**
   * Get portfolio metrics
   */
  getMetrics: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input }) => {
      const portfolio = await NFTPortfolioService.getNFTPortfolio(input.walletAddress);
      return NFTPortfolioService.calculateMetrics(portfolio);
    }),

  /**
   * Get NFT market trends
   */
  getMarketTrends: publicProcedure.query(async () => {
    return await NFTPortfolioService.getNFTMarketTrends();
  }),

  /**
   * Get NFT rarity analysis
   */
  getRarityAnalysis: publicProcedure
    .input(
      z.object({
        contractAddress: z.string(),
        tokenId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await NFTPortfolioService.getNFTRarityAnalysis(
        input.contractAddress,
        input.tokenId
      );
    }),

  /**
   * Compare portfolio with market
   */
  compareWithMarket: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input }) => {
      const portfolio = await NFTPortfolioService.getNFTPortfolio(input.walletAddress);
      const marketTrends = await NFTPortfolioService.getNFTMarketTrends();
      return NFTPortfolioService.compareWithMarket(portfolio, marketTrends);
    }),

  /**
   * Get portfolio recommendations
   */
  getRecommendations: protectedProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ input }) => {
      const portfolio = await NFTPortfolioService.getNFTPortfolio(input.walletAddress);
      const metrics = NFTPortfolioService.calculateMetrics(portfolio);
      return NFTPortfolioService.getRecommendations(portfolio, metrics);
    }),

  /**
   * Get combined crypto and NFT portfolio value
   */
  getCombinedPortfolioValue: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        cryptoPortfolioValue: z.number(),
      })
    )
    .query(async ({ input }) => {
      const nftPortfolio = await NFTPortfolioService.getNFTPortfolio(input.walletAddress);
      const nftMetrics = NFTPortfolioService.calculateMetrics(nftPortfolio);
      const totalValue = input.cryptoPortfolioValue + nftMetrics.totalValue;
      const cryptoPercent = (input.cryptoPortfolioValue / totalValue) * 100;
      const nftPercent = (nftMetrics.totalValue / totalValue) * 100;

      return {
        totalValue,
        cryptoValue: input.cryptoPortfolioValue,
        nftValue: nftMetrics.totalValue,
        cryptoPercent,
        nftPercent,
        allocation: {
          crypto: cryptoPercent.toFixed(2),
          nft: nftPercent.toFixed(2),
        },
      };
    }),
});

export default nftPortfolioRouter;
