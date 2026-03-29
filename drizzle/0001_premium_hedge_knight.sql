CREATE TABLE `canslim_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`cScore` int DEFAULT 0,
	`cReason` text,
	`aScore` int DEFAULT 0,
	`aReason` text,
	`nScore` int DEFAULT 0,
	`nReason` text,
	`sScore` int DEFAULT 0,
	`sReason` text,
	`lScore` int DEFAULT 0,
	`lReason` text,
	`iScore` int DEFAULT 0,
	`iReason` text,
	`mScore` int DEFAULT 0,
	`mReason` text,
	`totalScore` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `canslim_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crypto_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(20) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`logo` varchar(512),
	`category` varchar(64),
	`marketCap` int,
	`currentPrice` int,
	`priceChange24h` int,
	`volume24h` int,
	`circulatingSupply` varchar(64),
	`totalSupply` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crypto_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `crypto_assets_ticker_unique` UNIQUE(`ticker`)
);
--> statement-breakpoint
CREATE TABLE `market_trend` (
	`id` int AUTO_INCREMENT NOT NULL,
	`btcPrice` int,
	`btc200EMA` int,
	`btcAbove200EMA` int,
	`dominance` int,
	`fearGreedIndex` int,
	`stablecoinInflow` int,
	`status` enum('bullish','neutral','bearish') DEFAULT 'neutral',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_trend_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentiment_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`source` varchar(64),
	`catalyst` varchar(255),
	`sentiment` enum('positive','neutral','negative') NOT NULL,
	`confidence` int,
	`summary` text,
	`sourceUrl` varchar(512),
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentiment_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assetId` int NOT NULL,
	`alertThreshold` int,
	`notes` text,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `canslim_scores` ADD CONSTRAINT `canslim_scores_assetId_crypto_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `crypto_assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sentiment_analysis` ADD CONSTRAINT `sentiment_analysis_assetId_crypto_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `crypto_assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist` ADD CONSTRAINT `watchlist_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchlist` ADD CONSTRAINT `watchlist_assetId_crypto_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `crypto_assets`(`id`) ON DELETE no action ON UPDATE no action;