CREATE TABLE `auth_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`type` enum('password_reset','email_verify') NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_tokens_hash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `pushTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`platform` varchar(16),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `pushTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `plants` ADD `clientId` varchar(64);--> statement-breakpoint
ALTER TABLE `plants` ADD `clientUpdatedAt` bigint;--> statement-breakpoint
ALTER TABLE `plants` ADD `deletedAt` bigint;--> statement-breakpoint
ALTER TABLE `user_credentials` ADD `emailVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `giveawayEntries` ADD CONSTRAINT `giveawayEntries_giveaway_user_unique` UNIQUE(`giveawayId`,`userId`);--> statement-breakpoint
ALTER TABLE `plants` ADD CONSTRAINT `plants_user_client_unique` UNIQUE(`userId`,`clientId`);