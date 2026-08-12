ALTER TABLE `webhook_delivery_logs` ADD `attemptCount` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `webhook_delivery_logs` ADD `retried` int DEFAULT 0 NOT NULL;