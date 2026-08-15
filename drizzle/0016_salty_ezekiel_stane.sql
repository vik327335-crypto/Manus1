CREATE TABLE `research_hypotheses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`hypothesis` text NOT NULL,
	`status` enum('draft','preregistered','validated','rejected','inconclusive') NOT NULL DEFAULT 'draft',
	`falsificationCriteria` text NOT NULL,
	`protocolPath` varchar(320),
	`resultPath` varchar(320),
	`sampleAdequacy` enum('not_assessed','insufficient','adequate') NOT NULL DEFAULT 'not_assessed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_hypotheses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `research_hypotheses_user_status_idx` ON `research_hypotheses` (`userId`,`status`);