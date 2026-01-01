CREATE TABLE `adBanners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`imageUrl` text NOT NULL,
	`targetUrl` text NOT NULL,
	`placement` enum('home','community','strains','tools') NOT NULL DEFAULT 'home',
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`costPerClick` decimal(6,4),
	`totalSpent` decimal(10,2) DEFAULT '0',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adBanners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auctionBids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auctionId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auctionBids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auctions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`productId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`imageUrl` text,
	`startPrice` decimal(10,2) NOT NULL,
	`currentPrice` decimal(10,2) NOT NULL,
	`buyNowPrice` decimal(10,2),
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`winnerId` int,
	`status` enum('pending','active','ended','cancelled') NOT NULL DEFAULT 'pending',
	`totalBids` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auctions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('post','question','showcase','giveaway') NOT NULL DEFAULT 'post',
	`title` varchar(200),
	`content` text NOT NULL,
	`images` json,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`isApproved` boolean DEFAULT true,
	`isPinned` boolean DEFAULT false,
	`giveawayEndsAt` timestamp,
	`giveawayPrize` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communityPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnoses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plantId` int,
	`imageUrl` text NOT NULL,
	`diagnosis` text,
	`confidence` decimal(5,2),
	`issues` json,
	`recommendations` json,
	`identifiedStrain` varchar(100),
	`identifiedGender` enum('male','female','hermaphrodite','unknown'),
	`growthStage` varchar(50),
	`healthScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diagnoses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `giveawayEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`giveawayId` int NOT NULL,
	`userId` int NOT NULL,
	`ticketCount` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `giveawayEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `giveaways` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int,
	`title` varchar(200) NOT NULL,
	`description` text,
	`prize` text NOT NULL,
	`prizeValue` decimal(10,2),
	`imageUrl` text,
	`entryFee` decimal(10,2) DEFAULT '0',
	`maxEntries` int,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`winnerId` int,
	`status` enum('pending','active','ended','cancelled') NOT NULL DEFAULT 'pending',
	`totalEntries` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `giveaways_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journalEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plantId` int,
	`type` enum('note','watering','feeding','training','photo','measurement','issue','milestone') NOT NULL DEFAULT 'note',
	`title` varchar(200),
	`content` text,
	`height` decimal(5,1),
	`ph` decimal(3,1),
	`ec` decimal(4,2),
	`temperature` decimal(4,1),
	`humidity` decimal(4,1),
	`images` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journalEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaderboardEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`period` enum('weekly','monthly','alltime') NOT NULL,
	`periodStart` timestamp NOT NULL,
	`totalYield` decimal(10,2) DEFAULT '0',
	`totalPlants` int DEFAULT 0,
	`totalDiagnoses` int DEFAULT 0,
	`xpEarned` int DEFAULT 0,
	`rank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboardEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`strain` varchar(100),
	`strainType` enum('indica','sativa','hybrid'),
	`phase` enum('seedling','vegetative','flowering','harvest','curing','completed') NOT NULL DEFAULT 'seedling',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`harvestDate` timestamp,
	`growType` enum('indoor','outdoor','greenhouse') DEFAULT 'indoor',
	`medium` varchar(50),
	`lightSchedule` varchar(20),
	`height` decimal(5,1),
	`yield` decimal(8,2),
	`notes` text,
	`imageUrl` text,
	`isArchived` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`parentId` int,
	`content` text NOT NULL,
	`likes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `postComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` varchar(50) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`progress` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAchievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendorInquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`contactName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`website` text,
	`businessType` enum('seedbank','growshop','headshop','nutrient','equipment','other') NOT NULL,
	`message` text,
	`status` enum('new','contacted','negotiating','approved','rejected') NOT NULL DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendorInquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendorProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`category` enum('seeds','equipment','nutrients','accessories','other') NOT NULL DEFAULT 'other',
	`imageUrl` text,
	`externalUrl` text,
	`strainName` varchar(100),
	`seedCount` int,
	`seedType` enum('regular','feminized','autoflower'),
	`isActive` boolean DEFAULT true,
	`isFeatured` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendorProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(200) NOT NULL,
	`email` varchar(320) NOT NULL,
	`website` text,
	`description` text,
	`logoUrl` text,
	`type` enum('seedbank','growshop','headshop','nutrient','equipment','other') NOT NULL DEFAULT 'other',
	`plan` enum('basic','professional','enterprise') NOT NULL DEFAULT 'basic',
	`planExpiresAt` timestamp,
	`totalProducts` int DEFAULT 0,
	`totalSales` int DEFAULT 0,
	`rating` decimal(3,2),
	`isVerified` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','vendor') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `location` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `isPublic` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `level` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `xp` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `streak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastActiveAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','premium','pro') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `revenuecatId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `totalPlants` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalHarvests` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalYield` decimal(10,2) DEFAULT '0';