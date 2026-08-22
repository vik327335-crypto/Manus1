import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle as _AlertCircle, Clock, Plus, Trash2, Pause, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type JobType = "balance-sync" | "backtest" | "leaderboard" | "cleanup" | "daily-summary";

interface JobForm {
  type: JobType;
  cron: string;
  description: string;
  daysToKeep?: number;
}

export function SchedulerManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<JobForm>({
    type: "balance-sync",
    cron: "0 0 * * * *", // Daily at midnight UTC
    description: "",
    daysToKeep: 30,
  });

  const { data: jobs, isLoading, refetch } = trpc.scheduler.listJobs.useQuery();

  const createBalanceSyncMutation = trpc.scheduler.createBalanceSyncJob.useMutation();
  const createBacktestMutation = trpc.scheduler.createBacktestJob.useMutation();
  const createLeaderboardMutation = trpc.scheduler.createLeaderboardUpdateJob.useMutation();
  const createCleanupMutation = trpc.scheduler.createCleanupJob.useMutation();
  const createDailySummaryMutation = trpc.scheduler.createDailySummaryJob.useMutation();
  const deleteJobMutation = trpc.scheduler.deleteJob.useMutation();
  const pauseJobMutation = trpc.scheduler.pauseJob.useMutation();
  const resumeJobMutation = trpc.scheduler.resumeJob.useMutation();

  const handleCreateJob = async () => {
    try {
      switch (form.type) {
        case "balance-sync":
          await createBalanceSyncMutation.mutateAsync({
            cron: form.cron,
            description: form.description,
          });
          break;
        case "backtest":
          await createBacktestMutation.mutateAsync({
            cron: form.cron,
            description: form.description,
          });
          break;
        case "leaderboard":
          await createLeaderboardMutation.mutateAsync({
            cron: form.cron,
            description: form.description,
          });
          break;
        case "cleanup":
          await createCleanupMutation.mutateAsync({
            cron: form.cron,
            description: form.description,
            daysToKeep: form.daysToKeep || 30,
          });
          break;
        case "daily-summary":
          await createDailySummaryMutation.mutateAsync({
            cron: form.cron,
            description: form.description,
          });
          break;
      }

      setIsOpen(false);
      setForm({
        type: "balance-sync",
        cron: "0 0 * * * *",
        description: "",
        daysToKeep: 30,
      });
      refetch();
    } catch (error) {
      console.error("Failed to create job:", error);
    }
  };

  const handleDeleteJob = async (taskUid: string) => {
    try {
      await deleteJobMutation.mutateAsync({ taskUid });
      refetch();
    } catch (error) {
      console.error("Failed to delete job:", error);
    }
  };

  const handlePauseJob = async (taskUid: string) => {
    try {
      await pauseJobMutation.mutateAsync({ taskUid });
      refetch();
    } catch (error) {
      console.error("Failed to pause job:", error);
    }
  };

  const handleResumeJob = async (taskUid: string) => {
    try {
      await resumeJobMutation.mutateAsync({ taskUid });
      refetch();
    } catch (error) {
      console.error("Failed to resume job:", error);
    }
  };

  const getJobTypeLabel = (type: JobType) => {
    const labels: Record<JobType, string> = {
      "balance-sync": "Balance Sync",
      backtest: "Backtesting",
      leaderboard: "Leaderboard Update",
      cleanup: "Data Cleanup",
      "daily-summary": "Daily Summary",
    };
    return labels[type];
  };

  const _getJobTypeDescription = (type: JobType) => {
    const descriptions: Record<JobType, string> = {
      "balance-sync": "Synchronize exchange balances",
      backtest: "Run periodic backtesting",
      leaderboard: "Update community leaderboard",
      cleanup: "Clean up old data",
      "daily-summary": "Generate daily summary report",
    };
    return descriptions[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scheduler Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage periodic tasks and scheduled jobs
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Scheduled Job</DialogTitle>
              <DialogDescription>
                Set up a new periodic task to run automatically
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="job-type">Job Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm({ ...form, type: value as JobType })
                  }
                >
                  <SelectTrigger id="job-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance-sync">Balance Sync</SelectItem>
                    <SelectItem value="backtest">Backtesting</SelectItem>
                    <SelectItem value="leaderboard">Leaderboard Update</SelectItem>
                    <SelectItem value="cleanup">Data Cleanup</SelectItem>
                    <SelectItem value="daily-summary">Daily Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cron">Cron Expression</Label>
                <Input
                  id="cron"
                  placeholder="0 0 * * * * (daily at midnight UTC)"
                  value={form.cron}
                  onChange={(e) => setForm({ ...form, cron: e.target.value })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  6-field cron format: sec min hour dom mon dow (UTC)
                </p>
              </div>

              {form.type === "cleanup" && (
                <div>
                  <Label htmlFor="days">Days to Keep</Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    value={form.daysToKeep}
                    onChange={(e) =>
                      setForm({ ...form, daysToKeep: parseInt(e.target.value) })
                    }
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <Button
                onClick={handleCreateJob}
                disabled={
                  createBalanceSyncMutation.isPending ||
                  createBacktestMutation.isPending ||
                  createLeaderboardMutation.isPending ||
                  createCleanupMutation.isPending ||
                  createDailySummaryMutation.isPending
                }
              >
                Create Job
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Scheduled jobs run automatically according to their cron schedule. Times are in UTC.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Loading jobs...</p>
            </CardContent>
          </Card>
        ) : jobs?.jobs && jobs.jobs.length > 0 ? (
          jobs.jobs.map((job: any) => (
            <Card key={job.taskUid}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {getJobTypeLabel(job.name.split("-")[0] as JobType)}
                    </CardTitle>
                    <CardDescription>{job.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {job.isEnable ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePauseJob(job.taskUid)}
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResumeJob(job.taskUid)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteJob(job.taskUid)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cron Expression</p>
                    <p className="font-mono">{job.cronExpression}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className={job.isEnable ? "text-green-600" : "text-yellow-600"}>
                      {job.isEnable ? "Active" : "Paused"}
                    </p>
                  </div>
                  {job.lastExecutedAt && (
                    <div>
                      <p className="text-muted-foreground">Last Executed</p>
                      <p>{new Date(job.lastExecutedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {job.nextExecutionAt && (
                    <div>
                      <p className="text-muted-foreground">Next Execution</p>
                      <p>{new Date(job.nextExecutionAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No scheduled jobs yet. Create one to get started!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
