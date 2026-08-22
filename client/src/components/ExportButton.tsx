import { Button } from "@/components/ui/button";
import { Download as _Download, FileText, Sheet } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExportButtonProps {
  assetTicker?: string;
  assetData?: {
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
  };
  portfolioData?: {
    assets: Array<{
      ticker: string;
      name: string;
      price: number;
      change24h: number;
      score: number;
      allocation: number;
    }>;
    totalValue: number;
  };
}

export function ExportButton({
  assetData,
  portfolioData,
}: ExportButtonProps) {
  const exportAssetPDF = trpc.export.assetPDF.useMutation();
  const exportPortfolioExcel = trpc.export.portfolioExcel.useMutation();

  const handleExportAssetPDF = async () => {
    if (!assetData) return;

    try {
      const result = await exportAssetPDF.mutateAsync(assetData);
      if (result.success && result.data) {
        // Создать blob и скачать
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("PDF exported successfully");
      } else {
        toast.error("Failed to export PDF");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleExportPortfolioExcel = async () => {
    if (!portfolioData) return;

    try {
      const result = await exportPortfolioExcel.mutateAsync(portfolioData);
      if (result.success && result.data) {
        // Создать blob и скачать
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Excel exported successfully");
      } else {
        toast.error("Failed to export Excel");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export Excel");
    }
  };

  return (
    <div className="flex gap-2">
      {assetData && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportAssetPDF}
          disabled={exportAssetPDF.isPending}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {exportAssetPDF.isPending ? "Exporting..." : "Export PDF"}
        </Button>
      )}
      {portfolioData && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPortfolioExcel}
          disabled={exportPortfolioExcel.isPending}
          className="gap-2"
        >
          <Sheet className="h-4 w-4" />
          {exportPortfolioExcel.isPending ? "Exporting..." : "Export Excel"}
        </Button>
      )}
    </div>
  );
}
