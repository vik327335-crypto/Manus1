/**
 * Wallet Integration Router
 * Handles Phantom and Magic wallet connections
 */

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import WalletIntegrationService from '../services/walletIntegrationService';

export const walletIntegrationRouter = router({
  /**
   * Generate connection challenge
   */
  generateChallenge: publicProcedure
    .input(
      z.object({
        walletAddress: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { challenge, nonce } = WalletIntegrationService.generateChallenge(
          input.walletAddress
        );

        return {
          success: true,
          challenge,
          nonce,
        };
      } catch (error) {
        throw new Error(`Failed to generate challenge: ${String(error)}`);
      }
    }),

  /**
   * Verify wallet signature
   */
  verifySignature: publicProcedure
    .input(
      z.object({
        message: z.string(),
        signature: z.string(),
        publicKey: z.string(),
        walletType: z.enum(['phantom', 'magic']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const verification = WalletIntegrationService.verifySignature(
          input.message,
          input.signature,
          input.publicKey,
          input.walletType
        );

        return {
          success: verification.valid,
          verification,
        };
      } catch (error) {
        throw new Error(`Failed to verify signature: ${String(error)}`);
      }
    }),

  /**
   * Validate wallet address
   */
  validateWalletAddress: publicProcedure
    .input(
      z.object({
        address: z.string(),
        walletType: z.enum(['phantom', 'magic']),
      })
    )
    .query(async ({ input }) => {
      try {
        const isValid = WalletIntegrationService.validateWalletAddress(
          input.address,
          input.walletType
        );

        return {
          success: true,
          isValid,
          address: input.address,
          walletType: input.walletType,
        };
      } catch (error) {
        throw new Error(`Failed to validate wallet address: ${String(error)}`);
      }
    }),

  /**
   * Get wallet balance
   */
  getWalletBalance: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        walletType: z.enum(['phantom', 'magic']),
      })
    )
    .query(async ({ input }) => {
      try {
        const balance = await WalletIntegrationService.getWalletBalance(
          input.walletAddress,
          input.walletType
        );

        return {
          success: !!balance,
          balance: balance || { balance: 0, currency: '' },
        };
      } catch (error) {
        throw new Error(`Failed to get wallet balance: ${String(error)}`);
      }
    }),

  /**
   * Get wallet tokens
   */
  getWalletTokens: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        walletType: z.enum(['phantom', 'magic']),
      })
    )
    .query(async ({ input }) => {
      try {
        const tokens = await WalletIntegrationService.getWalletTokens(
          input.walletAddress,
          input.walletType
        );

        return {
          success: true,
          tokens,
          count: tokens.length,
        };
      } catch (error) {
        throw new Error(`Failed to get wallet tokens: ${String(error)}`);
      }
    }),

  /**
   * Get wallet NFTs
   */
  getWalletNFTs: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        walletType: z.enum(['phantom', 'magic']),
      })
    )
    .query(async ({ input }) => {
      try {
        const nfts = await WalletIntegrationService.getWalletNFTs(
          input.walletAddress,
          input.walletType
        );

        return {
          success: true,
          nfts,
          count: nfts.length,
        };
      } catch (error) {
        throw new Error(`Failed to get wallet NFTs: ${String(error)}`);
      }
    }),

  /**
   * Get wallet transaction history
   */
  getWalletTransactionHistory: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        walletType: z.enum(['phantom', 'magic']),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const transactions = await WalletIntegrationService.getWalletTransactionHistory(
          input.walletAddress,
          input.walletType,
          input.limit
        );

        return {
          success: true,
          transactions,
          count: transactions.length,
        };
      } catch (error) {
        throw new Error(`Failed to get wallet transaction history: ${String(error)}`);
      }
    }),

  /**
   * Link wallet to user account
   */
  linkWallet: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        walletType: z.enum(['phantom', 'magic']),
        signature: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        // Verify signature first
        const verification = WalletIntegrationService.verifySignature(
          input.message,
          input.signature,
          input.walletAddress,
          input.walletType
        );

        if (!verification.valid) {
          throw new Error('Invalid signature');
        }

        // In production, save wallet to database
        // await db.userWallets.create({
        //   userId: ctx.user.id,
        //   walletAddress: input.walletAddress,
        //   walletType: input.walletType,
        //   signature: input.signature,
        //   linkedAt: new Date(),
        // });

        return {
          success: true,
          message: `Wallet ${input.walletAddress} linked successfully`,
          walletAddress: input.walletAddress,
          walletType: input.walletType,
        };
      } catch (error) {
        throw new Error(`Failed to link wallet: ${String(error)}`);
      }
    }),

  /**
   * Unlink wallet from user account
   */
  unlinkWallet: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
      })
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        // In production, delete wallet from database
        // await db.userWallets.delete({
        //   where: {
        //     userId: ctx.user.id,
        //     walletAddress: input.walletAddress,
        //   },
        // });

        return {
          success: true,
          message: `Wallet ${input.walletAddress} unlinked successfully`,
        };
      } catch (error) {
        throw new Error(`Failed to unlink wallet: ${String(error)}`);
      }
    }),

  /**
   * Get user's linked wallets
   */
  getUserWallets: protectedProcedure.query(async ({ ctx: _ctx }) => {
    try {
      // In production, fetch wallets from database
      // const wallets = await db.userWallets.findMany({
      //   where: { userId: ctx.user.id },
      // });

      return {
        success: true,
        wallets: [],
        count: 0,
      };
    } catch (error) {
      throw new Error(`Failed to get user wallets: ${String(error)}`);
    }
  }),

  /**
   * Set primary wallet
   */
  setPrimaryWallet: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
      })
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      try {
        // In production, update database
        // await db.userWallets.updateMany(
        //   { where: { userId: ctx.user.id }, data: { isPrimary: false } }
        // );
        // await db.userWallets.update({
        //   where: { walletAddress: input.walletAddress },
        //   data: { isPrimary: true },
        // });

        return {
          success: true,
          message: `Primary wallet set to ${input.walletAddress}`,
          primaryWallet: input.walletAddress,
        };
      } catch (error) {
        throw new Error(`Failed to set primary wallet: ${String(error)}`);
      }
    }),
});

export default walletIntegrationRouter;
