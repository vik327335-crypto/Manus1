CREATE TABLE `exchange_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('binance','coinbase','kraken') NOT NULL,
	`apiKeyCiphertext` text NOT NULL,
	`apiSecretCiphertext` text NOT NULL,
	`apiPassphraseCiphertext` text,
	`keyFingerprint` varchar(24) NOT NULL,
	`permissionMode` enum('read_only') NOT NULL DEFAULT 'read_only',
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exchange_connections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `exchange_connections_user_provider_idx` ON `exchange_connections` (`userId`,`provider`);