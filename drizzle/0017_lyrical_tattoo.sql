CREATE TABLE `research_hypothesis_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hypothesisId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(40) NOT NULL,
	`details` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `research_hypothesis_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `research_hypothesis_audits_hypothesis_created_idx` ON `research_hypothesis_audits` (`hypothesisId`,`createdAt`);