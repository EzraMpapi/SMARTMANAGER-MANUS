import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const dashboardReportSchedules = mysqlTable("dashboard_report_schedules", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  ccEmails: varchar("ccEmails", { length: 2000 }).notNull().default(""),
  cronExpression: varchar("cronExpression", { length: 64 }).notNull(),
  frequency: varchar("frequency", { length: 24 }).notNull(),
  format: varchar("format", { length: 8 }).notNull(),
  modules: json("modules").notNull(),
  dateRange: json("dateRange").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastSentAt: timestamp("lastSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerOpenIdIdx: index("dashboard_report_owner_open_id_idx").on(table.ownerOpenId),
  taskUidIdx: index("dashboard_report_task_uid_idx").on(table.scheduleCronTaskUid),
}));

export type DashboardReportSchedule = typeof dashboardReportSchedules.$inferSelect;
export type InsertDashboardReportSchedule = typeof dashboardReportSchedules.$inferInsert;

export const teamInvitations = mysqlTable("team_invitations", {
  id: int("id").autoincrement().primaryKey(),
  invitationId: varchar("invitationId", { length: 72 }).notNull().unique(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  fullName: varchar("fullName", { length: 120 }).notNull(),
  role: varchar("role", { length: 80 }).notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked", "expired", "delivery_failed"]).notNull().default("pending"),
  invitedByProfileId: varchar("invitedByProfileId", { length: 64 }).notNull(),
  invitedByRole: varchar("invitedByRole", { length: 80 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedByProfileId: varchar("acceptedByProfileId", { length: 64 }),
  deliveryMessageId: varchar("deliveryMessageId", { length: 120 }),
  deliveryError: varchar("deliveryError", { length: 500 }),
  emailSentAt: timestamp("emailSentAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyStatusIdx: index("team_invitation_company_status_idx").on(table.companyId, table.status),
  emailIdx: index("team_invitation_email_idx").on(table.email),
  expiresAtIdx: index("team_invitation_expires_at_idx").on(table.expiresAt),
}));

export type TeamInvitation = typeof teamInvitations.$inferSelect;

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorOpenId: varchar("actorOpenId", { length: 64 }).notNull(),
  actorName: varchar("actorName", { length: 120 }),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  module: varchar("module", { length: 50 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyIdIdx: index("audit_logs_company_id_idx").on(table.companyId),
  actorOpenIdIdx: index("audit_logs_actor_open_id_idx").on(table.actorOpenId),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const webhookDeliveries = mysqlTable("webhook_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: varchar("deliveryId", { length: 80 }).notNull().unique(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  module: varchar("module", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  status: mysqlEnum("status", ["success", "failed", "retrying"]).notNull(),
  attempts: int("attempts").notNull().default(0),
  responseCode: int("responseCode"),
  error: text("error"),
  eventSummary: text("eventSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyStatusIdx: index("webhook_delivery_company_status_idx").on(table.companyId, table.status),
  createdAtIdx: index("webhook_delivery_created_at_idx").on(table.createdAt),
}));

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;

export const schemaDriftMonitors = mysqlTable("schema_drift_monitors", {
  id: int("id").autoincrement().primaryKey(),
  monitorKey: varchar("monitorKey", { length: 80 }).notNull().unique(),
  cronExpression: varchar("cronExpression", { length: 64 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastStatus: varchar("lastStatus", { length: 16 }),
  lastSummary: text("lastSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  monitorKeyIdx: index("schema_drift_monitor_key_idx").on(table.monitorKey),
  taskUidIdx: index("schema_drift_monitor_task_uid_idx").on(table.scheduleCronTaskUid),
}));

export type SchemaDriftMonitor = typeof schemaDriftMonitors.$inferSelect;

export const schemaDriftRuns = mysqlTable("schema_drift_runs", {
  id: int("id").autoincrement().primaryKey(),
  monitorId: int("monitorId").notNull(),
  status: mysqlEnum("status", ["healthy", "drift", "error"]).notNull(),
  referencedTableCount: int("referencedTableCount").notNull().default(0),
  deployedTableCount: int("deployedTableCount").notNull().default(0),
  missingTables: json("missingTables").notNull(),
  tenantTableIssues: json("tenantTableIssues").notNull(),
  notificationDelivered: boolean("notificationDelivered").default(false).notNull(),
  error: text("error"),
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
}, (table) => ({
  monitorCheckedAtIdx: index("schema_drift_runs_monitor_checked_at_idx").on(table.monitorId, table.checkedAt),
  statusCheckedAtIdx: index("schema_drift_runs_status_checked_at_idx").on(table.status, table.checkedAt),
}));

export type SchemaDriftRun = typeof schemaDriftRuns.$inferSelect;

export const traZReportArchiveSchedules = mysqlTable("tra_z_report_archive_schedules", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  branchId: varchar("branchId", { length: 64 }).notNull().default("MAIN"),
  cronExpression: varchar("cronExpression", { length: 64 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  lastRunStatus: varchar("lastRunStatus", { length: 24 }),
  lastArchiveId: int("lastArchiveId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerOpenIdIdx: index("tra_z_archive_schedule_owner_idx").on(table.ownerOpenId),
  companyBranchUnique: uniqueIndex("tra_z_archive_schedule_company_branch_unique").on(table.companyId, table.branchId),
  taskUidIdx: index("tra_z_archive_schedule_task_uid_idx").on(table.scheduleCronTaskUid),
}));

export type TraZReportArchiveSchedule = typeof traZReportArchiveSchedules.$inferSelect;

export const traZReportArchives = mysqlTable("tra_z_report_archives", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  branchId: varchar("branchId", { length: 64 }).notNull().default("MAIN"),
  businessDate: varchar("businessDate", { length: 32 }).notNull(),
  zReportId: int("zReportId"),
  zNumber: varchar("zNumber", { length: 64 }),
  status: varchar("status", { length: 24 }).notNull(),
  storageKey: varchar("storageKey", { length: 500 }),
  storageUrl: varchar("storageUrl", { length: 500 }),
  contentType: varchar("contentType", { length: 120 }).notNull().default("application/json"),
  archiveBytes: int("archiveBytes").notNull().default(0),
  summary: json("summary").notNull(),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyDateBranchUnique: uniqueIndex("tra_z_archive_company_branch_date_unique").on(table.companyId, table.branchId, table.businessDate),
  companyCreatedAtIdx: index("tra_z_archive_company_created_idx").on(table.companyId, table.createdAt),
}));

export type TraZReportArchive = typeof traZReportArchives.$inferSelect;

export const traGatewayAlertSettings = mysqlTable("tra_gateway_alert_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  timeoutThresholdMs: int("timeoutThresholdMs").default(1500).notNull(),
  cooldownMinutes: int("cooldownMinutes").default(30).notNull(),
  lastAlertAt: timestamp("lastAlertAt"),
  lastDeliveryStatus: varchar("lastDeliveryStatus", { length: 24 }),
  lastMessage: text("lastMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyIdx: index("tra_gateway_alert_company_idx").on(table.companyId),
}));

export type TraGatewayAlertSettings = typeof traGatewayAlertSettings.$inferSelect;

export const traGatewayAlertEvents = mysqlTable("tra_gateway_alert_events", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  branchId: varchar("branchId", { length: 64 }),
  providerStatus: varchar("providerStatus", { length: 24 }).notNull(),
  latencyMs: int("latencyMs").notNull(),
  thresholdMs: int("thresholdMs").notNull(),
  deliveryStatus: varchar("deliveryStatus", { length: 24 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyCreatedAtIdx: index("tra_gateway_alert_event_company_created_idx").on(table.companyId, table.createdAt),
}));

export type TraGatewayAlertEvent = typeof traGatewayAlertEvents.$inferSelect;

export const traVatAnomalySettings = mysqlTable("tra_vat_anomaly_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  thresholdPercent: int("thresholdPercent").default(50).notNull(),
  cooldownMinutes: int("cooldownMinutes").default(1440).notNull(),
  cronExpression: varchar("cronExpression", { length: 64 }).default("0 0 6 * * *").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastEvaluatedAt: timestamp("lastEvaluatedAt"),
  lastAlertAt: timestamp("lastAlertAt"),
  lastDeliveryStatus: varchar("lastDeliveryStatus", { length: 24 }),
  lastMessage: text("lastMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  companyIdx: index("tra_vat_anomaly_company_idx").on(table.companyId),
  taskUidIdx: index("tra_vat_anomaly_task_uid_idx").on(table.scheduleCronTaskUid),
}));

export type TraVatAnomalySettings = typeof traVatAnomalySettings.$inferSelect;

export const traVatAnomalyEvents = mysqlTable("tra_vat_anomaly_events", {
  id: int("id").autoincrement().primaryKey(),
  companyId: varchar("companyId", { length: 64 }).notNull(),
  branchId: varchar("branchId", { length: 64 }),
  period: varchar("period", { length: 32 }).notNull(),
  currentVat: varchar("currentVat", { length: 40 }).notNull(),
  historicalAverageVat: varchar("historicalAverageVat", { length: 40 }).notNull(),
  variancePercent: varchar("variancePercent", { length: 40 }).notNull(),
  thresholdPercent: int("thresholdPercent").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  deliveryStatus: varchar("deliveryStatus", { length: 24 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyCreatedAtIdx: index("tra_vat_anomaly_event_company_created_idx").on(table.companyId, table.createdAt),
}));

export type TraVatAnomalyEvent = typeof traVatAnomalyEvents.$inferSelect;
