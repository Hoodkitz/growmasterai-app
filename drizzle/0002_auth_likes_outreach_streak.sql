CREATE TABLE IF NOT EXISTS `postLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postLikes_id` PRIMARY KEY(`id`),
	CONSTRAINT `postLikes_post_user_unique` UNIQUE(`postId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_credentials` (
	`openId` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_credentials_openId` PRIMARY KEY(`openId`),
	CONSTRAINT `user_credentials_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `vendorLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`customerName` varchar(200) NOT NULL,
	`customerEmail` varchar(320),
	`type` enum('product_inquiry','bulk_order','consultation','other') NOT NULL DEFAULT 'product_inquiry',
	`value` decimal(10,2) DEFAULT '0',
	`status` enum('new','contacted','qualified','converted','lost') NOT NULL DEFAULT 'new',
	`message` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendorLeads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `vendorOutreach` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`contactName` varchar(200),
	`email` varchar(320) NOT NULL,
	`website` varchar(500),
	`vendorType` enum('seedbank','growshop','headshop','nutrient','equipment','other') NOT NULL DEFAULT 'other',
	`country` varchar(8),
	`templateId` varchar(64) NOT NULL,
	`status` enum('pending','sent','opened','replied','converted','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`sentAt` timestamp,
	`openedAt` timestamp,
	`repliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendorOutreach_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adBanners` MODIFY COLUMN `placement` enum('home','community','strains','tools','marketplace') NOT NULL DEFAULT 'home';--> statement-breakpoint
ALTER TABLE `users` ADD `longestStreak` int DEFAULT 0 NOT NULL;