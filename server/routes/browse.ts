import { Hono } from "hono";
import { readdirSync, statSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { homedir } from "os";

const app = new Hono();

app.get("/", (c) => {
  const raw = c.req.query("path") || homedir();
  const dirPath = resolve(raw);

  if (!existsSync(dirPath)) {
    return c.json({ error: "Path does not exist" }, 400);
  }

  const stat = statSync(dirPath);
  if (!stat.isDirectory()) {
    return c.json({ error: "Path is not a directory" }, 400);
  }

  const entries: { name: string; path: string; hasAi: boolean }[] = [];

  try {
    const items = readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory()) continue;
      if (item.name.startsWith(".")) continue;
      if (item.name === "node_modules" || item.name === "vendor") continue;

      const fullPath = join(dirPath, item.name);
      const hasAi = existsSync(join(fullPath, ".ai"));
      entries.push({ name: item.name, path: fullPath, hasAi });
    }
  } catch {
    return c.json({ error: "Cannot read directory" }, 403);
  }

  entries.sort((a, b) => {
    if (a.hasAi !== b.hasAi) return a.hasAi ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const currentHasAi = existsSync(join(dirPath, ".ai"));

  return c.json({
    current: dirPath,
    parent: dirname(dirPath) !== dirPath ? dirname(dirPath) : null,
    currentHasAi,
    entries,
  });
});

export default app;
