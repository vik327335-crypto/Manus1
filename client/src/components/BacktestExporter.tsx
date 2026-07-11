import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BacktestResult {
  id: string;
  strategyName: string;
  symbol: string;
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
  };
  startDate: Date;
  endDate: Date;
}

interface BacktestExporterProps {
  results: BacktestResult[];
}

export function BacktestExporter({ results }: BacktestExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);

    try {
      const headers = [
        "Strategy",
        "Symbol",
        "Total Return (%)",
        "Sharpe Ratio",
        "Max Drawdown (%)",
        "Win Rate (%)",
        "Profit Factor",
        "Total Trades",
        "Start Date",
        "End Date",
      ];

      const rows = results.map((result) => [
        result.strategyName,
        result.symbol,
        result.metrics.totalReturn.toFixed(2),
        result.metrics.sharpeRatio.toFixed(2),
        result.metrics.maxDrawdown.toFixed(2),
        result.metrics.winRate.toFixed(1),
        result.metrics.profitFactor.toFixed(2),
        result.metrics.totalTrades,
        new Date(result.startDate).toISOString().split("T")[0],
        new Date(result.endDate).toISOString().split("T")[0],
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `backtest-results-${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);

    try {
      const data = {
        exportDate: new Date().toISOString(),
        totalResults: results.length,
        results: results.map((result) => ({
          ...result,
          startDate: new Date(result.startDate).toISOString(),
          endDate: new Date(result.endDate).toISOString(),
        })),
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `backtest-results-${Date.now()}.json`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToHTML = () => {
    setIsExporting(true);

    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Backtest Results Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .metric { font-weight: bold; }
    .positive { color: green; }
    .negative { color: red; }
  </style>
</head>
<body>
  <h1>Backtest Results Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <p>Total Results: ${results.length}</p>
  
  <table>
    <tr>
      <th>Strategy</th>
      <th>Symbol</th>
      <th>Total Return (%)</th>
      <th>Sharpe Ratio</th>
      <th>Max Drawdown (%)</th>
      <th>Win Rate (%)</th>
      <th>Profit Factor</th>
      <th>Total Trades</th>
      <th>Period</th>
    </tr>
    ${results
      .map(
        (result) => `
    <tr>
      <td>${result.strategyName}</td>
      <td>${result.symbol}</td>
      <td class="metric ${result.metrics.totalReturn >= 0 ? "positive" : "negative"}">
        ${result.metrics.totalReturn.toFixed(2)}%
      </td>
      <td>${result.metrics.sharpeRatio.toFixed(2)}</td>
      <td class="metric negative">${result.metrics.maxDrawdown.toFixed(2)}%</td>
      <td>${result.metrics.winRate.toFixed(1)}%</td>
      <td>${result.metrics.profitFactor.toFixed(2)}</td>
      <td>${result.metrics.totalTrades}</td>
      <td>${new Date(result.startDate).toLocaleDateString()} - ${new Date(result.endDate).toLocaleDateString()}</td>
    </tr>
    `
      )
      .join("")}
  </table>
</body>
</html>
      `;

      const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `backtest-results-${Date.now()}.html`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          Export Results
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON} disabled={isExporting}>
          <FileJson className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToHTML} disabled={isExporting}>
          <FileText className="w-4 h-4 mr-2" />
          Export as HTML
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
