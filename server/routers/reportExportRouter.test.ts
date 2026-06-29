import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reportExportRouter } from './reportExportRouter';

describe('reportExportRouter', () => {
  const mockStrategies = [
    {
      strategyName: 'Strategy A',
      totalTrades: 100,
      winningTrades: 60,
      losingTrades: 40,
      winRate: 60,
      totalProfit: 5000,
      totalLoss: 2000,
      roi: 250,
      profitFactor: 2.5,
      sharpeRatio: 1.5,
      maxDrawdown: -1000,
      averageWin: 83.33,
      averageLoss: 50,
      largestWin: 500,
      largestLoss: 300,
    },
    {
      strategyName: 'Strategy B',
      totalTrades: 80,
      winningTrades: 48,
      losingTrades: 32,
      winRate: 60,
      totalProfit: 4000,
      totalLoss: 1500,
      roi: 266.67,
      profitFactor: 2.67,
      sharpeRatio: 1.8,
      maxDrawdown: -800,
      averageWin: 83.33,
      averageLoss: 46.88,
      largestWin: 450,
      largestLoss: 250,
    },
  ];

  describe('exportToCSV', () => {
    it('should export strategies to CSV format', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToCSV({
        strategies: mockStrategies,
        filename: 'test-report.csv',
      });

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toBe('test-report.csv');
      expect(result.data).toContain('Strategy Name');
      expect(result.data).toContain('Strategy A');
      expect(result.data).toContain('Strategy B');
      expect(result.data).toContain('60.00'); // Win rate
    });

    it('should generate valid CSV with proper formatting', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToCSV({
        strategies: mockStrategies,
      });

      const lines = result.data.split('\n');
      expect(lines.length).toBeGreaterThan(2); // Header + at least 2 strategies
      expect(lines[0]).toContain('Strategy Name');
    });
  });

  describe('exportToHTML', () => {
    it('should export strategies to HTML format', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToHTML({
        strategies: mockStrategies,
        title: 'Test Report',
      });

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('text/html');
      expect(result.data).toContain('<!DOCTYPE html>');
      expect(result.data).toContain('Test Report');
      expect(result.data).toContain('Strategy A');
      expect(result.data).toContain('Strategy B');
    });

    it('should include table structure in HTML', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToHTML({
        strategies: mockStrategies,
      });

      expect(result.data).toContain('<table>');
      expect(result.data).toContain('</table>');
      expect(result.data).toContain('<thead>');
      expect(result.data).toContain('<tbody>');
      expect(result.data).toContain('<tr>');
      expect(result.data).toContain('<td>');
    });

    it('should include styling in HTML', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToHTML({
        strategies: mockStrategies,
      });

      expect(result.data).toContain('<style>');
      expect(result.data).toContain('</style>');
      expect(result.data).toContain('font-family');
      expect(result.data).toContain('border-collapse');
    });
  });

  describe('exportToCSV with empty strategies', () => {
    it('should handle empty strategies array', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToCSV({
        strategies: [],
      });

      expect(result.success).toBe(true);
      expect(result.data).toContain('Strategy Name');
    });
  });

  describe('exportToHTML with empty strategies', () => {
    it('should handle empty strategies array', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToHTML({
        strategies: [],
      });

      expect(result.success).toBe(true);
      expect(result.data).toContain('<!DOCTYPE html>');
    });
  });

  describe('CSV format validation', () => {
    it('should properly escape quotes in strategy names', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const strategiesWithQuotes = [
        {
          ...mockStrategies[0],
          strategyName: 'Strategy "Test" A',
        },
      ];

      const result = await caller.exportToCSV({
        strategies: strategiesWithQuotes,
      });

      expect(result.success).toBe(true);
      expect(result.data).toContain('"Strategy "Test" A"');
    });
  });

  describe('HTML format validation', () => {
    it('should include timestamp in HTML', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToHTML({
        strategies: mockStrategies,
      });

      expect(result.data).toContain('Generated:');
    });

    it('should include footer with disclaimer', async () => {
      const caller = reportExportRouter.createCaller({
        user: { id: 1 },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.exportToHTML({
        strategies: mockStrategies,
      });

      expect(result.data).toContain('CAN SLIM Crypto Scanner');
      expect(result.data).toContain('confidential');
    });
  });
});
