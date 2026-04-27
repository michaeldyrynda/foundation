import { Database } from "bun:sqlite";
import { join } from "path";
import { readdirSync, readFileSync } from "fs";

const DB_PATH = join(process.cwd(), "data/foundation.db");
const MIGRATIONS_DIR = join(import.meta.dir, "migrations");

const db = new Database(DB_PATH, { create: true });
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

const applied = new Set(
  db
    .query("SELECT hash FROM __drizzle_migrations")
    .all()
    .map((row: any) => row.hash)
);

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  db.transaction(() => {
    for (const stmt of statements) {
      db.exec(stmt);
    }
    db.exec(
      `INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('${file}', ${Date.now()})`
    );
  })();

  console.log(`Applied: ${file}`);
}

console.log("Migrations complete.");
db.close();
