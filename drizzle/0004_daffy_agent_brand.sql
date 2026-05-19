CREATE TABLE `copied_trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`traderId` int NOT NULL,
	`tradeId` varchar(255) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`entryPrice` int NOT NULL,
	`exitPrice` int,
	`quantity` int NOT NULL,
	`pnl` int,
	`status` varchar(20) NOT NULL DEFAULT 'OPEN',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `copied_trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trader_followers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`traderId` int NOT NULL,
	`followedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trader_followers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `traders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`avatar` varchar(512),
	`winRate` int NOT NULL,
	`totalTrades` int NOT NULL,
	`profitableTrades` int NOT NULL,
	`avgReturn` int NOT NULL,
	`maxDrawdown` int NOT NULL,
	`followers` int NOT NULL DEFAULT 0,
	`copiedTrades` int NOT NULL DEFAULT 0,
	`rating` int NOT NULL,
	`verified` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `traders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `copied_trades` ADD CONSTRAINT `copied_trades_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `copied_trades` ADD CONSTRAINT `copied_trades_traderId_traders_id_fk` FOREIGN KEY (`traderId`) REFERENCES `traders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trader_followers` ADD CONSTRAINT `trader_followers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trader_followers` ADD CONSTRAINT `trader_followers_traderId_traders_id_fk` FOREIGN KEY (`traderId`) REFERENCES `traders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `traders` ADD CONSTRAINT `traders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;