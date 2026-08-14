CREATE TABLE `team_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitationId` varchar(72) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`fullName` varchar(120) NOT NULL,
	`role` varchar(80) NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`status` enum('pending','accepted','revoked','expired','delivery_failed') NOT NULL DEFAULT 'pending',
	`invitedByProfileId` varchar(64) NOT NULL,
	`invitedByRole` varchar(80) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedByProfileId` varchar(64),
	`deliveryMessageId` varchar(120),
	`deliveryError` varchar(500),
	`emailSentAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_invitations_invitationId_unique` UNIQUE(`invitationId`),
	CONSTRAINT `team_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `team_invitation_company_status_idx` ON `team_invitations` (`companyId`,`status`);--> statement-breakpoint
CREATE INDEX `team_invitation_email_idx` ON `team_invitations` (`email`);--> statement-breakpoint
CREATE INDEX `team_invitation_expires_at_idx` ON `team_invitations` (`expiresAt`);