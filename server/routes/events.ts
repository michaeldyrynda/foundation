import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eq } from "drizzle-orm";
import { db } from "../db/connection";
import { projects } from "../db/schema";
import { getSnapshot } from "../services/scanner";
import { watcherManager } from "../services/watcher";

const app = new Hono();

app.get("/:id/events", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const [project] = db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .all();
  if (!project) return c.json({ error: "Project not found" }, 404);

  return streamSSE(c, async (stream) => {
    const snapshot = getSnapshot(id);
    if (snapshot) {
      await stream.writeSSE({
        event: "snapshot",
        data: JSON.stringify(snapshot),
      });
    }

    const unsubscribe = watcherManager.subscribe(id, (event) => {
      stream
        .writeSSE({
          event: event.type,
          data: JSON.stringify(event.data),
        })
        .catch(() => {});
    });

    const keepAlive = setInterval(() => {
      stream.writeSSE({ event: "ping", data: "" }).catch(() => {});
    }, 30_000);

    stream.onAbort(() => {
      unsubscribe();
      clearInterval(keepAlive);
    });

    await new Promise(() => {});
  });
});

export default app;
