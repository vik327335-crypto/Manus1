/**
 * Social Trading Service
 * Handles strategy sharing, copy trading, and community features
 */

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  joinDate: Date;
  followersCount: number;
  followingCount: number;
  strategiesCount: number;
}

export interface TradingStrategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  rules: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  followers: number;
  copiers: number;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    winRate: number;
    maxDrawdown: number;
  };
  tags: string[];
}

export interface CopyTradingRecord {
  id: string;
  copierUserId: string;
  strategyId: string;
  strategyCreatorId: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'stopped';
  allocationPercentage: number;
  performanceTracking: {
    copierReturn: number;
    originalReturn: number;
    trackingError: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  totalReturn: number;
  sharpeRatio: number;
  winRate: number;
  followers: number;
  strategiesCount: number;
  score: number;
}

export class SocialTradingService {
  /**
   * Create user profile
   */
  static createUserProfile(userId: string, username: string, email: string): UserProfile {
    return {
      userId,
      username,
      email,
      joinDate: new Date(),
      followersCount: 0,
      followingCount: 0,
      strategiesCount: 0,
    };
  }

  /**
   * Share trading strategy
   */
  static shareStrategy(
    userId: string,
    name: string,
    description: string,
    rules: string,
    performance: TradingStrategy['performance'],
    tags: string[] = []
  ): TradingStrategy {
    return {
      id: `strategy_${Date.now()}`,
      userId,
      name,
      description,
      rules,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      followers: 0,
      copiers: 0,
      performance,
      tags,
    };
  }

  /**
   * Calculate leaderboard score
   */
  static calculateLeaderboardScore(strategy: TradingStrategy, followers: number): number {
    let score = 0;

    // Return score (0-30 points)
    score += Math.min(30, Math.max(0, strategy.performance.totalReturn / 5));

    // Sharpe ratio score (0-30 points)
    score += Math.min(30, strategy.performance.sharpeRatio * 10);

    // Win rate score (0-20 points)
    score += (strategy.performance.winRate / 100) * 20;

    // Followers score (0-20 points)
    score += Math.min(20, followers / 50);

    return Math.round(score);
  }

  /**
   * Generate leaderboard
   */
  static generateLeaderboard(
    strategies: TradingStrategy[],
    userProfiles: Map<string, UserProfile>
  ): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    for (const strategy of strategies) {
      const profile = userProfiles.get(strategy.userId);
      if (!profile) continue;

      const score = this.calculateLeaderboardScore(strategy, profile.followersCount);

      entries.push({
        rank: 0,
        userId: strategy.userId,
        username: profile.username,
        avatar: profile.avatar,
        totalReturn: strategy.performance.totalReturn,
        sharpeRatio: strategy.performance.sharpeRatio,
        winRate: strategy.performance.winRate,
        followers: profile.followersCount,
        strategiesCount: profile.strategiesCount,
        score,
      });
    }

    // Sort by score and assign ranks
    return entries
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }

  /**
   * Start copy trading
   */
  static startCopyTrading(
    copierUserId: string,
    strategyId: string,
    strategyCreatorId: string,
    allocationPercentage: number
  ): CopyTradingRecord {
    return {
      id: `copy_${Date.now()}`,
      copierUserId,
      strategyId,
      strategyCreatorId,
      startDate: new Date(),
      status: 'active',
      allocationPercentage,
      performanceTracking: {
        copierReturn: 0,
        originalReturn: 0,
        trackingError: 0,
      },
    };
  }

  /**
   * Calculate copy trading performance
   */
  static calculateCopyTradingPerformance(
    originalReturn: number,
    copierReturn: number,
    allocationPercentage: number
  ): CopyTradingRecord['performanceTracking'] {
    const expectedCopierReturn = (originalReturn * allocationPercentage) / 100;
    const trackingError = Math.abs(copierReturn - expectedCopierReturn);

    return {
      copierReturn,
      originalReturn,
      trackingError,
    };
  }

