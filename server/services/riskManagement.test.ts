import { describe, it, expect } from 'vitest';
import {
  calculatePositionSize,
  calculateRiskRewardRatio,
  calculatePnL,
  calculatePortfolioStats,
  canOpenPosition,
  getRecommendedPositionSize,
  getOptimalTakeProfitLevels,
  getOptimalStopLoss,
  Position,
  RiskParameters,
} from './riskManagement';

describe('Risk Management', () => {
  describe('Position Size Calculation', () => {
    it('should calculate correct position size', () => {
      const size = calculatePositionSize(
        10000, // accountBalance
        2, // riskPercentage
        45000, // entryPrice
        44800 // stopLossPrice
      );

      // Risk = 10000 * 0.02 = 200
      // Risk per unit = 45000 - 44800 = 200
      // Position size = 200 / 200 = 1
      expect(size).toBe(1);
    });

    it('should handle zero risk per unit', () => {
      const size = calculatePositionSize(
        10000,
        2,
        45000,
        45000 // Same as entry price
      );

      expect(size).toBe(0);
    });

    it('should calculate smaller position for larger stop loss', () => {
      const size1 = calculatePositionSize(10000, 2, 45000, 44800);
      const size2 = calculatePositionSize(10000, 2, 45000, 44500);

      expect(size2).toBeLessThan(size1);
    });
  });

  describe('Risk/Reward Ratio', () => {
    it('should calculate correct R:R ratio', () => {
      const rrr = calculateRiskRewardRatio(45000, 44800, 45500);

      expect(rrr.riskAmount).toBe(200);
      expect(rrr.rewardAmount).toBe(500);
      expect(rrr.ratio).toBe(2.5);
      expect(rrr.isValid).toBe(true);
    });

    it('should mark invalid ratio when less than 1.5', () => {
      const rrr = calculateRiskRewardRatio(45000, 44800, 45100);

      expect(rrr.ratio).toBe(0.5);
      expect(rrr.isValid).toBe(false);
    });

    it('should mark invalid ratio when less than 1.5', () => {
      const rrr = calculateRiskRewardRatio(45000, 44800, 45050);

      expect(rrr.ratio).toBeLessThan(1.5);
      expect(rrr.isValid).toBe(false);
    });
  });

  describe('P&L Calculation', () => {
    it('should calculate profit correctly', () => {
      const position: Position = {
        id: '1',
        asset: 'BTC/USD',
        entryPrice: 45000,
        currentPrice: 45500,
        quantity: 1,
        stopLoss: 44800,
        takeProfit: 46000,
        entryTime: Date.now(),
        status: 'OPEN',
        pnl: 0,
        pnlPercentage: 0,
      };

      const pnl = calculatePnL(position);

      expect(pnl.pnl).toBe(500);
      expect(pnl.pnlPercentage).toBeCloseTo(1.11, 1);
      expect(pnl.status).toBe('profit');
    });

    it('should calculate loss correctly', () => {
      const position: Position = {
        id: '1',
        asset: 'BTC/USD',
        entryPrice: 45000,
        currentPrice: 44500,
        quantity: 1,
        stopLoss: 44800,
        takeProfit: 46000,
        entryTime: Date.now(),
        status: 'OPEN',
        pnl: 0,
        pnlPercentage: 0,
      };

      const pnl = calculatePnL(position);

      expect(pnl.pnl).toBe(-500);
      expect(pnl.pnlPercentage).toBeCloseTo(-1.11, 1);
      expect(pnl.status).toBe('loss');
    });

    it('should handle breakeven correctly', () => {
      const position: Position = {
        id: '1',
        asset: 'BTC/USD',
        entryPrice: 45000,
        currentPrice: 45000,
        quantity: 1,
        stopLoss: 44800,
        takeProfit: 46000,
        entryTime: Date.now(),
        status: 'OPEN',
        pnl: 0,
        pnlPercentage: 0,
      };

      const pnl = calculatePnL(position);

      expect(pnl.pnl).toBe(0);
      expect(pnl.pnlPercentage).toBe(0);
      expect(pnl.status).toBe('breakeven');
    });
  });

  describe('Portfolio Statistics', () => {
    it('should calculate portfolio stats correctly', () => {
      const positions: Position[] = [
        {
          id: '1',
          asset: 'BTC/USD',
          entryPrice: 45000,
          currentPrice: 45500,
          quantity: 1,
          stopLoss: 44800,
          takeProfit: 46000,
          entryTime: Date.now(),
          status: 'CLOSED',
          pnl: 500,
          pnlPercentage: 1.11,
        },
        {
          id: '2',
          asset: 'ETH/USD',
          entryPrice: 2500,
          currentPrice: 2400,
          quantity: 1,
          stopLoss: 2450,
          takeProfit: 2550,
          entryTime: Date.now(),
          status: 'CLOSED',
          pnl: -100,
          pnlPercentage: -4,
        },
      ];

      const stats = calculatePortfolioStats(positions);

      expect(stats.totalPnL).toBe(400);
      expect(stats.winRate).toBe(50);
      expect(stats.closedPositions).toBe(2);
      expect(stats.openPositions).toBe(0);
    });

    it('should calculate profit factor correctly', () => {
      const positions: Position[] = [
        {
          id: '1',
          asset: 'BTC/USD',
          entryPrice: 45000,
          currentPrice: 45500,
          quantity: 1,
          stopLoss: 44800,
          takeProfit: 46000,
          entryTime: Date.now(),
          status: 'CLOSED',
          pnl: 500,
          pnlPercentage: 1.11,
        },
        {
          id: '2',
          asset: 'ETH/USD',
          entryPrice: 2500,
          currentPrice: 2400,
          quantity: 1,
          stopLoss: 2450,
          takeProfit: 2550,
          entryTime: Date.now(),
          status: 'CLOSED',
          pnl: -100,
          pnlPercentage: -4,
        },
      ];

      const stats = calculatePortfolioStats(positions);

      // Profit factor = 500 / 100 = 5
      expect(stats.profitFactor).toBe(5);
    });
  });

  describe('Position Opening Validation', () => {
    it('should allow opening position when conditions are met', () => {
      const riskParams: RiskParameters = {
        accountBalance: 10000,
        riskPercentage: 2,
        maxPositions: 5,
        maxDrawdown: 10,
        dailyLossLimit: 500,
      };

      const result = canOpenPosition([], riskParams, 10000, 0);

      expect(result.canOpen).toBe(true);
    });

    it('should prevent opening position when max positions reached', () => {
      const positions: Position[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `${i}`,
          asset: 'BTC/USD',
          entryPrice: 45000,
          currentPrice: 45000,
          quantity: 1,
          stopLoss: 44800,
          takeProfit: 46000,
          entryTime: Date.now(),
          status: 'OPEN' as const,
          pnl: 0,
          pnlPercentage: 0,
        }));

      const riskParams: RiskParameters = {
        accountBalance: 10000,
        riskPercentage: 2,
        maxPositions: 5,
        maxDrawdown: 10,
        dailyLossLimit: 500,
      };

      const result = canOpenPosition(positions, riskParams, 10000, 0);

      expect(result.canOpen).toBe(false);
      expect(result.reason).toContain('максимум');
    });

    it('should prevent opening position when daily loss limit exceeded', () => {
      const riskParams: RiskParameters = {
        accountBalance: 10000,
        riskPercentage: 2,
        maxPositions: 5,
        maxDrawdown: 10,
        dailyLossLimit: 500,
      };

      const result = canOpenPosition([], riskParams, 10000, 600);

      expect(result.canOpen).toBe(false);
      expect(result.reason).toContain('дневной');
    });
  });

  describe('Optimal Take Profit Levels', () => {
    it('should calculate optimal take profit levels', () => {
      const levels = getOptimalTakeProfitLevels(45000, 200);

      expect(levels.length).toBe(3);
      expect(levels[0].price).toBe(45300); // 45000 + 200 * 1.5
      expect(levels[0].percentageToClose).toBe(50);
      expect(levels[1].price).toBe(45500); // 45000 + 200 * 2.5
      expect(levels[1].percentageToClose).toBe(30);
      expect(levels[2].price).toBe(45700); // 45000 + 200 * 3.5
      expect(levels[2].percentageToClose).toBe(20);
    });
  });

  describe('Optimal Stop Loss', () => {
    it('should calculate optimal stop loss for long position', () => {
      const stopLoss = getOptimalStopLoss(45000, 2, 'long');

      // 45000 - (45000 * 0.02) = 45000 - 900 = 44100
      expect(stopLoss).toBe(44100);
    });

    it('should calculate optimal stop loss for short position', () => {
      const stopLoss = getOptimalStopLoss(45000, 2, 'short');

      // 45000 + (45000 * 0.02) = 45000 + 900 = 45900
      expect(stopLoss).toBe(45900);
    });
  });

  describe('Recommended Position Size', () => {
    it('should return recommended position size', () => {
      const riskParams: RiskParameters = {
        accountBalance: 10000,
        riskPercentage: 2,
        maxPositions: 5,
        maxDrawdown: 10,
        dailyLossLimit: 500,
      };

      const size = getRecommendedPositionSize(riskParams, 45000, 44800);

      // Risk = 10000 * 0.02 = 200
      // Risk per unit = 45000 - 44800 = 200
      // Position size = 200 / 200 = 1
      expect(size).toBe(1);
    });
  });
});
