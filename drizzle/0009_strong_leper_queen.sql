CREATE TABLE `market_provider_incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`providerType` varchar(32) NOT NULL,
	`issueSummary` varchar(255) NOT NULL,
	`severity` varchar(24) NOT NULL DEFAULT 'OUTAGE',
	`status` varchar(24) NOT NULL DEFAULT 'OPEN',
	`resolutionNotes` text,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `market_provider_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_provider_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`bankProviderUrl` text,
	`bankProviderApiKey` text,
	`dseProviderUrl` text,
	`dseProviderApiKey` text,
	`slackWebhookUrl` text,
	`outageEmailRecipients` text,
	`alertOnOutage` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `market_provider_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `market_provider_settings_companyId_unique` UNIQUE(`companyId`)
);
--> statement-breakpoint
CREATE TABLE `market_provider_uptime_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`providerType` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL,
	`latencyMs` int NOT NULL DEFAULT 0,
	`statusCode` int,
	`errorMessage` text,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_provider_uptime_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `market_incident_company_status_idx` ON `market_provider_incidents` (`companyId`,`status`);--> statement-breakpoint
CREATE INDEX `market_provider_settings_company_idx` ON `market_provider_settings` (`companyId`);--> statement-breakpoint
CREATE INDEX `market_uptime_company_checked_idx` ON `market_provider_uptime_logs` (`companyId`,`checkedAt`);