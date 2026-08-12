CREATE TABLE `webhook_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`channelType` enum('generic','discord','slack','telegram') NOT NULL DEFAULT 'generic',
	`endpointUrl` text NOT NULL,
	`eventTypes` text NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_delivery_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channelId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`success` int NOT NULL DEFAULT 0,
	`statusCode` int,
	`responseSummary` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_delivery_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `webhook_channels` ADD CONSTRAINT `webhook_channels_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhook_delivery_logs` ADD CONSTRAINT `webhook_delivery_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhook_delivery_logs` ADD CONSTRAINT `webhook_delivery_logs_channelId_webhook_channels_id_fk` FOREIGN KEY (`channelId`) REFERENCES `webhook_channels`(`id`) ON DELETE no action ON UPDATE no action;