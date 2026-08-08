import pg from "pg";
import { ApiError } from "./errors.mjs";

const { Pool } = pg;

export function createPool(connectionString) {
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return new Pool({ connectionString, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
}

export async function withTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function mapDatabaseError(error) {
  if (error instanceof ApiError) return error;
  if (error?.code === "23505") return new ApiError(409, "CONFLICT", "Resource already exists");
  if (error?.code === "23503" || error?.code === "23514") return new ApiError(422, "INTEGRITY_ERROR", "Request violates domain integrity");
  return error;
}
