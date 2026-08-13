CREATE TABLE `schema_drift_monitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monitorKey` varchar(80) NOT NULL,
	`cronExpression` varchar(64) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastCheckedAt` timestamp,
	`lastStatus` varchar(16),
	`lastSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schema_drift_monitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `schema_drift_monitors_monitorKey_unique` UNIQUE(`monitorKey`)
);
--> statement-breakpoint
CREATE TABLE `schema_drift_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monitorId` int NOT NULL,
	`status` enum('healthy','drift','error') NOT NULL,
	`referencedTableCount` int NOT NULL DEFAULT 0,
	`deployedTableCount` int NOT NULL DEFAULT 0,
	`missingTables` json NOT NULL,
	`tenantTableIssues` json NOT NULL,
	`notificationDelivered` boolean NOT NULL DEFAULT false,
	`error` text,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `schema_drift_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `schema_drift_monitor_key_idx` ON `schema_drift_monitors` (`monitorKey`);--> statement-breakpoint
CREATE INDEX `schema_drift_monitor_task_uid_idx` ON `schema_drift_monitors` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `schema_drift_runs_monitor_checked_at_idx` ON `schema_drift_runs` (`monitorId`,`checkedAt`);--> statement-breakpoint
CREATE INDEX `schema_drift_runs_status_checked_at_idx` ON `schema_drift_runs` (`status`,`checkedAt`);