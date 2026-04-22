import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { projects } from "../db/schema";
import { getSnapshot } from "../services/scanner";
import type { ProjectStats } from "../types";

const app = new Hono();

app.get("/:id/tasks", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const [project] = db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .all();
  if (!project) return c.json({ error: "Project not found" }, 404);

  const snapshot = getSnapshot(id);
  if (!snapshot) return c.json({ error: "Project not loaded" }, 404);
  return c.json(snapshot.tasks);
});

app.get("/:id/tasks/:number", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const num = parseInt(c.req.param("number"), 10);
  const [project] = db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .all();
  if (!project) return c.json({ error: "Project not found" }, 404);

  const snapshot = getSnapshot(id);
  if (!snapshot) return c.json({ error: "Project not loaded" }, 404);
  const task = snapshot.tasks.find((t) => t.number === num);
  if (!task) return c.json({ error: "Task not found" }, 404);

  return c.json(task);
});

app.get("/:id/stats", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const [project] = db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .all();
  if (!project) return c.json({ error: "Project not found" }, 404);

  const snapshot = getSnapshot(id);
  if (!snapshot) return c.json({ error: "Project not loaded" }, 404);

  const stats: ProjectStats = {
    total: snapshot.tasks.length,
    pending: snapshot.tasks.filter((t) => t.status === "pending").length,
    inProgress: snapshot.tasks.filter((t) => t.status === "in_progress").length,
    complete: snapshot.tasks.filter((t) => t.status === "complete").length,
    failed: snapshot.tasks.filter((t) => t.status === "failed").length,
  };

  return c.json(stats);
});

export default app;
