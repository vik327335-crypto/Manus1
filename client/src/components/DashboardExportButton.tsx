import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DashboardExportButtonProps {
  assets: Array<{
    ticker: string;
    name: string;
    price: number;
    change24h: number;
    score: number;
    allocation: number;
  }>;
  totalValue: number;
}

export function DashboardExportButton({
  assets,
  totalValue,
}: DashboardExportButtonProps) {
  const exportPortfolioExcel = trpc.export.portfolioExcel.useMutation();
  const exportCSV = trpc.export.csv.useMutation();

  const handleExportExcel = async () => {
    try {
      const result = await exportPortfolioExcel.mutateAsync({
        assets,
        totalValue,
      });

      if (result.success && result.data) {
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
        toast.success("Portfolio exported to Excel");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export portfolio");
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = assets.map((asset) => ({
        Ticker: asset.ticker,
        Name: asset.name,
        Price: asset.price,
        "24h Change %": asset.change24h,
        "CAN SLIM Score": asset.score,
        "Allocation %": asset.allocation,
      }));

      const result = await exportCSV.mutateAsync({
        data: csvData,
        filename: "portfolio-export.csv",
      });

      if (result.success && result.data) {
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Portfolio exported to CSV");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export portfolio");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={exportPortfolioExcel.isPending}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {exportPortfolioExcel.isPending ? "Exporting..." : "Export Excel"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={exportCSV.isPending}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {exportCSV.isPending ? "Exporting..." : "Export CSV"}
      </Button>
    </div>
  );
}
