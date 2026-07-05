CREATE TABLE `backtest_results` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`strategyId` varchar(255) NOT NULL,
	`strategyName` varchar(255) NOT NULL,
	`exchange` varchar(20) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`timeframe` varchar(20) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`initialCapital` int NOT NULL,
	`finalCapital` int NOT NULL,
	`totalReturn` int NOT NULL,
	`annualizedReturn` int,
	`sharpeRatio` int,
	`maxDrawdown` int NOT NULL,
	`winRate` int NOT NULL,
	`profitFactor` int,
	`totalTrades` int NOT NULL,
	`winningTrades` int NOT NULL,
	`losingTrades` int NOT NULL,
	`averageWin` int,
	`averageLoss` int,
	`trades` json,
	`parameters` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backtest_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyId` varchar(64) NOT NULL,
	`rank` int NOT NULL,
	`score` int NOT NULL,
	`totalReturn` int NOT NULL,
	`winRate` int NOT NULL,
	`followers` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_leaderboard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchange_api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exchange` enum('binance','coinbase','kraken') NOT NULL,
	`apiKey` varchar(512) NOT NULL,
	`apiSecret` varchar(512) NOT NULL,
	`passphrase` varchar(512),
	`isActive` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exchange_api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchange_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiKeyId` int NOT NULL,
	`exchange` varchar(20) NOT NULL,
	`asset` varchar(20) NOT NULL,
	`free` varchar(64) NOT NULL,
	`locked` varchar(64) NOT NULL,
	`total` varchar(64) NOT NULL,
	`usdValue` int,
	`lastSyncedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exchange_balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `optimization_jobs` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`strategyId` varchar(255) NOT NULL,
	`strategyName` varchar(255) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`parameterRanges` json,
	`bestParameters` json,
	`bestResult` json,
	`totalCombinations` int,
	`completedCombinations` int DEFAULT 0,
	`startedAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `optimization_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_strategies` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`strategyId` varchar(255) NOT NULL,
	`strategyName` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(64),
	`parameters` json,
	`backtestResults` json,
	`isPublic` int NOT NULL DEFAULT 1,
	`views` int NOT NULL DEFAULT 0,
	`copies` int NOT NULL DEFAULT 0,
	`rating` int NOT NULL DEFAULT 0,
	`ratingCount` int NOT NULL DEFAULT 0,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shared_strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategy_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyId` varchar(64) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`helpful` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategy_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `backtest_results` ADD CONSTRAINT `backtest_results_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_leaderboard` ADD CONSTRAINT `community_leaderboard_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_leaderboard` ADD CONSTRAINT `community_leaderboard_strategyId_shared_strategies_id_fk` FOREIGN KEY (`strategyId`) REFERENCES `shared_strategies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exchange_api_keys` ADD CONSTRAINT `exchange_api_keys_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exchange_balances` ADD CONSTRAINT `exchange_balances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exchange_balances` ADD CONSTRAINT `exchange_balances_apiKeyId_exchange_api_keys_id_fk` FOREIGN KEY (`apiKeyId`) REFERENCES `exchange_api_keys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `optimization_jobs` ADD CONSTRAINT `optimization_jobs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shared_strategies` ADD CONSTRAINT `shared_strategies_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategy_ratings` ADD CONSTRAINT `strategy_ratings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategy_ratings` ADD CONSTRAINT `strategy_ratings_strategyId_shared_strategies_id_fk` FOREIGN KEY (`strategyId`) REFERENCES `shared_strategies`(`id`) ON DELETE no action ON UPDATE no action;