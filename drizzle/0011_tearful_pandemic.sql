CREATE TABLE `paper_trading_monitor_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monitorId` int NOT NULL,
	`asOfDate` timestamp NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('healthy','watch','degraded','error','skipped') NOT NULL,
	`equityCents` int,
	`benchmarkEquityCents` int,
	`modelReturnBps` int,
	`benchmarkReturnBps` int,
	`rollingProfitFactorMilli` int,
	`rollingWinRateBps` int,
	`rollingMaxDrawdownBps` int,
	`rollingTrades` int NOT NULL DEFAULT 0,
	`dataSource` varchar(120) NOT NULL DEFAULT 'Binance Spot /api/v3/klines',
	`errorSummary` varchar(500),
	CONSTRAINT `paper_trading_monitor_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paper_trading_monitor_trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monitorId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`direction` enum('long') NOT NULL DEFAULT 'long',
	`entryPriceCents` int NOT NULL,
	`exitPriceCents` int,
	`entryCapitalCents` int NOT NULL,
  `quantityE8` bigint NOT NULL,
	`entryFeeCents` int NOT NULL,
	`exitFeeCents` int,
	`pnlCents` int,
	`pnlBps` int,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`openedAt` timestamp NOT NULL,
	`closedAt` timestamp,
	`closeReason` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paper_trading_monitor_trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paper_trading_monitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`strategyKey` varchar(64) NOT NULL DEFAULT 'technical_composite_v1',
	`symbols` json NOT NULL,
	`initialCapitalCents` int NOT NULL,
	`cashCents` int NOT NULL,
	`feeBps` int NOT NULL DEFAULT 10,
	`rollingWindowDays` int NOT NULL DEFAULT 90,
	`scheduleCronTaskUid` varchar(65),
	`scheduleCron` varchar(64),
	`enabled` int NOT NULL DEFAULT 0,
	`lastRunAt` timestamp,
	`lastStatus` enum('idle','healthy','watch','degraded','error','paused') NOT NULL DEFAULT 'idle',
	`baselinePrices` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paper_trading_monitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `paper_trading_monitor_runs` ADD CONSTRAINT `ptmr_monitor_fk` FOREIGN KEY (`monitorId`) REFERENCES `paper_trading_monitors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paper_trading_monitor_trades` ADD CONSTRAINT `ptmt_monitor_fk` FOREIGN KEY (`monitorId`) REFERENCES `paper_trading_monitors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paper_trading_monitors` ADD CONSTRAINT `ptm_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `paper_trading_monitor_trades_monitor_idx` ON `paper_trading_monitor_trades` (`monitorId`);--> statement-breakpoint
CREATE INDEX `paper_trading_monitor_trades_open_idx` ON `paper_trading_monitor_trades` (`monitorId`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `paper_trading_monitor_runs_monitor_date_uq` ON `paper_trading_monitor_runs` (`monitorId`,`asOfDate`);--> statement-breakpoint
CREATE INDEX `paper_trading_monitors_user_idx` ON `paper_trading_monitors` (`userId`);--> statement-breakpoint
CREATE INDEX `paper_trading_monitors_task_uid_idx` ON `paper_trading_monitors` (`scheduleCronTaskUid`);
