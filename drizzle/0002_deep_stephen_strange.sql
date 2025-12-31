CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`parentId` int,
	`description` text,
	`imageUrl` varchar(500),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `productViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`userId` int,
	`sessionId` varchar(64),
	`referrer` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`query` varchar(500) NOT NULL,
	`resultsCount` int NOT NULL DEFAULT 0,
	`clickedProductId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_parentId_categories_id_fk` FOREIGN KEY (`parentId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productViews` ADD CONSTRAINT `productViews_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productViews` ADD CONSTRAINT `productViews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `searchHistory` ADD CONSTRAINT `searchHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `searchHistory` ADD CONSTRAINT `searchHistory_clickedProductId_products_id_fk` FOREIGN KEY (`clickedProductId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `parent_idx` ON `categories` (`parentId`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `productViews` (`productId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `productViews` (`userId`);--> statement-breakpoint
CREATE INDEX `session_idx` ON `productViews` (`sessionId`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `productViews` (`createdAt`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `searchHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `query_idx` ON `searchHistory` (`query`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `searchHistory` (`createdAt`);