CREATE TABLE `ohlcv_audit_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(20) NOT NULL,
	`timeframe` enum('day','week','month') NOT NULL,
	`source` varchar(64) NOT NULL,
	`requestedStartDate` varchar(10) NOT NULL,
	`requestedEndDate` varchar(10) NOT NULL,
	`coverageStartDate` varchar(10) NOT NULL,
	`coverageEndDate` varchar(10) NOT NULL,
	`fetchedAt` timestamp NOT NULL,
	`dataPoints` int NOT NULL,
	`responseHash` varchar(64) NOT NULL,
	`bars` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ohlcv_audit_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `ohlcv_audit_snapshots_hash_uq` UNIQUE(`responseHash`)
);
--> statement-breakpoint
CREATE INDEX `ohlcv_audit_snapshots_ticker_fetched_idx` ON `ohlcv_audit_snapshots` (`ticker`,`fetchedAt`);