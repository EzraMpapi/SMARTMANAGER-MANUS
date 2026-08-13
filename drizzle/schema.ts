import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
