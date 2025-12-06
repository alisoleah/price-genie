CREATE TABLE `basketItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`basketId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `basketItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `baskets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `baskets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platforms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`baseUrl` varchar(500) NOT NULL,
	`logoUrl` varchar(500),
	`scrapingConfig` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platforms_id` PRIMARY KEY(`id`),
	CONSTRAINT `platforms_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `priceAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`targetPrice` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AED',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priceAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rawProductId` int NOT NULL,
	`price` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'AED',
	`availability` enum('in_stock','low_stock','out_of_stock') NOT NULL DEFAULT 'in_stock',
	`scrapedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`canonicalName` varchar(500) NOT NULL,
	`category` varchar(100),
	`brand` varchar(100),
	`attributes` json,
	`embedding` json,
	`imageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rawProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformId` int NOT NULL,
	`rawTitle` text NOT NULL,
	`rawDescription` text,
	`url` varchar(1000) NOT NULL,
	`imageUrl` varchar(500),
	`matchedProductId` int,
	`matchConfidence` float,
	`embedding` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rawProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `url_unique` UNIQUE(`platformId`,`url`)
);
--> statement-breakpoint
CREATE TABLE `scrapeJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platformId` int NOT NULL,
	`status` enum('pending','running','success','failed') NOT NULL DEFAULT 'pending',
	`category` varchar(100),
	`productsScraped` int DEFAULT 0,
	`errors` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`nextRetryAt` timestamp,
	`retryCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scrapeJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platformId` int NOT NULL,
	`membershipType` varchar(100) NOT NULL,
	`discountPercent` float DEFAULT 0,
	`freeShipping` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userMemberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_platform_unique` UNIQUE(`userId`,`platformId`)
);
--> statement-breakpoint
ALTER TABLE `basketItems` ADD CONSTRAINT `basketItems_basketId_baskets_id_fk` FOREIGN KEY (`basketId`) REFERENCES `baskets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `basketItems` ADD CONSTRAINT `basketItems_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `baskets` ADD CONSTRAINT `baskets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceAlerts` ADD CONSTRAINT `priceAlerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceAlerts` ADD CONSTRAINT `priceAlerts_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceSnapshots` ADD CONSTRAINT `priceSnapshots_rawProductId_rawProducts_id_fk` FOREIGN KEY (`rawProductId`) REFERENCES `rawProducts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rawProducts` ADD CONSTRAINT `rawProducts_platformId_platforms_id_fk` FOREIGN KEY (`platformId`) REFERENCES `platforms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rawProducts` ADD CONSTRAINT `rawProducts_matchedProductId_products_id_fk` FOREIGN KEY (`matchedProductId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scrapeJobs` ADD CONSTRAINT `scrapeJobs_platformId_platforms_id_fk` FOREIGN KEY (`platformId`) REFERENCES `platforms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userMemberships` ADD CONSTRAINT `userMemberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userMemberships` ADD CONSTRAINT `userMemberships_platformId_platforms_id_fk` FOREIGN KEY (`platformId`) REFERENCES `platforms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `basket_idx` ON `basketItems` (`basketId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `baskets` (`userId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `conversation_idx` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `user_product_idx` ON `priceAlerts` (`userId`,`productId`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `priceAlerts` (`isActive`);--> statement-breakpoint
CREATE INDEX `raw_product_scraped_idx` ON `priceSnapshots` (`rawProductId`,`scrapedAt`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `brand_idx` ON `products` (`brand`);--> statement-breakpoint
CREATE INDEX `platform_idx` ON `rawProducts` (`platformId`);--> statement-breakpoint
CREATE INDEX `matched_product_idx` ON `rawProducts` (`matchedProductId`);--> statement-breakpoint
CREATE INDEX `platform_status_idx` ON `scrapeJobs` (`platformId`,`status`);--> statement-breakpoint
CREATE INDEX `started_at_idx` ON `scrapeJobs` (`startedAt`);