import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Sheet, Calendar } from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: "pdf" | "excel" | "csv";
  format: "asset_analysis" | "portfolio_summary" | "market_data" | "performance";
  dateRange: "1w" | "1m" | "3m" | "6m" | "1y" | "custom";
  createdAt: string;
  size: string;
}

// Mock reports
const mockReports: Report[] = [
  {
    id: "1",
    name: "BTC Asset Analysis - April 2026",
    type: "pdf",
    format: "asset_analysis",
    dateRange: "1m",
    createdAt: "2026-04-08",
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "Portfolio Summary Q1 2026",
    type: "excel",
    format: "portfolio_summary",
    dateRange: "3m",
    createdAt: "2026-04-07",
    size: "1.1 MB",
  },
  {
    id: "3",
    name: "Market Data Export",
    type: "csv",
    format: "market_data",
    dateRange: "1w",
    createdAt: "2026-04-06",
    size: "0.8 MB",
  },
  {
    id: "4",
    name: "Performance Analysis 2026",
    type: "pdf",
    format: "performance",
    dateRange: "1y",
    createdAt: "2026-04-05",
    size: "3.2 MB",
  },
];

function ReportCard({ report, onDownload, onDelete }: { report: Report; onDownload: (id: string) => void; onDelete: (id: string) => void }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "excel":
        return <Sheet className="h-5 w-5 text-green-500" />;
      case "csv":
        return <Sheet className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "asset_analysis":
        return "Asset Analysis";
      case "portfolio_summary":
        return "Portfolio Summary";
      case "market_data":
        return "Market Data";
      case "performance":
        return "Performance Report";
      default:
        return format;
    }
  };

  return (
    <Card className="card-elevated p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">{getTypeIcon(report.type)}</div>
          <div>
            <p className="font-semibold">{report.name}</p>
            <p className="text-xs text-muted-foreground">{getFormatLabel(report.format)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Date Range</p>
          <p className="text-sm font-medium">{report.dateRange.toUpperCase()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">File Size</p>
          <p className="text-sm font-medium">{report.size}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Generated: {new Date(report.createdAt).toLocaleDateString()}
      </p>

      <div className="flex gap-2">
        <Button
          onClick={() => onDownload(report.id)}
          className="flex-1 gap-2"
          size="sm"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button
          onClick={() => onDelete(report.id)}
          variant="outline"
          size="sm"
          className="text-destructive"
        >
          Delete
        </Button>
      </div>
    </Card>
  );
}

export default function ReportGenerator() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "pdf" as const,
    format: "asset_analysis" as const,
    dateRange: "1m" as const,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDeleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDownloadReport = (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (report) {
      // Simulate download
      console.log(`Downloading ${report.name}...`);
      alert(`Download started for: ${report.name}`);
    }
  };

  const handleGenerateReport = async () => {
    if (!formData.name) {
      alert("Please enter a report name");
      return;
    }

    setIsGenerating(true);

    // Simulate report generation
    setTimeout(() => {
      const newReport: Report = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        format: formData.format,
        dateRange: formData.dateRange,
        createdAt: new Date().toISOString().split("T")[0],
        size: `${(Math.random() * 5).toFixed(1)} MB`,
      };

      setReports((prev) => [newReport, ...prev]);
      setFormData({
        name: "",
        type: "pdf",
        format: "asset_analysis",
        dateRange: "1m",
      });
      setShowCreateForm(false);
      setIsGenerating(false);
      alert("Report generated successfully!");
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Report Generator</h1>
        <p className="text-muted-foreground">
          Generate and export analysis reports in PDF, Excel, or CSV format
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Reports</p>
          <p className="text-2xl font-bold">{reports.length}</p>
        </Card>
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">PDF Reports</p>
          <p className="text-2xl font-bold">{reports.filter((r) => r.type === "pdf").length}</p>
        </Card>
        <Card className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Excel Reports</p>
          <p className="text-2xl font-bold">{reports.filter((r) => r.type === "excel").length}</p>
        </Card>
      </div>

      {/* Create Report Form */}
      {showCreateForm && (
        <Card className="card-elevated p-6">
          <h2 className="text-xl font-bold mb-4">Generate New Report</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Report Name</Label>
              <Input
                id="name"
                placeholder="e.g., Q1 2026 Performance Report"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Export Format</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as any,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <div>
                <Label htmlFor="format">Report Type</Label>
                <select
                  id="format"
                  value={formData.format}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      format: e.target.value as any,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="asset_analysis">Asset Analysis</option>
                  <option value="portfolio_summary">Portfolio Summary</option>
                  <option value="market_data">Market Data</option>
                  <option value="performance">Performance Report</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <select
                id="dateRange"
                value={formData.dateRange}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateRange: e.target.value as any,
                  }))
                }
                className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="1w">Last 1 Week</option>
                <option value="1m">Last 1 Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last 1 Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Report Button */}
      {!showCreateForm && (
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <FileText className="h-4 w-4" />
          Generate New Report
        </Button>
      )}

      {/* Reports List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Generated Reports</h2>
        {reports.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDownload={handleDownloadReport}
                onDelete={handleDeleteReport}
              />
            ))}
          </div>
        ) : (
          <Card className="card-elevated p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No reports generated yet</p>
            <Button onClick={() => setShowCreateForm(true)} variant="outline">
              Generate Your First Report
            </Button>
          </Card>
        )}
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Report Templates</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Asset Analysis",
              description: "Detailed analysis of individual cryptocurrencies with CAN SLIM scores",
              icon: FileText,
            },
            {
              title: "Portfolio Summary",
              description: "Overview of your portfolio performance, allocation, and metrics",
              icon: Sheet,
            },
            {
              title: "Market Data Export",
              description: "Raw market data export for external analysis",
              icon: Calendar,
            },
            {
              title: "Performance Report",
              description: "Comprehensive performance analysis over selected time period",
              icon: FileText,
            },
          ].map((template, index) => {
            const Icon = template.icon;
            return (
              <Card key={index} className="card-elevated p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{template.title}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Use Template
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
