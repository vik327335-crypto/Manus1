CREATE TABLE `paper_trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`type` varchar(10) NOT NULL,
	`entryPrice` int NOT NULL,
	`exitPrice` int,
	`quantity` int NOT NULL,
	`pnl` int,
	`pnlPercent` int,
	`status` varchar(20) NOT NULL DEFAULT 'OPEN',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `paper_trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paper_trading_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`initialBalance` int NOT NULL,
	`currentBalance` int NOT NULL,
	`totalProfit` int NOT NULL DEFAULT 0,
	`totalReturn` int NOT NULL DEFAULT 0,
	`trades` int NOT NULL DEFAULT 0,
	`winRate` int NOT NULL DEFAULT 0,
	`maxDrawdown` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paper_trading_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quest_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`isCompleted` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quest_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`difficulty` varchar(20) NOT NULL,
	`reward` int NOT NULL,
	`badge` varchar(100),
	`requirements` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutorial_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tutorialId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 0,
	`completedSteps` int NOT NULL DEFAULT 0,
	`isCompleted` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutorial_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutorial_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tutorialId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`action` varchar(255),
	`targetElement` varchar(255),
	`highlightArea` varchar(255),
	`tips` text,
	`order` int NOT NULL,
	CONSTRAINT `tutorial_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tutorials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`difficulty` varchar(20) NOT NULL DEFAULT 'beginner',
	`estimatedTime` int NOT NULL,
	`order` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutorials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badge` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`points` int NOT NULL DEFAULT 0,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `paper_trades` ADD CONSTRAINT `paper_trades_accountId_paper_trading_accounts_id_fk` FOREIGN KEY (`accountId`) REFERENCES `paper_trading_accounts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paper_trading_accounts` ADD CONSTRAINT `paper_trading_accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quest_progress` ADD CONSTRAINT `quest_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quest_progress` ADD CONSTRAINT `quest_progress_questId_quests_id_fk` FOREIGN KEY (`questId`) REFERENCES `quests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tutorial_progress` ADD CONSTRAINT `tutorial_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tutorial_progress` ADD CONSTRAINT `tutorial_progress_tutorialId_tutorials_id_fk` FOREIGN KEY (`tutorialId`) REFERENCES `tutorials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tutorial_steps` ADD CONSTRAINT `tutorial_steps_tutorialId_tutorials_id_fk` FOREIGN KEY (`tutorialId`) REFERENCES `tutorials`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;