import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { existsSync } from "fs";
import { basename, join, resolve } from "path";
import { db } from "../db/connection";
import { projects } from "../db/schema";
import { loadProject, evictProject } from "../services/scanner";
import { watcherManager } from "../services/watcher";

const app = new Hono();

app.get("/", (c) => {
  const all = db.select().from(projects).all();
  return c.json(all);
});

app.post("/", async (c) => {
  const body = await c.req.json<{ path: string }>();
  const projectPath = resolve(body.path);

  let aiPath = join(projectPath, ".ai");
  if (!existsSync(aiPath)) {
    return c.json({ error: ".ai/ directory not found at the given path" }, 400);
  }

  const name = basename(projectPath);
  const now = new Date();

  const [project] = db
    .insert(projects)
    .values({ name, path: projectPath, aiPath, createdAt: now, updatedAt: now })
    .returning()
    .all();

  loadProject(project.id, project.aiPath);
  watcherManager.watch(project.id, project.aiPath);

  return c.json(project, 201);
});

app.delete("/:id", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  watcherManager.unwatch(id);
  evictProject(id);
  db.delete(projects).where(eq(projects.id, id)).run();
  return c.body(null, 204);
});

export default app;
