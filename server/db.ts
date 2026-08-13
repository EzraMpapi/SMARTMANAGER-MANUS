import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let lastDatabaseHealthCheckAt = 0;
const DATABASE_HEALTH_CHECK_WINDOW_MS = 10_000;

export class DatabaseUnavailableError extends Error {
  constructor(message = "The platform persistence database is temporarily unavailable.") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export function isTransientDatabaseError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
  return /enotfound|eai_again|dns|timeout|timed out|etimedout|econnreset|econnrefused|socket hang up/.test(message);
}

function waitForDatabaseRetry(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function withDatabaseRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt === 1) break;
      _db = null;
      await waitForDatabaseRetry(250 * (attempt + 1));
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError || "unknown error");
  throw new DatabaseUnavailableError(`${label} could not reach the platform persistence database: ${detail}`);
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  if (!_db) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to create a connection client:", error);
      _db = null;
    }
  }
  if (!_db) return null;

  if (Date.now() - lastDatabaseHealthCheckAt > DATABASE_HEALTH_CHECK_WINDOW_MS) {
    try {
      await _db.execute(sql`SELECT 1`);
      lastDatabaseHealthCheckAt = Date.now();
    } catch (error) {
      _db = null;
      console.warn("[Database] Platform persistence health check failed:", error instanceof Error ? error.message : error);
      return null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new DatabaseUnavailableError("Cannot synchronize the authenticated platform user because the persistence database is unavailable.");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await withDatabaseRetry(
      () => db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet }),
      "User synchronization",
    );
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    throw new DatabaseUnavailableError("Cannot load the authenticated platform user because the persistence database is unavailable.");
  }

  const result = await withDatabaseRetry(
    () => db.select().from(users).where(eq(users.openId, openId)).limit(1),
    "User lookup",
  );

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
