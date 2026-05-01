import chokidar from "chokidar";
import { basename, relative } from "path";
import { parseTaskFile } from "./parser";
import { updateTask, removeTask, getActivePlan } from "./scanner";
import type { SSEEvent } from "../types";

type Subscriber = (event: SSEEvent) => void;

interface ProjectWatcher {
  watcher: chokidar.FSWatcher;
  subscribers: Set<Subscriber>;
}

class WatcherManager {
  private watchers = new Map<number, ProjectWatcher>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  watch(projectId: number, aiPath: string) {
    if (this.watchers.has(projectId)) return;

    const subscribers = new Set<Subscriber>();
    const watcher = chokidar.watch(aiPath, {
      ignoreInitial: true,
      depth: 4,
    });

    const broadcast = (event: SSEEvent) => {
      for (const sub of subscribers) {
        try {
          sub(event);
        } catch {
          subscribers.delete(sub);
        }
      }
    };

    const debouncedBroadcast = (key: string, fn: () => void) => {
      const existing = this.debounceTimers.get(key);
      if (existing) clearTimeout(existing);
      this.debounceTimers.set(
        key,
        setTimeout(() => {
          this.debounceTimers.delete(key);
          fn();
        }, 300)
      );
    };

    const isActivePlanPath = (rel: string): boolean => {
      const activePlan = getActivePlan(projectId);
      if (!activePlan) return false;
      return rel.startsWith(`plans/${activePlan}/`);
    };

    const activeTasksPrefix = (): string | null => {
      const activePlan = getActivePlan(projectId);
      if (!activePlan) return null;
      return `plans/${activePlan}/tasks/`;
    };

    watcher.on("change", (filePath) => {
      const rel = relative(aiPath, filePath);
      const tasksPrefix = activeTasksPrefix();

      if (tasksPrefix && rel.startsWith(tasksPrefix) && rel.endsWith(".md")) {
        debouncedBroadcast(`change:${filePath}`, () => {
          try {
            const task = parseTaskFile(filePath);
            updateTask(projectId, task);
            broadcast({ type: "task:updated", data: task });
          } catch {
            // ignore parse errors on partial writes
          }
        });
      } else if (isActivePlanPath(rel) && rel.endsWith("learnings.md")) {
        debouncedBroadcast("learnings", () => {
          broadcast({ type: "learnings:updated", data: {} });
        });
      } else if (isActivePlanPath(rel) && rel.endsWith("spec.md")) {
        debouncedBroadcast("plan", () => {
          broadcast({ type: "plan:updated", data: {} });
        });
      }
    });

    watcher.on("add", (filePath) => {
      const rel = relative(aiPath, filePath);
      const tasksPrefix = activeTasksPrefix();

      if (tasksPrefix && rel.startsWith(tasksPrefix) && rel.endsWith(".md")) {
        debouncedBroadcast(`add:${filePath}`, () => {
          try {
            const task = parseTaskFile(filePath);
            updateTask(projectId, task);
            broadcast({ type: "task:added", data: task });
          } catch {
            // ignore
          }
        });
      }
    });

    watcher.on("unlink", (filePath) => {
      const rel = relative(aiPath, filePath);
      const tasksPrefix = activeTasksPrefix();

      if (tasksPrefix && rel.startsWith(tasksPrefix) && rel.endsWith(".md")) {
        const num = parseInt(basename(filePath, ".md"), 10);
        if (!isNaN(num)) {
          removeTask(projectId, num);
          broadcast({ type: "task:removed", data: { number: num } });
        }
      }
    });

    this.watchers.set(projectId, { watcher, subscribers });
  }

  unwatch(projectId: number) {
    const pw = this.watchers.get(projectId);
    if (pw) {
      pw.watcher.close();
      pw.subscribers.clear();
      this.watchers.delete(projectId);
    }
  }

  subscribe(projectId: number, callback: Subscriber): () => void {
    const pw = this.watchers.get(projectId);
    if (!pw) return () => {};
    pw.subscribers.add(callback);
    return () => pw.subscribers.delete(callback);
  }

  closeAll() {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    for (const [id] of this.watchers) {
      this.unwatch(id);
    }
  }
}

export const watcherManager = new WatcherManager();
