// Creates the database (if missing), applies db/schema.sql and loads db/seed.sql and db/seed-design.sql.
// Safe to re-run: tables use IF NOT EXISTS and content rows are upserted, so user progress is kept.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(root, file));
  } catch {
    // file not present — fine
  }
}

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill in your MySQL credentials.");
  process.exit(1);
}

const url = new URL(raw);
const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
if (!/^[A-Za-z0-9_]+$/.test(database)) {
  console.error(`DATABASE_URL must end with a database name made of letters, digits or underscores (got "${database}").`);
  process.exit(1);
}

// TLS for hosted databases, same rules as src/lib/db.ts: on unless the host is this machine; DATABASE_SSL=true/false overrides.
const sslSetting = process.env.DATABASE_SSL?.trim().toLowerCase();
const useSsl = sslSetting ? sslSetting === "true" : !["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");

const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  ssl: useSsl ? { minVersion: "TLSv1.2", rejectUnauthorized: true, ...(ca ? { ca } : {}) } : undefined,
  multipleStatements: true,
  charset: "utf8mb4",
}).catch((error) => {
  console.error(`Couldn't connect to ${url.hostname}: ${error.message}`);
  process.exit(1);
});
console.log(`Connected to ${url.hostname}${useSsl ? " over TLS" : ""}.`);

try {
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } catch (error) {
    // Hosted databases often come pre-created and the user may not be allowed to create one: just use it.
    if (!["ER_DBACCESS_DENIED_ERROR", "ER_ACCESS_DENIED_ERROR", "ER_SPECIFIC_ACCESS_DENIED_ERROR"].includes(error.code)) throw error;
  }
  await connection.query(`USE \`${database}\``);
  for (const file of ["db/schema.sql", "db/seed.sql", "db/seed-design.sql"]) {
    const sql = await readFile(path.join(root, file), "utf8");
    await connection.query(sql);
    console.log(`Applied ${file}`);
  }
  const [[counts]] = await connection.query(
    "SELECT (SELECT COUNT(*) FROM questions) AS questions, (SELECT COUNT(*) FROM notes) AS notes, (SELECT COUNT(*) FROM plan_days) AS days",
  );
  console.log(`Ready: ${counts.questions} questions, ${counts.notes} study notes, ${counts.days} plan days in "${database}".`);
} catch (error) {
  console.error("Database setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
