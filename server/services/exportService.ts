import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, BorderStyle, WidthType, HeadingLevel, PageBreak, AlignmentType } from "docx";
import * as XLSX from "xlsx";
import { Readable } from "stream";

export interface AssetReport {
  ticker: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  totalScore: number;
  criteria: {
    c: number;
    a: number;
    n: number;
    s: number;
    l: number;
    i: number;
    m: number;
  };
  description: string;
  generatedAt: Date;
}

export interface PortfolioData {
  assets: Array<{
    ticker: string;
    name: string;
    price: number;
    change24h: number;
    score: number;
    allocation: number;
  }>;
  totalValue: number;
  generatedAt: Date;
}

/**
 * Генерировать PDF отчет об активе
 */
export async function generateAssetPDF(report: AssetReport): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          // Заголовок
          new Paragraph({
            text: `${report.ticker} - CAN SLIM Analysis Report`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),

          // Дата генерации
          new Paragraph({
            text: `Generated: ${report.generatedAt.toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            style: "Normal",
          }),

          // Основная информация
          new Paragraph({
            text: "Asset Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("Asset")],
                    shading: { fill: "E8E8E8" },
                  }),
                  new TableCell({
                    children: [new Paragraph(report.name)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("Ticker")],
                    shading: { fill: "E8E8E8" },
                  }),
                  new TableCell({
                    children: [new Paragraph(report.ticker)],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("Current Price")],
                    shading: { fill: "E8E8E8" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(`$${report.currentPrice.toFixed(2)}`),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("Market Cap")],
                    shading: { fill: "E8E8E8" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        `$${(report.marketCap / 1000000000).toFixed(2)}B`
                      ),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // CAN SLIM Scores
          new Paragraph({
            text: "CAN SLIM Scores",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph("Criterion")],
                    shading: { fill: "E8E8E8" },
                  }),
                  new TableCell({
                    children: [new Paragraph("Score")],
                    shading: { fill: "E8E8E8" },
                  }),
                ],
              }),
              ...Object.entries(report.criteria).map(
                ([key, score]) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph(
                            `${key.toUpperCase()} - ${getCriterionName(key)}`
                          ),
                        ],
                      }),
                      new TableCell({
                        children: [new Paragraph(score.toString())],
                      }),
                    ],
                  })
              ),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: "Total Score",
                        run: { bold: true },
                      }),
                    ],
                    shading: { fill: "E8E8E8" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        text: report.totalScore.toString(),
                        run: { bold: true },
                      }),
                    ],
                    shading: { fill: "E8E8E8" },
                  }),
                ],
              }),
            ],
          }),

          // Описание
          new Paragraph({
            text: "Description",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),

          new Paragraph({
            text: report.description,
            spacing: { after: 100 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Генерировать Excel отчет портфеля
 */
export async function generatePortfolioExcel(
  portfolio: PortfolioData
): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();

  // Лист с активами
  const assetData = portfolio.assets.map((asset) => ({
    Ticker: asset.ticker,
    Name: asset.name,
    Price: `$${asset.price.toFixed(2)}`,
    "24h Change": `${asset.change24h.toFixed(2)}%`,
    "CAN SLIM Score": asset.score,
    Allocation: `${asset.allocation.toFixed(2)}%`,
  }));

  const assetSheet = XLSX.utils.json_to_sheet(assetData);
  XLSX.utils.book_append_sheet(workbook, assetSheet, "Assets");

  // Лист со сводкой
  const avgScore = portfolio.assets.length > 0
    ? (portfolio.assets.reduce((sum, a) => sum + a.score, 0) / portfolio.assets.length).toFixed(2)
    : "0";

  const summaryData = [
    { Metric: "Total Portfolio Value", Value: `$${portfolio.totalValue.toFixed(2)}` },
    { Metric: "Number of Assets", Value: portfolio.assets.length.toString() },
    { Metric: "Average Score", Value: avgScore },
    { Metric: "Generated", Value: portfolio.generatedAt.toLocaleDateString() },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Сохранить в буфер
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  return buffer;
}

/**
 * Получить название критерия
 */
function getCriterionName(key: string): string {
  const names: Record<string, string> = {
    c: "Current Growth",
    a: "Annual Growth",
    n: "New Catalysts",
    s: "Supply Dynamics",
    l: "Relative Strength",
    i: "Institutional Support",
    m: "Market Trend",
  };
  return names[key] || key;
}

/**
 * Создать CSV для экспорта
 */
export function generateCSV(
  data: Array<Record<string, any>>
): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      // Экранировать кавычки и обернуть в кавычки если содержит запятую
      if (typeof value === "string" && value.includes(",")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    })
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Экспортирует активы в JSON формат
 */
export function exportToJSON(assets: Array<Record<string, any>>): string {
  try {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalAssets: assets.length,
        assets: assets,
      },
      null,
      2
    );
  } catch (error) {
    console.error("Error exporting to JSON:", error);
    throw new Error("Ошибка при экспорте в JSON");
  }
}

/**
 * Получает MIME тип для формата файла
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    json: "application/json",
    pdf: "application/pdf",
  };
  return mimeTypes[format.toLowerCase()] || "application/octet-stream";
}

/**
 * Получает расширение файла для формата
 */
export function getFileExtension(format: string): string {
  const extensions: Record<string, string> = {
    csv: "csv",
    xlsx: "xlsx",
    json: "json",
    pdf: "pdf",
  };
  return extensions[format.toLowerCase()] || "txt";
}
