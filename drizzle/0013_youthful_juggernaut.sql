CREATE TABLE `paper_trading_monitor_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monitorId` int NOT NULL,
	`alertKind` varchar(32) NOT NULL,
	`deliveryStatus` enum('sent','failed','suppressed') NOT NULL,
	`message` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paper_trading_monitor_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `paper_trading_monitors` ADD `minimumTradeCount` int DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_trading_monitors` ADD `watchProfitFactorMilli` int DEFAULT 1500 NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_trading_monitors` ADD `degradedProfitFactorMilli` int DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_trading_monitors` ADD `degradedBenchmarkLagBps` int DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `paper_trading_monitor_alerts` ADD CONSTRAINT `ptma_monitor_fk` FOREIGN KEY (`monitorId`) REFERENCES `paper_trading_monitors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ptma_monitor_created_idx` ON `paper_trading_monitor_alerts` (`monitorId`,`createdAt`);