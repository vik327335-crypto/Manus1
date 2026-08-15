CREATE TABLE `paper_trading_monitor_config_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monitorId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(32) NOT NULL,
	`details` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paper_trading_monitor_config_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `paper_trading_monitor_config_audits` ADD CONSTRAINT `ptmca_monitor_fk` FOREIGN KEY (`monitorId`) REFERENCES `paper_trading_monitors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ptmca_monitor_created_idx` ON `paper_trading_monitor_config_audits` (`monitorId`,`createdAt`);