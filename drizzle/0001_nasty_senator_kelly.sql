CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorOpenId` varchar(64) NOT NULL,
	`actorName` varchar(120),
	`companyId` varchar(64) NOT NULL,
	`action` varchar(100) NOT NULL,
	`module` varchar(50) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `audit_logs_company_id_idx` ON `audit_logs` (`companyId`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_open_id_idx` ON `audit_logs` (`actorOpenId`);