import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { parseTaskFile } from "./parser";
import type { ProjectSnapshot, ParsedTask } from "../types";

interface CachedProject {
  aiPath: string;
  tasks: Map<number, ParsedTask>;
  planPath: string | null;
  learningsPath: string | null;
}

const cache = new Map<number, CachedProject>();

export function loadProject(projectId: number, aiPath: string): void {
  const tasksDir = join(aiPath, "tasks");
  const tasks = new Map<number, ParsedTask>();

  if (existsSync(tasksDir)) {
    const files = readdirSync(tasksDir)
      .filter((f) => f.endsWith(".md"))
      .sort();

    for (const file of files) {
      try {
        const task = parseTaskFile(join(tasksDir, file));
        tasks.set(task.number, task);
      } catch {
        // skip malformed files
      }
    }
  }

  cache.set(projectId, {
    aiPath,
    tasks,
    planPath: findPlanFile(aiPath),
    learningsPath: existsSync(join(aiPath, "learnings.md"))
      ? join(aiPath, "learnings.md")
      : null,
  });
}

export function getSnapshot(projectId: number): ProjectSnapshot | null {
  const cached = cache.get(projectId);
  if (!cached) return null;
  return {
    tasks: Array.from(cached.tasks.values()).sort(
      (a, b) => a.number - b.number
    ),
    planPath: cached.planPath,
    learningsPath: cached.learningsPath,
  };
}

export function updateTask(projectId: number, task: ParsedTask): void {
  const cached = cache.get(projectId);
  if (cached) cached.tasks.set(task.number, task);
}

export function removeTask(projectId: number, number: number): void {
  const cached = cache.get(projectId);
  if (cached) cached.tasks.delete(number);
}

export function evictProject(projectId: number): void {
  cache.delete(projectId);
}

function findPlanFile(aiPath: string): string | null {
  const plansDir = join(aiPath, "plans");
  if (existsSync(plansDir)) {
    const planFiles = readdirSync(plansDir).filter((f) => f.endsWith(".md"));
    if (planFiles.length >= 1) return join(plansDir, planFiles[0]);
  }

  const rootMds = readdirSync(aiPath).filter(
    (f) => f.endsWith(".md") && f !== "learnings.md"
  );
  if (rootMds.length === 1) return join(aiPath, rootMds[0]);

  return null;
}
