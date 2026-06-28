import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { dayTradingPositions } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface StrategyMetrics {
  strategyName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  roi: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
}

// Функция для генерации CSV
function generateCSV(strategies: StrategyMetrics[]): string {
  const headers = [
    'Strategy Name',
    'Total Trades',
    'Winning Trades',
    'Losing Trades',
    'Win Rate (%)',
    'Total Profit',
    'Total Loss',
    'ROI (%)',
    'Profit Factor',
    'Sharpe Ratio',
    'Max Drawdown (%)',
    'Average Win',
    'Average Loss',
    'Largest Win',
    'Largest Loss',
  ];

  const rows = strategies.map((s) => [
    `"${s.strategyName}"`,
    s.totalTrades,
    s.winningTrades,
    s.losingTrades,
    s.winRate.toFixed(2),
    s.totalProfit.toFixed(2),
    s.totalLoss.toFixed(2),
    s.roi.toFixed(2),
    s.profitFactor.toFixed(2),
    s.sharpeRatio.toFixed(2),
    s.maxDrawdown.toFixed(2),
    s.averageWin.toFixed(2),
    s.averageLoss.toFixed(2),
    s.largestWin.toFixed(2),
    s.largestLoss.toFixed(2),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return csv;
}

// Функция для генерации HTML для PDF
function generateHTML(strategies: StrategyMetrics[], title: string): string {
  const timestamp = new Date().toLocaleString();

  const tableRows = strategies
    .map(
      (s) => `
    <tr>
      <td>${s.strategyName}</td>
      <td>${s.totalTrades}</td>
      <td>${s.winningTrades}</td>
      <td>${s.losingTrades}</td>
      <td>${s.winRate.toFixed(2)}%</td>
      <td>$${s.totalProfit.toFixed(2)}</td>
      <td>$${s.totalLoss.toFixed(2)}</td>
      <td>${s.roi.toFixed(2)}%</td>
      <td>${s.profitFactor.toFixed(2)}</td>
      <td>${s.sharpeRatio.toFixed(2)}</td>
      <td>${s.maxDrawdown.toFixed(2)}%</td>
      <td>$${s.averageWin.toFixed(2)}</td>
      <td>$${s.averageLoss.toFixed(2)}</td>
      <td>$${s.largestWin.toFixed(2)}</td>
      <td>$${s.largestLoss.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          h1 {
            color: #333;
            margin: 0;
          }
          .timestamp {
            color: #666;
            font-size: 12px;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th {
            background-color: #2c3e50;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border-bottom: 2px solid #34495e;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #ecf0f1;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f0f0f0;
          }
          .positive {
            color: #27ae60;
            font-weight: bold;
          }
          .negative {
            color: #e74c3c;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #999;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="timestamp">Generated: ${timestamp}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Strategy Name</th>
              <th>Total Trades</th>
              <th>Winning Trades</th>
              <th>Losing Trades</th>
              <th>Win Rate</th>
              <th>Total Profit</th>
              <th>Total Loss</th>
              <th>ROI</th>
              <th>Profit Factor</th>
              <th>Sharpe Ratio</th>
              <th>Max Drawdown</th>
              <th>Avg Win</th>
              <th>Avg Loss</th>
              <th>Largest Win</th>
              <th>Largest Loss</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <p>CAN SLIM Crypto Scanner - Strategy Performance Report</p>
          <p>This report is confidential and for internal use only.</p>
        </div>
      </body>
    </html>
  `;

  return html;
}

export const reportExportRouter = router({
  // Экспорт в CSV
  exportToCSV: protectedProcedure
    .input(
      z.object({
        strategies: z.array(
          z.object({
            strategyName: z.string(),
            totalTrades: z.number(),
            winningTrades: z.number(),
            losingTrades: z.number(),
            winRate: z.number(),
            totalProfit: z.number(),
            totalLoss: z.number(),
            roi: z.number(),
            profitFactor: z.number(),
            sharpeRatio: z.number(),
            maxDrawdown: z.number(),
            averageWin: z.number(),
            averageLoss: z.number(),
            largestWin: z.number(),
            largestLoss: z.number(),
          })
        ),
        filename: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const csv = generateCSV(input.strategies);
        const filename = input.filename || `strategy-report-${Date.now()}.csv`;

        return {
          success: true,
          data: csv,
          filename,
          mimeType: 'text/csv',
        };
      } catch (error: any) {
        throw new Error(`Failed to export to CSV: ${error.message}`);
      }
    }),

  // Экспорт в HTML (для PDF конвертации)
  exportToHTML: protectedProcedure
    .input(
      z.object({
        strategies: z.array(
          z.object({
            strategyName: z.string(),
            totalTrades: z.number(),
            winningTrades: z.number(),
            losingTrades: z.number(),
            winRate: z.number(),
            totalProfit: z.number(),
            totalLoss: z.number(),
            roi: z.number(),
            profitFactor: z.number(),
            sharpeRatio: z.number(),
            maxDrawdown: z.number(),
            averageWin: z.number(),
            averageLoss: z.number(),
            largestWin: z.number(),
            largestLoss: z.number(),
          })
        ),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const title = input.title || 'Strategy Performance Report';
        const html = generateHTML(input.strategies, title);

        return {
          success: true,
          data: html,
          mimeType: 'text/html',
        };
      } catch (error: any) {
        throw new Error(`Failed to export to HTML: ${error.message}`);
      }
    }),

  // Получить данные для экспорта по стратегии
  getStrategyReportData: protectedProcedure
    .input(
      z.object({
        strategyName: z.string(),
        startDate: z.number(),
        endDate: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }

        const userId = ctx.user?.id ? parseInt(String(ctx.user.id)) : 0;
        const positions: any[] = await db
          .select()
          .from(dayTradingPositions)
          .where(
            and(
              eq(dayTradingPositions.userId, userId),
              eq(dayTradingPositions.strategyName, input.strategyName),
              gte(dayTradingPositions.openTime, input.startDate),
              lte(dayTradingPositions.openTime, input.endDate)
            )
          );

        if (!positions || positions.length === 0) {
          return {
            success: true,
            data: null,
            error: 'No positions found for this strategy',
          };
        }

        // Рассчитываем метрики
        const winningTrades = positions.filter((p: any) => p.profitLoss > 0).length;
        const losingTrades = positions.filter((p: any) => p.profitLoss < 0).length;
        const totalProfit = positions
          .filter((p: any) => p.profitLoss > 0)
          .reduce((sum: number, p: any) => sum + p.profitLoss, 0);
        const totalLoss = Math.abs(
          positions
            .filter((p: any) => p.profitLoss < 0)
            .reduce((sum: number, p: any) => sum + p.profitLoss, 0)
        );

        const metrics: StrategyMetrics = {
          strategyName: input.strategyName,
          totalTrades: positions.length,
          winningTrades,
          losingTrades,
          winRate: (winningTrades / positions.length) * 100,
          totalProfit,
          totalLoss,
          roi: totalProfit > 0 ? (totalProfit / totalLoss) * 100 : 0,
          profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0,
          sharpeRatio: 0, // Требует дополнительных расчётов
          maxDrawdown: 0, // Требует дополнительных расчётов
          averageWin: winningTrades > 0 ? totalProfit / winningTrades : 0,
          averageLoss: losingTrades > 0 ? totalLoss / losingTrades : 0,
          largestWin: Math.max(...positions.map((p: any) => p.profitLoss), 0),
          largestLoss: Math.abs(Math.min(...positions.map((p: any) => p.profitLoss), 0)),
        };

        return {
          success: true,
          data: metrics,
          error: null,
        };
      } catch (error: any) {
        throw new Error(`Failed to get strategy report data: ${error.message}`);
      }
    }),
});
