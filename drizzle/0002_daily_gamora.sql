CREATE TABLE `alert_conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assetId` int NOT NULL,
	`alertType` enum('price_above','price_below','price_change_percent','score_above','score_below','volume_surge','sentiment_change') NOT NULL,
	`threshold` int,
	`secondaryThreshold` int,
	`enabled` int DEFAULT 1,
	`notifyEmail` int DEFAULT 1,
	`notifyPush` int DEFAULT 1,
	`notifyWebsocket` int DEFAULT 1,
	`cooldownMinutes` int DEFAULT 60,
	`lastTriggeredAt` timestamp,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_conditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conditionId` int NOT NULL,
	`userId` int NOT NULL,
	`assetId` int NOT NULL,
	`alertType` varchar(64) NOT NULL,
	`message` text,
	`triggerValue` int,
	`thresholdValue` int,
	`emailSent` int DEFAULT 0,
	`pushSent` int DEFAULT 0,
	`websocketSent` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alert_conditions` ADD CONSTRAINT `alert_conditions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_conditions` ADD CONSTRAINT `alert_conditions_assetId_crypto_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `crypto_assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `alert_history_conditionId_alert_conditions_id_fk` FOREIGN KEY (`conditionId`) REFERENCES `alert_conditions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `alert_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_history` ADD CONSTRAINT `alert_history_assetId_crypto_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `crypto_assets`(`id`) ON DELETE no action ON UPDATE no action;