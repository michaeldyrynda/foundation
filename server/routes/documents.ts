import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { projects } from "../db/schema";
import { getSnapshot } from "../services/scanner";
import { parseMarkdownFile } from "../services/parser";

const app = new Hono();

app.get("/:id/plan", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const [project] = db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .all();
  if (!project) return c.json({ error: "Project not found" }, 404);

  const snapshot = getSnapshot(id);
  if (!snapshot?.planPath) return c.json({ error: "No plan file found" }, 404);

  const doc = parseMarkdownFile(snapshot.planPath);
  return c.json(doc);
});

app.get("/:id/learnings", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const [project] = db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .all();
  if (!project) return c.json({ error: "Project not found" }, 404);

  const snapshot = getSnapshot(id);
  if (!snapshot?.learningsPath)
    return c.json({ error: "No learnings file found" }, 404);

  const doc = parseMarkdownFile(snapshot.learningsPath);
  return c.json(doc);
});

export default app;
