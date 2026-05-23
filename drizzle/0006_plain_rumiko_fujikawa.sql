CREATE TABLE `day_trading_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyName` varchar(100) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`type` varchar(10) NOT NULL,
	`quantity` int NOT NULL,
	`openPrice` int NOT NULL,
	`closePrice` int,
	`stopLoss` int,
	`takeProfit` int,
	`openTime` int NOT NULL,
	`closeTime` int,
	`pnl` int,
	`pnlPercent` int,
	`status` varchar(20) NOT NULL DEFAULT 'OPEN',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `day_trading_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `day_trading_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyName` varchar(100) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`type` varchar(10) NOT NULL,
	`price` int NOT NULL,
	`confidence` int NOT NULL,
	`reasons` text,
	`timestamp` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `day_trading_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `day_trading_positions` ADD CONSTRAINT `day_trading_positions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `day_trading_signals` ADD CONSTRAINT `day_trading_signals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;