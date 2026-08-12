CREATE TABLE `webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` varchar(80) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`action` varchar(100) NOT NULL,
	`module` varchar(50) NOT NULL,
	`severity` varchar(16) NOT NULL,
	`status` enum('success','failed','retrying') NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`responseCode` int,
	`error` text,
	`eventSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_deliveries_deliveryId_unique` UNIQUE(`deliveryId`)
);
--> statement-breakpoint
CREATE INDEX `webhook_delivery_company_status_idx` ON `webhook_deliveries` (`companyId`,`status`);--> statement-breakpoint
CREATE INDEX `webhook_delivery_created_at_idx` ON `webhook_deliveries` (`createdAt`);