import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { existsSync } from "fs";
import { basename, join, resolve } from "path";
import { db } from "../db/connection";
import { projects } from "../db/schema";
import { loadProject, evictProject, listPlanFiles } from "../services/scanner";
import { watcherManager } from "../services/watcher";

const app = new Hono();

app.get("/", (c) => {
  const all = db.select().from(projects).all();
  return c.json(all);
});

app.post("/plans", async (c) => {
  const body = await c.req.json<{ path: string }>();
  const aiPath = join(resolve(body.path), ".ai");
  if (!existsSync(aiPath)) {
    return c.json({ error: ".ai/ directory not found" }, 400);
  }
  return c.json({ plans: listPlanFiles(aiPath) });
});

app.post("/", async (c) => {
  const body = await c.req.json<{ path: string; planFile?: string }>();
  const projectPath = resolve(body.path);

  const aiPath = join(projectPath, ".ai");
  if (!existsSync(aiPath)) {
    return c.json({ error: ".ai/ directory not found at the given path" }, 400);
  }

  const name = basename(projectPath);
  const now = new Date();
  const planFile = body.planFile || null;

  const [project] = db
    .insert(projects)
    .values({ name, path: projectPath, aiPath, planFile, createdAt: now, updatedAt: now })
    .returning()
    .all();

  loadProject(project.id, project.aiPath, project.planFile);
  watcherManager.watch(project.id, project.aiPath);

  return c.json(project, 201);
});

app.get("/:id/plans", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const [project] = db.select().from(projects).where(eq(projects.id, id)).all();
  if (!project) return c.json({ error: "Project not found" }, 404);
  return c.json({ plans: listPlanFiles(project.aiPath) });
});

app.patch("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const [project] = db.select().from(projects).where(eq(projects.id, id)).all();
  if (!project) return c.json({ error: "Project not found" }, 404);

  const body = await c.req.json<{ planFile: string | null }>();
  const planFile = body.planFile || null;

  db.update(projects)
    .set({ planFile, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .run();

  loadProject(id, project.aiPath, planFile);

  const [updated] = db.select().from(projects).where(eq(projects.id, id)).all();
  return c.json(updated);
});

app.delete("/:id", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  watcherManager.unwatch(id);
  evictProject(id);
  db.delete(projects).where(eq(projects.id, id)).run();
  return c.body(null, 204);
});

export default app;
