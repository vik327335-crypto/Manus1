import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface ExportData {
  id: number;
  ticker: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  score: number;
  category?: string;
}

interface DataExportButtonProps {
  data: ExportData[];
  filename?: string;
  className?: string;
}

/**
 * DataExportButton компонент для экспорта данных в различные форматы
 * Поддерживает CSV, Excel, JSON
 */
export function DataExportButton({
  data,
  filename = "crypto-scanner-export",
  className,
}: DataExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const exportToCSV = () => {
    try {
      setIsLoading(true);

      const headers = [
        "Тикер",
        "Название",
        "Цена",
        "Изм. 24h (%)",
        "Рыночная кап.",
        "Объём 24h",
        "Score",
        "Категория",
      ];

      const rows = data.map((item) => [
        item.ticker,
        item.name,
        item.currentPrice.toFixed(2),
        item.priceChange24h.toFixed(2),
        item.marketCap.toFixed(0),
        item.volume24h.toFixed(0),
        item.score.toFixed(1),
        item.category || "-",
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Данные экспортированы в CSV");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Ошибка при экспорте в CSV");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToJSON = () => {
    try {
      setIsLoading(true);

      const json = JSON.stringify(
        {
          exportDate: new Date().toISOString(),
          totalAssets: data.length,
          assets: data,
        },
        null,
        2
      );

      const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.json`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Данные экспортированы в JSON");
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error("Ошибка при экспорте в JSON");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setIsLoading(true);

      // Динамический импорт для уменьшения размера бандла
      const XLSX = await import("xlsx");

      const worksheet = XLSX.utils.json_to_sheet(
        data.map((item) => ({
          Тикер: item.ticker,
          Название: item.name,
          "Текущая цена": item.currentPrice,
          "Изменение 24h (%)": item.priceChange24h.toFixed(2),
          "Рыночная капитализация": item.marketCap,
          "Объём 24h": item.volume24h,
          "CAN SLIM Score": item.score,
          Категория: item.category || "-",
        }))
      );

      const colWidths = [
        { wch: 10 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
      ];
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");

      XLSX.writeFile(workbook, `${filename}.xlsx`);

      toast.success("Данные экспортированы в Excel");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Ошибка при экспорте в Excel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isLoading || data.length === 0}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {isLoading ? "Экспорт..." : "Экспорт"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} disabled={isLoading}>
          <FileText className="h-4 w-4 mr-2" />
          Экспорт в CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON} disabled={isLoading}>
          <FileJson className="h-4 w-4 mr-2" />
          Экспорт в JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToExcel} disabled={isLoading}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Экспорт в Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
