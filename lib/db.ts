import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/drizzle/schema";

const globalForDb = globalThis as unknown as {
  connectionPool?: Pool;
  dbInstance?: NodePgDatabase<typeof schema>;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Pool({ connectionString, max: 5, ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined });
}

export const pool: Pool = globalForDb.connectionPool ?? createPool();

if (!globalForDb.connectionPool) {
  globalForDb.connectionPool = pool;
}

export const db = globalForDb.dbInstance ?? drizzle(pool, { schema });

if (!globalForDb.dbInstance) {
  globalForDb.dbInstance = db;
}
