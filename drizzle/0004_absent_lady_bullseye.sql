CREATE TABLE `contentReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('post','comment','message','user') NOT NULL,
	`targetId` int NOT NULL,
	`reportedUserId` int NOT NULL,
	`reason` varchar(40) NOT NULL,
	`details` varchar(500),
	`status` enum('open','actioned','dismissed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `contentReports_reporter_target_unique` UNIQUE(`reporterId`,`targetType`,`targetId`)
);
--> statement-breakpoint
CREATE TABLE `userBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockerId` int NOT NULL,
	`blockedId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userBlocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `userBlocks_blocker_blocked_unique` UNIQUE(`blockerId`,`blockedId`)
);
