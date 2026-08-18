CREATE TABLE `tra_gateway_alert_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`branchId` varchar(64),
	`providerStatus` varchar(24) NOT NULL,
	`latencyMs` int NOT NULL,
	`thresholdMs` int NOT NULL,
	`deliveryStatus` varchar(24) NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tra_gateway_alert_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tra_gateway_alert_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`timeoutThresholdMs` int NOT NULL DEFAULT 1500,
	`cooldownMinutes` int NOT NULL DEFAULT 30,
	`lastAlertAt` timestamp,
	`lastDeliveryStatus` varchar(24),
	`lastMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tra_gateway_alert_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `tra_gateway_alert_settings_companyId_unique` UNIQUE(`companyId`)
);
--> statement-breakpoint
CREATE TABLE `tra_z_report_archive_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`branchId` varchar(64) NOT NULL DEFAULT 'MAIN',
	`cronExpression` varchar(64) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`lastRunStatus` varchar(24),
	`lastArchiveId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tra_z_report_archive_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `tra_z_archive_schedule_company_branch_unique` UNIQUE(`companyId`,`branchId`)
);
--> statement-breakpoint
CREATE TABLE `tra_z_report_archives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`branchId` varchar(64) NOT NULL DEFAULT 'MAIN',
	`businessDate` varchar(32) NOT NULL,
	`zReportId` int,
	`zNumber` varchar(64),
	`status` varchar(24) NOT NULL,
	`storageKey` varchar(500),
	`storageUrl` varchar(500),
	`contentType` varchar(120) NOT NULL DEFAULT 'application/json',
	`archiveBytes` int NOT NULL DEFAULT 0,
	`summary` json NOT NULL,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tra_z_report_archives_id` PRIMARY KEY(`id`),
	CONSTRAINT `tra_z_archive_company_branch_date_unique` UNIQUE(`companyId`,`branchId`,`businessDate`)
);
--> statement-breakpoint
CREATE INDEX `tra_gateway_alert_event_company_created_idx` ON `tra_gateway_alert_events` (`companyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tra_gateway_alert_company_idx` ON `tra_gateway_alert_settings` (`companyId`);--> statement-breakpoint
CREATE INDEX `tra_z_archive_schedule_owner_idx` ON `tra_z_report_archive_schedules` (`ownerOpenId`);--> statement-breakpoint
CREATE INDEX `tra_z_archive_schedule_task_uid_idx` ON `tra_z_report_archive_schedules` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `tra_z_archive_company_created_idx` ON `tra_z_report_archives` (`companyId`,`createdAt`);