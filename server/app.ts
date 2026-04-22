import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { existsSync } from "fs";
import { join } from "path";
import projectsRoute from "./routes/projects";
import tasksRoute from "./routes/tasks";
import documentsRoute from "./routes/documents";
import eventsRoute from "./routes/events";
import browseRoute from "./routes/browse";

export function createApp() {
  const app = new Hono();

  app.use("/api/*", cors());

  app.route("/api/projects", projectsRoute);
  app.route("/api/projects", tasksRoute);
  app.route("/api/projects", documentsRoute);
  app.route("/api/projects", eventsRoute);
  app.route("/api/browse", browseRoute);

  const distPath = join(import.meta.dir, "../client/dist");
  if (existsSync(distPath)) {
    app.use("/*", serveStatic({ root: "./client/dist" }));
    app.get("*", serveStatic({ path: "./client/dist/index.html" }));
  }

  return app;
}
