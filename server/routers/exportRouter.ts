import { publicProcedure, router } from "../_core/trpc";
import { generateAssetPDF, generatePortfolioExcel, generateCSV } from "../services/exportService";

export const exportRouter = router({
  /**
   * Экспортировать отчет об активе в PDF
   */
  assetPDF: publicProcedure
    .input((val: any) => ({
      ticker: val.ticker as string,
      name: val.name as string,
      currentPrice: val.currentPrice as number,
      marketCap: val.marketCap as number,
      totalScore: val.totalScore as number,
      criteria: val.criteria as { c: number; a: number; n: number; s: number; l: number; i: number; m: number },
      description: val.description as string,
    }))
    .mutation(async ({ input }) => {
      try {
        const buffer = await generateAssetPDF({
          ...input,
          generatedAt: new Date(),
        });

        return {
          success: true,
          data: buffer.toString("base64"),
          filename: `${input.ticker}-report.pdf`,
        };
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        return {
          success: false,
          error: "Failed to generate PDF",
        };
      }
    }),

  /**
   * Экспортировать портфель в Excel
   */
  portfolioExcel: publicProcedure
    .input((val: any) => ({
      assets: val.assets as Array<{
        ticker: string;
        name: string;
        price: number;
        change24h: number;
        score: number;
        allocation: number;
      }>,
      totalValue: val.totalValue as number,
    }))
    .mutation(async ({ input }) => {
      try {
        const buffer = await generatePortfolioExcel({
          ...input,
          generatedAt: new Date(),
        });

        return {
          success: true,
          data: buffer.toString("base64"),
          filename: "portfolio-export.xlsx",
        };
      } catch (error) {
        console.error("Failed to generate Excel:", error);
        return {
          success: false,
          error: "Failed to generate Excel",
        };
      }
    }),

  /**
   * Экспортировать данные в CSV
   */
  csv: publicProcedure
    .input((val: any) => ({
      data: val.data as Array<Record<string, any>>,
      filename: val.filename as string,
    }))
    .mutation(async ({ input }) => {
      try {
        const csv = generateCSV(input.data);

        return {
          success: true,
          data: Buffer.from(csv).toString("base64"),
          filename: input.filename || "export.csv",
        };
      } catch (error) {
        console.error("Failed to generate CSV:", error);
        return {
          success: false,
          error: "Failed to generate CSV",
        };
      }
    }),
});
