import { createApp } from "./app";
import { db } from "./db/connection";
import { projects } from "./db/schema";
import { loadProject } from "./services/scanner";
import { watcherManager } from "./services/watcher";

const app = createApp();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

const allProjects = db.select().from(projects).all();
for (const project of allProjects) {
  loadProject(project.id, project.aiPath);
  watcherManager.watch(project.id, project.aiPath);
  console.log(`Watching: ${project.name} (${project.aiPath})`);
}

console.log(`Foundation server running on http://localhost:${PORT}`);

const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
  idleTimeout: 255,
});

process.on("SIGINT", () => {
  watcherManager.closeAll();
  server.stop();
  process.exit(0);
});
