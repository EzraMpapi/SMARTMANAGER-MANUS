CREATE TABLE `dashboard_report_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`cronExpression` varchar(64) NOT NULL,
	`frequency` varchar(24) NOT NULL,
	`format` varchar(8) NOT NULL,
	`modules` json NOT NULL,
	`dateRange` json NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_report_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `dashboard_report_owner_open_id_idx` ON `dashboard_report_schedules` (`ownerOpenId`);--> statement-breakpoint
CREATE INDEX `dashboard_report_task_uid_idx` ON `dashboard_report_schedules` (`scheduleCronTaskUid`);