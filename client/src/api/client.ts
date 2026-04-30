import type { Project, Task, ProjectStats, DocumentContent } from "../types";

const BASE = "/api";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  projects: {
    list: () => fetchJSON<Project[]>("/projects"),
    create: (path: string, planFile?: string) =>
      fetchJSON<Project>("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, planFile }),
      }),
    listPlans: (path: string) =>
      fetchJSON<{ plans: string[] }>("/projects/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      }),
    remove: (id: number) =>
      fetchJSON<void>(`/projects/${id}`, { method: "DELETE" }),
    listPlansById: (id: number) =>
      fetchJSON<{ plans: string[] }>(`/projects/${id}/plans`),
    updatePlanFile: (id: number, planFile: string | null) =>
      fetchJSON<Project>(`/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planFile }),
      }),
  },
  tasks: {
    list: (projectId: number) =>
      fetchJSON<Task[]>(`/projects/${projectId}/tasks`),
    get: (projectId: number, number: number) =>
      fetchJSON<Task>(`/projects/${projectId}/tasks/${number}`),
  },
  stats: (projectId: number) =>
    fetchJSON<ProjectStats>(`/projects/${projectId}/stats`),
  plan: (projectId: number) =>
    fetchJSON<DocumentContent>(`/projects/${projectId}/plan`),
  learnings: (projectId: number) =>
    fetchJSON<DocumentContent>(`/projects/${projectId}/learnings`),
  browse: (path?: string) =>
    fetchJSON<BrowseResult>(
      `/browse${path ? `?path=${encodeURIComponent(path)}` : ""}`
    ),
};

export interface BrowseEntry {
  name: string;
  path: string;
  hasAi: boolean;
}

export interface BrowseResult {
  current: string;
  parent: string | null;
  currentHasAi: boolean;
  entries: BrowseEntry[];
}
