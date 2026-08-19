CREATE TABLE `exchange_connection_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`connectionId` int NOT NULL,
	`userId` int NOT NULL,
	`action` enum('created','disabled','enabled','rotated','deleted','permission_check','balance_check') NOT NULL,
	`details` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exchange_connection_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `exchange_connection_audits_connection_created_idx` ON `exchange_connection_audits` (`connectionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `exchange_connection_audits_user_created_idx` ON `exchange_connection_audits` (`userId`,`createdAt`);