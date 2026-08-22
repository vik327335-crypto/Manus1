import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Square, RotateCw as _RotateCw, Trash2 as _Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  // Check admin access
  const { data: adminCheck, isLoading: checkingAdmin } = trpc.admin.requireAdmin.useQuery();

  // Get running jobs
  const { data: jobsData, refetch: refetchJobs } = trpc.admin.getRunningJobs.useQuery();

  // Get periodic status
  const { data: periodicStatus } = trpc.admin.getPeriodicStatus.useQuery();

  // Get system health
  const { data: systemHealth } = trpc.admin.getSystemHealth.useQuery();

  // Start batch job mutation
  const startBatchMutation = trpc.admin.startBatchNewsJob.useMutation({
    onSuccess: () => {
      toast.success("Batch job started");
      refetchJobs();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start batch job");
    },
  });

  // Start periodic updates mutation
  const startPeriodicMutation = trpc.admin.startPeriodicUpdates.useMutation({
    onSuccess: () => {
      toast.success("Periodic updates started");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start periodic updates");
    },
  });

  // Stop periodic updates mutation
  const stopPeriodicMutation = trpc.admin.stopPeriodicUpdates.useMutation({
    onSuccess: () => {
      toast.success("Periodic updates stopped");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to stop periodic updates");
    },
  });

  if (checkingAdmin === undefined || !adminCheck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have admin access to this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mockAssets = [
    { id: 1, ticker: "BTC", name: "Bitcoin" },
    { id: 2, ticker: "ETH", name: "Ethereum" },
    { id: 3, ticker: "SOL", name: "Solana" },
    { id: 4, ticker: "ADA", name: "Cardano" },
  ];

  const handleStartBatch = () => {
    if (selectedAssets.length === 0) {
      toast.error("Please select at least one asset");
      return;
    }

    const assetsToProcess = mockAssets.filter((a) => selectedAssets.includes(a.id));
    startBatchMutation.mutate({ assets: assetsToProcess });
  };

  const handleStartPeriodic = () => {
    startPeriodicMutation.mutate({
      assets: mockAssets,
      intervalMinutes: 30,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "running":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage background jobs and system health
          </p>
        </div>

        {/* System Health */}
        {systemHealth && (
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-green-600">Healthy</Badge>
                <p className="text-xs text-muted-foreground mt-2">System operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemHealth.runningJobsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Active background tasks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Periodic Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={periodicStatus?.isRunning ? "bg-blue-600" : "bg-gray-600"}>
                  {periodicStatus?.isRunning ? "Running" : "Stopped"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">Every 30 minutes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.floor(systemHealth.uptime / 3600)}h</div>
                <p className="text-xs text-muted-foreground mt-1">Server running</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Periodic Updates Control */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Periodic Updates</CardTitle>
            <CardDescription>Control automatic news fetching and sentiment analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                onClick={handleStartPeriodic}
                disabled={startPeriodicMutation.isPending || periodicStatus?.isRunning}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Start Periodic Updates
              </Button>
              <Button
                onClick={() => stopPeriodicMutation.mutate()}
                disabled={stopPeriodicMutation.isPending || !periodicStatus?.isRunning}
                variant="outline"
                className="gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Periodic Updates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Batch Job Control */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Batch News Update</CardTitle>
            <CardDescription>Manually trigger news fetching for selected assets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Select Assets:</p>
              <div className="grid gap-2 md:grid-cols-2">
                {mockAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`asset-${asset.id}`}
                      checked={selectedAssets.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssets([...selectedAssets, asset.id]);
                        } else {
                          setSelectedAssets(selectedAssets.filter((id) => id !== asset.id));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`asset-${asset.id}`} className="text-sm cursor-pointer">
                      {asset.ticker} - {asset.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleStartBatch}
              disabled={startBatchMutation.isPending || selectedAssets.length === 0}
              className="gap-2 w-full"
            >
              <Play className="w-4 h-4" />
              Start Batch Job
            </Button>
          </CardContent>
        </Card>

        {/* Running Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Running Jobs</CardTitle>
            <CardDescription>Active background tasks and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsData && jobsData.jobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Job ID</th>
                      <th className="text-left py-3 px-4">Asset</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Started</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobsData.jobs.map((job: any) => (
                      <tr key={job.jobId} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-xs">{job.jobId.slice(0, 8)}...</td>
                        <td className="py-3 px-4">{job.assetTicker}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(job.startedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {new Date(job.lastUpdated).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No running jobs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
