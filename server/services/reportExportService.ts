/**
 * Report Export Service
 * Generates and exports reports in PDF and Excel formats
 */

import { Workbook } from "exceljs";
import { PDFDocument, rgb, PDFPage as _PDFPage } from "pdf-lib";
import * as _fs from "fs";
import * as _path from "path";

export interface PortfolioReport {
  userId: string;
  totalValue: number;
  totalGain: number;
  gainPercent: number;
  positions: Array<{
    ticker: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    gain: number;
    gainPercent: number;
  }>;
  timestamp: Date;
}

export interface BacktestReport {
  strategyId: string;
  strategyName: string;
  ticker: string;
  period: string;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalReturn: number;
  trades: number;
  timestamp: Date;
}

export interface SentimentReport {
  ticker: string;
  overallSentiment: number;
  averageConfidence: number;
  dominantSentiment: string;
  distribution: Record<string, number>;
  trends: {
    "1D": { trend: string; momentum: number };
    "7D": { trend: string; momentum: number };
  };
  timestamp: Date;
}

export class ReportExportService {
  /**
   * Export portfolio report to Excel
   */
  static async exportPortfolioToExcel(report: PortfolioReport): Promise<Buffer> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Portfolio");

    // Add title
    worksheet.mergeCells("A1:D1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Portfolio Report - ${new Date(report.timestamp).toLocaleDateString()}`;
    titleCell.font = { bold: true, size: 14 };
    (titleCell.alignment as any) = { horizontal: "justify", vertical: "center" };

    // Add summary section
    worksheet.mergeCells("A3:D3");
    const summaryTitle = worksheet.getCell("A3");
    summaryTitle.value = "Summary";
    summaryTitle.font = { bold: true, size: 12 };

    worksheet.getCell("A4").value = "Total Value:";
    worksheet.getCell("B4").value = `$${report.totalValue.toFixed(2)}`;
    worksheet.getCell("A5").value = "Total Gain:";
    worksheet.getCell("B5").value = `$${report.totalGain.toFixed(2)}`;
    worksheet.getCell("A6").value = "Gain %:";
    worksheet.getCell("B6").value = `${report.gainPercent.toFixed(2)}%`;

    // Add positions table
    worksheet.mergeCells("A8:F8");
    const positionsTitle = worksheet.getCell("A8");
    positionsTitle.value = "Positions";
    positionsTitle.font = { bold: true, size: 12 };

    // Headers
    const headers = ["Ticker", "Quantity", "Avg Price", "Current Price", "Gain", "Gain %"];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(9, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
    });

    // Add positions data
    report.positions.forEach((position, index) => {
      const row = 10 + index;
      worksheet.getCell(row, 1).value = position.ticker;
      worksheet.getCell(row, 2).value = position.quantity;
      worksheet.getCell(row, 3).value = `$${position.avgPrice.toFixed(2)}`;
      worksheet.getCell(row, 4).value = `$${position.currentPrice.toFixed(2)}`;
      worksheet.getCell(row, 5).value = `$${position.gain.toFixed(2)}`;
      worksheet.getCell(row, 6).value = `${position.gainPercent.toFixed(2)}%`;
    });

