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