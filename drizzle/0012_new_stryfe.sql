ALTER TABLE `paper_trading_monitor_runs` ADD `dataFreshness` enum('fresh','stale');--> statement-breakpoint
ALTER TABLE `paper_trading_monitor_runs` ADD `dataFreshness` enum('fresh','stale');--> statement-breakpoint
ALTER TABLE `paper_trading_monitor_runs` ADD `candleAgeMinutes` int;--> statement-breakpoint
ALTER TABLE `paper_trading_monitor_runs` ADD `equityInvariantDeltaCents` int;--> statement-breakpoint
ALTER TABLE `paper_trading_monitor_runs` ADD `diagnosticFlags` json;--> statement-breakpoint
ALTER TABLE `paper_trading_monitors` ADD `lastAlertAt` timestamp;--> statement-breakpoint
ALTER TABLE `paper_trading_monitors` ADD `lastAlertKind` varchar(32);
