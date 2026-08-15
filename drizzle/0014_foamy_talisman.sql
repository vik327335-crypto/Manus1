ALTER TABLE `paper_trading_monitors` ADD `archivedAt` timestamp;--> statement-breakpoint
CREATE INDEX `paper_trading_monitors_user_archived_idx` ON `paper_trading_monitors` (`userId`,`archivedAt`);