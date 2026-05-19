CREATE TABLE `backtests` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`strategyId` varchar(255) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`initialCapital` int NOT NULL,
	`totalReturn` int NOT NULL,
	`annualizedReturn` int,
	`sharpeRatio` int NOT NULL,
	`maxDrawdown` int NOT NULL,
	`winRate` int NOT NULL,
	`profitFactor` int NOT NULL,
	`totalTrades` int NOT NULL,
	`winningTrades` int NOT NULL,
	`losingTrades` int NOT NULL,
	`averageWin` int,
	`averageLoss` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backtests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioId` int NOT NULL,
	`ticker` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` int,
	`entryPrice` int,
	`currentPrice` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_holdings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`targetAllocation` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scan_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scanName` varchar(255) NOT NULL,
	`minScore` int,
	`maxScore` int,
	`minMarketCap` int,
	`maxMarketCap` int,
	`minVolume24h` int,
	`maxVolume24h` int,
	`resultCount` int,
	`results` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `backtests` ADD CONSTRAINT `backtests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;