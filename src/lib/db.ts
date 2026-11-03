import "server-only";
import { createPool, type Pool, type PoolOptions } from "mysql2/promise";

const globalForDb = globalThis as unknown as { prephubPool?: Pool };

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];

/**
 * Connection options from DATABASE_URL. Hosted databases (anything not on this machine) get TLS by default;
 * set DATABASE_SSL=false to turn it off, and DATABASE_CA_CERT to a PEM certificate for providers with their own CA.
 * Keep in sync with scripts/db-setup.mjs.
 */
function connectionOptions(raw: string): PoolOptions {
  let url: URL;
  try {
    url = new URL(raw.trim().replace(/^(['"])(.*)\1$/, "$2")); // tolerate surrounding quotes pasted into a dashboard
  } catch {
    // Don't echo the value: it contains the password.
    throw new Error(
      'DATABASE_URL is not a valid URL. Set it to just the URL, e.g. mysql://USER:PASSWORD@HOST:PORT/prephub — no "DATABASE_URL=", quotes or other text.',
    );
  }
  const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
  const useSsl = sslSetting ? sslSetting === "true" : !LOCAL_HOSTS.includes(url.hostname);
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: useSsl ? { minVersion: "TLSv1.2", rejectUnauthorized: true, ...(ca ? { ca } : {}) } : undefined,
  };
}

function makePool(): Pool {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and add your MySQL connection string.");
  }
  // Serverless platforms (Vercel) run many small instances, so keep each pool small and let idle connections go quickly.
  const size = Number(process.env.DATABASE_POOL_SIZE) || (process.env.NODE_ENV === "production" ? 3 : 10);
  return createPool({
    ...connectionOptions(uri),
    connectionLimit: size,
    maxIdle: size,
    idleTimeout: 10_000,
    enableKeepAlive: true,
    charset: "utf8mb4",
    dateStrings: true, // DATE / DATETIME come back as strings like "2026-11-02"
    decimalNumbers: true, // DECIMAL / SUM() come back as numbers
  });
}

/** The shared pool, created on first use so builds don't need a database. */
function pool(): Pool {
  globalForDb.prephubPool ??= makePool();
  return globalForDb.prephubPool;
}

/** Run a parameterised query and return the rows. */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool().query(sql, params);
  return rows as T[];
}

/** Run an INSERT/UPDATE/DELETE and return affected rows + insert id. */
export async function execute(sql: string, params: unknown[] = []): Promise<{ affectedRows: number; insertId: number }> {
  const [result] = await pool().query(sql, params);
  const header = result as { affectedRows?: number; insertId?: number };
  return { affectedRows: header.affectedRows ?? 0, insertId: header.insertId ?? 0 };
}
