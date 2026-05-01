import { readdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import { parseTaskFile } from "./parser";
import type { ProjectSnapshot, ParsedTask } from "../types";

interface CachedProject {
  aiPath: string;
  activePlan: string | null;
  tasks: Map<number, ParsedTask>;
  planPath: string | null;
  learningsPath: string | null;
}

const cache = new Map<number, CachedProject>();

function planDir(aiPath: string, slug: string): string {
  return join(aiPath, "plans", slug);
}

export function loadProject(projectId: number, aiPath: string, planFile?: string | null): void {
  const activePlan = planFile || discoverFirstPlan(aiPath);
  const tasks = new Map<number, ParsedTask>();

  let planPath: string | null = null;
  let learningsPath: string | null = null;

  if (activePlan) {
    const dir = planDir(aiPath, activePlan);
    const specPath = join(dir, "spec.md");
    if (existsSync(specPath)) planPath = specPath;

    const lPath = join(dir, "learnings.md");
    if (existsSync(lPath)) learningsPath = lPath;

    const tasksDir = join(dir, "tasks");
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
  }

  cache.set(projectId, {
    aiPath,
    activePlan,
    tasks,
    planPath,
    learningsPath,
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

export function getActivePlan(projectId: number): string | null {
  return cache.get(projectId)?.activePlan ?? null;
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

export function listPlanSlugs(aiPath: string): string[] {
  const plansDir = join(aiPath, "plans");
  if (!existsSync(plansDir)) return [];

  return readdirSync(plansDir)
    .filter((entry) => {
      const fullPath = join(plansDir, entry);
      return statSync(fullPath).isDirectory() && existsSync(join(fullPath, "spec.md"));
    })
    .sort();
}

function discoverFirstPlan(aiPath: string): string | null {
  const slugs = listPlanSlugs(aiPath);
  return slugs[0] ?? null;
}
