CREATE TABLE `solana_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`floorPrice` int NOT NULL,
	`floorPriceChange24h` int,
	`volume24h` int,
	`holders` int,
	`supply` int,
	`image` varchar(512),
	`verified` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `solana_collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `solana_collections_collectionId_unique` UNIQUE(`collectionId`)
);
--> statement-breakpoint
CREATE TABLE `solana_portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`walletAddress` varchar(255) NOT NULL,
	`nftId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`collection` varchar(255) NOT NULL,
	`floorPrice` int NOT NULL,
	`yourPrice` int,
	`gain` int,
	`gainPercent` int,
	`rarity` int,
	`marketplace` enum('magic-eden','tensor','solanart','other') NOT NULL,
	`image` varchar(512),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `solana_portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `solana_portfolios` ADD CONSTRAINT `solana_portfolios_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;