    // Set column widths
    worksheet.columns = [
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 14 },
      { width: 12 },
      { width: 12 },
    ];

    return (await workbook.xlsx.writeBuffer()) as any as Buffer;
  }

  /**
   * Export backtest report to Excel
   */
  static async exportBacktestToExcel(report: BacktestReport): Promise<Buffer> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Backtest Results");

    // Add title
    worksheet.mergeCells("A1:D1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Backtest Report - ${report.strategyName}`;
    titleCell.font = { bold: true, size: 14 };
    (titleCell.alignment as any) = { horizontal: "justify", vertical: "center" };

    // Add summary section
    worksheet.mergeCells("A3:D3");
    const summaryTitle = worksheet.getCell("A3");
    summaryTitle.value = "Strategy Details";
    summaryTitle.font = { bold: true, size: 12 };

    worksheet.getCell("A4").value = "Strategy:";
    worksheet.getCell("B4").value = report.strategyName;
    worksheet.getCell("A5").value = "Ticker:";
    worksheet.getCell("B5").value = report.ticker;
    worksheet.getCell("A6").value = "Period:";
    worksheet.getCell("B6").value = report.period;
    worksheet.getCell("A7").value = "Test Date:";
    worksheet.getCell("B7").value = new Date(report.timestamp).toLocaleDateString();

    // Add metrics section
    worksheet.mergeCells("A9:D9");
    const metricsTitle = worksheet.getCell("A9");
    metricsTitle.value = "Performance Metrics";
    metricsTitle.font = { bold: true, size: 12 };

    const metrics = [
      ["Sharpe Ratio:", report.sharpeRatio.toFixed(4)],
      ["Max Drawdown:", `${(report.maxDrawdown * 100).toFixed(2)}%`],
      ["Win Rate:", `${(report.winRate * 100).toFixed(2)}%`],
      ["Profit Factor:", report.profitFactor.toFixed(4)],
      ["Total Return:", `${(report.totalReturn * 100).toFixed(2)}%`],
      ["Total Trades:", report.trades],
    ];

    metrics.forEach((metric, index) => {
      const row = 10 + index;
      worksheet.getCell(row, 1).value = metric[0];
      worksheet.getCell(row, 2).value = metric[1];
    });

    // Set column widths
    worksheet.columns = [{ width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }];

    return (await workbook.xlsx.writeBuffer()) as any as Buffer;
  }

  /**
   * Export sentiment report to Excel
   */
  static async exportSentimentToExcel(report: SentimentReport): Promise<Buffer> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Sentiment Analysis");

    // Add title
    worksheet.mergeCells("A1:D1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Sentiment Report - ${report.ticker}`;
    titleCell.font = { bold: true, size: 14 };
    (titleCell.alignment as any) = { horizontal: "justify", vertical: "center" };

    // Add summary section
    worksheet.mergeCells("A3:D3");
    const summaryTitle = worksheet.getCell("A3");
    summaryTitle.value = "Overall Sentiment";
    summaryTitle.font = { bold: true, size: 12 };

    worksheet.getCell("A4").value = "Overall Sentiment:";
    worksheet.getCell("B4").value = report.overallSentiment.toFixed(4);
    worksheet.getCell("A5").value = "Average Confidence:";
    worksheet.getCell("B5").value = `${(report.averageConfidence * 100).toFixed(2)}%`;
    worksheet.getCell("A6").value = "Dominant Sentiment:";
    worksheet.getCell("B6").value = report.dominantSentiment;

    // Add distribution section
    worksheet.mergeCells("A8:D8");
    const distributionTitle = worksheet.getCell("A8");
    distributionTitle.value = "Sentiment Distribution";
    distributionTitle.font = { bold: true, size: 12 };

    let row = 9;
    Object.entries(report.distribution).forEach(([sentiment, count]) => {
      worksheet.getCell(row, 1).value = sentiment;
      worksheet.getCell(row, 2).value = count;
      row++;
    });

    // Add trends section
    worksheet.mergeCells("A" + (row + 1) + ":D" + (row + 1));
    const trendsTitle = worksheet.getCell(row + 1, 1);
    trendsTitle.value = "Trends";
    trendsTitle.font = { bold: true, size: 12 };

    row += 2;
    worksheet.getCell(row, 1).value = "Period";
    worksheet.getCell(row, 2).value = "Trend";
    worksheet.getCell(row, 3).value = "Momentum";
    row++;

    Object.entries(report.trends).forEach(([period, trend]) => {
      worksheet.getCell(row, 1).value = period;
      worksheet.getCell(row, 2).value = trend.trend;
      worksheet.getCell(row, 3).value = trend.momentum.toFixed(4);
      row++;
    });

    // Set column widths
    worksheet.columns = [{ width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }];

    return (await workbook.xlsx.writeBuffer()) as any as Buffer;
  }

  /**
   * Export portfolio report to PDF
   */
  static async exportPortfolioToPDF(report: PortfolioReport): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([612, 792]); // Letter size
    let y = 750;

    const fontSize = 12;
    const titleFontSize = 18;

    // Add title
    page.drawText(`Portfolio Report - ${new Date(report.timestamp).toLocaleDateString()}`, {
      x: 50,
      y,
      size: titleFontSize,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    // Add summary
    page.drawText("Summary", { x: 50, y, size: 14, color: rgb(0, 0, 0) });
    y -= 20;

    const summaryLines = [
      `Total Value: $${report.totalValue.toFixed(2)}`,
      `Total Gain: $${report.totalGain.toFixed(2)}`,
      `Gain %: ${report.gainPercent.toFixed(2)}%`,
    ];

    summaryLines.forEach((line) => {
      page.drawText(line, { x: 70, y, size: fontSize, color: rgb(0, 0, 0) });
      y -= 15;
    });

    y -= 10;

    // Add positions table
    page.drawText("Positions", { x: 50, y, size: 14, color: rgb(0, 0, 0) });
    y -= 20;

    // Table headers
    const headers = ["Ticker", "Qty", "Avg Price", "Current Price", "Gain", "Gain %"];
    const colWidths = [80, 60, 100, 110, 80, 80];
    let x = 50;

    headers.forEach((header, index) => {
      page.drawText(header, {
        x,
        y,
        size: fontSize,
        color: rgb(255, 255, 255),
      });
      x += colWidths[index];
    });

    // Draw header background
    page.drawRectangle({
      x: 50,
      y: y - 15,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: 15,
      color: rgb(200, 200, 200),
    });

    y -= 30;

    // Add positions data
    report.positions.forEach((position) => {
      if (y < 100) {
        page = pdfDoc.addPage([612, 792]);
        y = 750;
      }

      x = 50;
      const positionData = [
        position.ticker,
        position.quantity.toString(),
        `$${position.avgPrice.toFixed(2)}`,
        `$${position.currentPrice.toFixed(2)}`,
        `$${position.gain.toFixed(2)}`,
        `${position.gainPercent.toFixed(2)}%`,
      ];

      positionData.forEach((data, index) => {
        page.drawText(data, { x, y, size: fontSize, color: rgb(0, 0, 0) });
        x += colWidths[index];
      });

      y -= 15;
    });

    return Buffer.from(await pdfDoc.save());
  }

  /**
   * Export backtest report to PDF
   */
  static async exportBacktestToPDF(report: BacktestReport): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    let y = 750;

    const fontSize = 12;
    const titleFontSize = 18;

    // Add title
    page.drawText(`Backtest Report - ${report.strategyName}`, {
      x: 50,
      y,
      size: titleFontSize,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    // Add strategy details
    page.drawText("Strategy Details", { x: 50, y, size: 14, color: rgb(0, 0, 0) });
    y -= 20;

    const detailsLines = [
      `Strategy: ${report.strategyName}`,
      `Ticker: ${report.ticker}`,
      `Period: ${report.period}`,
      `Test Date: ${new Date(report.timestamp).toLocaleDateString()}`,
    ];

    detailsLines.forEach((line) => {
      page.drawText(line, { x: 70, y, size: fontSize, color: rgb(0, 0, 0) });
      y -= 15;
    });

    y -= 10;

    // Add metrics
    page.drawText("Performance Metrics", { x: 50, y, size: 14, color: rgb(0, 0, 0) });
    y -= 20;

    const metricsLines = [
      `Sharpe Ratio: ${report.sharpeRatio.toFixed(4)}`,
      `Max Drawdown: ${(report.maxDrawdown * 100).toFixed(2)}%`,
      `Win Rate: ${(report.winRate * 100).toFixed(2)}%`,
      `Profit Factor: ${report.profitFactor.toFixed(4)}`,
      `Total Return: ${(report.totalReturn * 100).toFixed(2)}%`,
      `Total Trades: ${report.trades}`,
    ];

    metricsLines.forEach((line) => {
      page.drawText(line, { x: 70, y, size: fontSize, color: rgb(0, 0, 0) });
      y -= 15;
    });

    return Buffer.from(await pdfDoc.save());
  }

  /**
   * Export sentiment report to PDF
   */
  static async exportSentimentToPDF(report: SentimentReport): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    let y = 750;

    const fontSize = 12;
    const titleFontSize = 18;

    // Add title
    page.drawText(`Sentiment Report - ${report.ticker}`, {
      x: 50,
      y,
      size: titleFontSize,
      color: rgb(0, 0, 0),
    });
    y -= 30;

    // Add overall sentiment
    page.drawText("Overall Sentiment", { x: 50, y, size: 14, color: rgb(0, 0, 0) });
    y -= 20;

    const sentimentLines = [
      `Overall Sentiment: ${report.overallSentiment.toFixed(4)}`,
      `Average Confidence: ${(report.averageConfidence * 100).toFixed(2)}%`,
      `Dominant Sentiment: ${report.dominantSentiment}`,
    ];

    sentimentLines.forEach((line) => {
      page.drawText(line, { x: 70, y, size: fontSize, color: rgb(0, 0, 0) });
      y -= 15;
    });

    y -= 10;

    // Add distribution
    page.drawText("Sentiment Distribution", { x: 50, y, size: 14, color: rgb(0, 0, 0) });
    y -= 20;

    Object.entries(report.distribution).forEach(([sentiment, count]) => {
      page.drawText(`${sentiment}: ${count}`, { x: 70, y, size: fontSize, color: rgb(0, 0, 0) });
      y -= 15;
    });

    y -= 10;

    // Add trends
    page.drawText("Trends", { x: 50, y, size: 14, color: rgb(0, 0, 0) });
    y -= 20;

    Object.entries(report.trends).forEach(([period, trend]) => {
      page.drawText(
        `${period}: ${trend.trend} (Momentum: ${trend.momentum.toFixed(4)})`,
        { x: 70, y, size: fontSize, color: rgb(0, 0, 0) }
      );
      y -= 15;
    });

    return Buffer.from(await pdfDoc.save());
  }
}

export default ReportExportService;