  /**
   * Validate strategy for sharing
   */
  static validateStrategyForSharing(strategy: TradingStrategy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!strategy.name || strategy.name.length < 3) {
      errors.push('Strategy name must be at least 3 characters');
    }

    if (!strategy.description || strategy.description.length < 10) {
      errors.push('Strategy description must be at least 10 characters');
    }

    if (!strategy.rules || strategy.rules.length < 20) {
      errors.push('Strategy rules must be at least 20 characters');
    }

    if (strategy.performance.totalReturn === undefined) {
      errors.push('Strategy must have performance metrics');
    }

    if (strategy.tags.length === 0) {
      errors.push('Strategy must have at least one tag');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Search strategies
   */
  static searchStrategies(
    strategies: TradingStrategy[],
    query: string,
    filters?: {
      minReturn?: number;
      minSharpeRatio?: number;
      minWinRate?: number;
      tags?: string[];
    }
  ): TradingStrategy[] {
    let results = strategies.filter((s) => s.isPublic);

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerQuery) ||
          s.description.toLowerCase().includes(lowerQuery) ||
          s.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.minReturn !== undefined) {
        results = results.filter((s) => s.performance.totalReturn >= filters.minReturn!);
      }

      if (filters.minSharpeRatio !== undefined) {
        results = results.filter((s) => s.performance.sharpeRatio >= filters.minSharpeRatio!);
      }

      if (filters.minWinRate !== undefined) {
        results = results.filter((s) => s.performance.winRate >= filters.minWinRate!);
      }

      if (filters.tags && filters.tags.length > 0) {
        results = results.filter((s) => filters.tags!.some((tag) => s.tags.includes(tag)));
      }
    }

    return results.sort((a, b) => b.followers - a.followers);
  }

  /**
   * Generate strategy recommendations
   */
  static generateRecommendations(
    strategies: TradingStrategy[],
    userInterests: string[]
  ): TradingStrategy[] {
    return strategies
      .filter((s) => s.isPublic && s.tags.some((tag) => userInterests.includes(tag)))
      .sort((a, b) => {
        // Score based on performance and popularity
        const scoreA = (a.performance.totalReturn + a.performance.sharpeRatio * 10 + a.followers / 10) / 3;
        const scoreB = (b.performance.totalReturn + b.performance.sharpeRatio * 10 + b.followers / 10) / 3;
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }

  /**
   * Calculate influencer score
   */
  static calculateInfluencerScore(profile: UserProfile, strategies: TradingStrategy[]): number {
    let score = 0;

    // Followers score (0-30 points)
    score += Math.min(30, profile.followersCount / 100);

    // Strategies count score (0-20 points)
    score += Math.min(20, profile.strategiesCount * 2);

    // Average strategy performance (0-50 points)
    if (strategies.length > 0) {
      const avgReturn = strategies.reduce((sum, s) => sum + s.performance.totalReturn, 0) / strategies.length;
      const avgSharpe = strategies.reduce((sum, s) => sum + s.performance.sharpeRatio, 0) / strategies.length;
      score += Math.min(50, (avgReturn / 5 + avgSharpe * 10) / 2);
    }

    return Math.round(score);
  }

  /**
   * Validate copy trading allocation
   */
  static validateCopyTradingAllocation(
    totalAllocation: number,
    newAllocation: number,
    maxAllocationPerStrategy: number = 50
  ): { valid: boolean; error?: string } {
    if (newAllocation < 1 || newAllocation > maxAllocationPerStrategy) {
      return {
        valid: false,
        error: `Allocation must be between 1% and ${maxAllocationPerStrategy}%`,
      };
    }

    if (totalAllocation + newAllocation > 100) {
      return {
        valid: false,
        error: 'Total allocation cannot exceed 100%',
      };
    }

    return { valid: true };
  }
}

export default SocialTradingService;
