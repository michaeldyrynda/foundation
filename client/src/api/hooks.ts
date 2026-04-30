import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "./client";
import type { Task } from "../types";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.list,
  });
}

export function useAddProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ path, planFile }: { path: string; planFile?: string }) =>
      api.projects.create(path, planFile),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useRemoveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.projects.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useProjectPlans(projectId: number | null) {
  return useQuery({
    queryKey: ["projectPlans", projectId],
    queryFn: () => api.projects.listPlansById(projectId!),
    enabled: projectId !== null,
  });
}

export function useUpdatePlanFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, planFile }: { id: number; planFile: string | null }) =>
      api.projects.updatePlanFile(id, planFile),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["plan", id] });
      qc.invalidateQueries({ queryKey: ["projectPlans", id] });
    },
  });
}

export function useTasks(projectId: number | null) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => api.tasks.list(projectId!),
    enabled: projectId !== null,
  });
}

export function useStats(projectId: number | null) {
  return useQuery({
    queryKey: ["stats", projectId],
    queryFn: () => api.stats(projectId!),
    enabled: projectId !== null,
  });
}

export function usePlan(projectId: number | null) {
  return useQuery({
    queryKey: ["plan", projectId],
    queryFn: () => api.plan(projectId!),
    enabled: projectId !== null,
    retry: 1,
  });
}

export function useLearnings(projectId: number | null) {
  return useQuery({
    queryKey: ["learnings", projectId],
    queryFn: () => api.learnings(projectId!),
    enabled: projectId !== null,
    retry: false,
  });
}

export function useSSE(projectId: number | null) {
  const qc = useQueryClient();
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  useEffect(() => {
    if (!projectId) return;

    let statsInvalidationTimer: ReturnType<typeof setTimeout> | null = null;

    function invalidateStatsDebounced() {
      if (statsInvalidationTimer) return;
      statsInvalidationTimer = setTimeout(() => {
        statsInvalidationTimer = null;
        qc.invalidateQueries({ queryKey: ["stats", projectIdRef.current] });
      }, 500);
    }

    function handleEvent(type: string, data: string) {
      const pid = projectIdRef.current;
      if (!pid) return;

      switch (type) {
        case "snapshot": {
          const snapshot = JSON.parse(data);
          qc.setQueryData(["tasks", pid], snapshot.tasks);
          break;
        }
        case "task:updated": {
          const task: Task = JSON.parse(data);
          qc.setQueryData(["tasks", pid], (old: Task[] | undefined) =>
            old
              ? old.map((t) => (t.number === task.number ? task : t))
              : [task]
          );
          invalidateStatsDebounced();
          break;
        }
        case "task:added": {
          const task: Task = JSON.parse(data);
          qc.setQueryData(["tasks", pid], (old: Task[] | undefined) =>
            old ? [...old, task] : [task]
          );
          invalidateStatsDebounced();
          break;
        }
        case "task:removed": {
          const { number } = JSON.parse(data);
          qc.setQueryData(["tasks", pid], (old: Task[] | undefined) =>
            old ? old.filter((t) => t.number !== number) : []
          );
          invalidateStatsDebounced();
          break;
        }
        case "learnings:updated":
          qc.invalidateQueries({ queryKey: ["learnings", pid] });
          break;
        case "plan:updated":
          qc.invalidateQueries({ queryKey: ["plan", pid] });
          break;
      }
    }

    const es = new EventSource(`/api/projects/${projectId}/events`);

    const events = [
      "snapshot",
      "task:updated",
      "task:added",
      "task:removed",
      "learnings:updated",
      "plan:updated",
    ];

    for (const event of events) {
      es.addEventListener(event, (e: MessageEvent) => {
        handleEvent(event, e.data);
      });
    }

    return () => {
      es.close();
      if (statsInvalidationTimer) clearTimeout(statsInvalidationTimer);
    };
  }, [projectId, qc]);
}
