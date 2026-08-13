CREATE TABLE `webhook_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(80) NOT NULL,
	`url` text NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`encryptedSecret` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_configurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_configurations_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE INDEX `webhook_configuration_key_idx` ON `webhook_configurations` (`configKey`);