import { join } from "path";
import { readdirSync, readFileSync } from "fs";
import { sqlite } from "./connection";

const MIGRATIONS_DIR = join(import.meta.dir, "migrations");

export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  const applied = new Set(
    sqlite
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

    sqlite.transaction(() => {
      for (const stmt of statements) {
        sqlite.exec(stmt);
      }
      sqlite.exec(
        `INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('${file}', ${Date.now()})`
      );
    })();

    console.log(`Applied migration: ${file}`);
  }
}

if (import.meta.main) {
  runMigrations();
  console.log("Migrations complete.");
}
