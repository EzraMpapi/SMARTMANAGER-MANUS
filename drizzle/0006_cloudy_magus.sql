CREATE TABLE `tra_vat_anomaly_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`branchId` varchar(64),
	`period` varchar(32) NOT NULL,
	`currentVat` varchar(40) NOT NULL,
	`historicalAverageVat` varchar(40) NOT NULL,
	`variancePercent` varchar(40) NOT NULL,
	`thresholdPercent` int NOT NULL,
	`status` varchar(24) NOT NULL,
	`deliveryStatus` varchar(24) NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tra_vat_anomaly_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tra_vat_anomaly_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`thresholdPercent` int NOT NULL DEFAULT 50,
	`cooldownMinutes` int NOT NULL DEFAULT 1440,
	`cronExpression` varchar(64) NOT NULL DEFAULT '0 0 6 * * *',
	`scheduleCronTaskUid` varchar(65),
	`lastEvaluatedAt` timestamp,
	`lastAlertAt` timestamp,
	`lastDeliveryStatus` varchar(24),
	`lastMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tra_vat_anomaly_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `tra_vat_anomaly_settings_companyId_unique` UNIQUE(`companyId`)
);
--> statement-breakpoint
ALTER TABLE `dashboard_report_schedules` ADD `ccEmails` varchar(2000) DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `tra_vat_anomaly_event_company_created_idx` ON `tra_vat_anomaly_events` (`companyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `tra_vat_anomaly_company_idx` ON `tra_vat_anomaly_settings` (`companyId`);--> statement-breakpoint
CREATE INDEX `tra_vat_anomaly_task_uid_idx` ON `tra_vat_anomaly_settings` (`scheduleCronTaskUid`);