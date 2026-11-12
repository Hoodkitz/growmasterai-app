CREATE TABLE `growCommands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tentId` int NOT NULL,
	`deviceId` int NOT NULL,
	`actuator` varchar(20) NOT NULL,
	`payload` json NOT NULL,
	`reason` varchar(300) NOT NULL,
	`source` enum('controller','ai','user','safety') NOT NULL,
	`status` enum('proposed','pending','sent','done','failed','expired','rejected') NOT NULL,
	`result` varchar(200),
	`createdAt` bigint NOT NULL,
	`sentAt` bigint,
	`doneAt` bigint,
	CONSTRAINT `growCommands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growDevices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tentId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`kind` enum('http','simulator','homeassistant') NOT NULL,
	`tokenHash` varchar(64),
	`tokenHint` varchar(16),
	`caps` json NOT NULL,
	`state` json,
	`lastSeenAt` bigint,
	`firmware` varchar(40),
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `growDevices_id` PRIMARY KEY(`id`),
	CONSTRAINT `growDevices_token_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `growEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tentId` int NOT NULL,
	`level` enum('info','warn','alarm') NOT NULL,
	`kind` varchar(40) NOT NULL,
	`message` varchar(500) NOT NULL,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `growEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growReadings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tentId` int NOT NULL,
	`deviceId` int NOT NULL,
	`metric` varchar(20) NOT NULL,
	`value` double NOT NULL,
	`ts` bigint NOT NULL,
	CONSTRAINT `growReadings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tentId` int NOT NULL,
	`deviceId` int NOT NULL,
	`image` mediumtext NOT NULL,
	`source` enum('device','app') NOT NULL DEFAULT 'device',
	`analysis` json,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `growSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `growTents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`settings` json NOT NULL,
	`limits` json,
	`automation` json,
	`adjustments` json,
	`mode` enum('off','assist','auto') NOT NULL DEFAULT 'assist',
	`simState` json,
	`lastTickAt` bigint,
	`aiReviewAt` bigint,
	`aiSummary` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `growTents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `growCommands_device_status` ON `growCommands` (`deviceId`,`status`);--> statement-breakpoint
CREATE INDEX `growCommands_tent_created` ON `growCommands` (`tentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `growDevices_tent_idx` ON `growDevices` (`tentId`);--> statement-breakpoint
CREATE INDEX `growEvents_tent_created` ON `growEvents` (`tentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `growReadings_tent_metric_ts` ON `growReadings` (`tentId`,`metric`,`ts`);--> statement-breakpoint
CREATE INDEX `growSnapshots_tent_created` ON `growSnapshots` (`tentId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `growTents_user_idx` ON `growTents` (`userId`);