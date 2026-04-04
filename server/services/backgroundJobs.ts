// Background job system for automated exports
// Note: Database integration will be added when schema is updated

export interface ExportJob {
  id: string;
  userId: string;
  name: string;
  type: "pdf" | "csv" | "json";
  tickers: string[];
  schedule: "daily" | "weekly" | "monthly";
  scheduleTime: string; // HH:mm format
  scheduleDay?: number | undefined; // 0-6 for weekly, 1-31 for monthly
  email: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory job queue
const jobQueue: Map<string, NodeJS.Timeout> = new Map();

/**
 * Create a new export job
 */
export async function createExportJob(
  userId: string,
  jobData: Omit<ExportJob, "id" | "createdAt" | "updatedAt"> & { scheduleDay?: number | undefined }
): Promise<ExportJob> {
  const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const job: ExportJob = {
    id,
    ...jobData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Store in database (when schema is updated)
  console.log(`[BackgroundJobs] Created job: ${id}`);

  // Schedule the job
  if (job.enabled) {
    scheduleJob(job);
  }

  return job;
}

/**
 * Update an export job
 */
export async function updateExportJob(
  jobId: string,
  updates: Partial<ExportJob>
): Promise<ExportJob | null> {
  console.log(`[BackgroundJobs] Updated job: ${jobId}`);

  // Cancel existing schedule
  if (jobQueue.has(jobId)) {
    clearTimeout(jobQueue.get(jobId)!);
    jobQueue.delete(jobId);
  }

  // Reschedule if enabled
  if (updates.enabled) {
    const job = { ...updates } as ExportJob;
    scheduleJob(job);
  }

  return updates as ExportJob;
}

/**
 * Delete an export job
 */
export async function deleteExportJob(jobId: string): Promise<boolean> {
  if (jobQueue.has(jobId)) {
    clearTimeout(jobQueue.get(jobId)!);
    jobQueue.delete(jobId);
  }

  console.log(`[BackgroundJobs] Deleted job: ${jobId}`);
  return true;
}

/**
 * Schedule a job to run at specified times
 */
function scheduleJob(job: ExportJob): void {
  const nextRun = calculateNextRun(job);
  const delay = nextRun.getTime() - Date.now();

  if (delay < 0) {
    console.warn(`[BackgroundJobs] Job ${job.id} is scheduled in the past`);
    return;
  }

  const timeout = setTimeout(async () => {
    try {
      await executeJob(job);
      // Reschedule for next occurrence
      scheduleJob(job);
    } catch (error) {
      console.error(`[BackgroundJobs] Job execution failed: ${job.id}`, error);
      // Reschedule even on failure
      scheduleJob(job);
    }
  }, delay);

  jobQueue.set(job.id, timeout);
  console.log(
    `[BackgroundJobs] Scheduled job ${job.id} to run at ${nextRun.toISOString()}`
  );
}

/**
 * Calculate next run time for a job
 */
function calculateNextRun(job: ExportJob): Date {
  const now = new Date();
  const [hours, minutes] = job.scheduleTime.split(":").map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    // Time has passed today, schedule for next period
    switch (job.schedule) {
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case "weekly":
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
  }

  return nextRun;
}

/**
 * Execute a job (generate and send report)
 */
async function executeJob(job: ExportJob): Promise<void> {
  console.log(`[BackgroundJobs] Executing job: ${job.id}`);

  try {
    // Generate report data
    const reportData = await generateReportData(job.tickers, job.type);

    // Send email
    await sendReportEmail(job.email, job.name, reportData, job.type);

    // Update job's lastRun
    console.log(`[BackgroundJobs] Job ${job.id} completed successfully`);
  } catch (error) {
    console.error(`[BackgroundJobs] Job execution error:`, error);
    throw error;
  }
}

/**
 * Generate report data
 */
async function generateReportData(
  tickers: string[],
  type: "pdf" | "csv" | "json"
): Promise<string> {
  console.log(`[BackgroundJobs] Generating ${type} report for ${tickers.join(",")}`);

  // Placeholder - would generate actual report
  const data = {
    timestamp: new Date().toISOString(),
    tickers,
    type,
    status: "generated",
  };

  if (type === "json") {
    return JSON.stringify(data, null, 2);
  } else if (type === "csv") {
    return `Timestamp,Ticker,Type\n${new Date().toISOString()},${tickers.join("|")},${type}`;
  } else {
    // PDF would be binary
    return JSON.stringify(data);
  }
}

/**
 * Send report via email
 */
async function sendReportEmail(
  email: string,
  jobName: string,
  reportData: string,
  type: "pdf" | "csv" | "json"
): Promise<void> {
  console.log(`[BackgroundJobs] Sending report to ${email}`);

  // Placeholder - would use email service
  console.log(`Email sent to ${email} with ${jobName} report (${type})`);
}

/**
 * Get all jobs for a user
 */
export async function getUserJobs(userId: string): Promise<ExportJob[]> {
  // Placeholder - would query database
  console.log(`[BackgroundJobs] Fetching jobs for user: ${userId}`);
  return [];
}

/**
 * Get job by ID
 */
export async function getJobById(jobId: string): Promise<ExportJob | null> {
  // Placeholder - would query database
  console.log(`[BackgroundJobs] Fetching job: ${jobId}`);
  return null;
}

/**
 * Get all active jobs
 */
export function getActiveJobs(): string[] {
  return Array.from(jobQueue.keys());
}

/**
 * Stop all jobs
 */
export function stopAllJobs(): void {
  jobQueue.forEach((timeout) => clearTimeout(timeout));
  jobQueue.clear();
  console.log("[BackgroundJobs] All jobs stopped");
}

/**
 * Get job stats
 */
export function getJobStats() {
  return {
    activeJobs: jobQueue.size,
    jobIds: Array.from(jobQueue.keys()),
  };
}
