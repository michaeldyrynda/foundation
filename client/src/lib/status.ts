import type { TaskStatus } from "../types";

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; dimColor: string; bgClass: string; textClass: string; borderClass: string }
> = {
  pending: {
    label: "Pending",
    color: "var(--color-status-pending)",
    dimColor: "var(--color-status-pending-dim)",
    bgClass: "bg-status-pending",
    textClass: "text-status-pending",
    borderClass: "border-status-pending",
  },
  in_progress: {
    label: "In Progress",
    color: "var(--color-status-in-progress)",
    dimColor: "var(--color-status-in-progress-dim)",
    bgClass: "bg-status-in-progress",
    textClass: "text-status-in-progress",
    borderClass: "border-status-in-progress",
  },
  complete: {
    label: "Complete",
    color: "var(--color-status-complete)",
    dimColor: "var(--color-status-complete-dim)",
    bgClass: "bg-status-complete",
    textClass: "text-status-complete",
    borderClass: "border-status-complete",
  },
  failed: {
    label: "Failed",
    color: "var(--color-status-failed)",
    dimColor: "var(--color-status-failed-dim)",
    bgClass: "bg-status-failed",
    textClass: "text-status-failed",
    borderClass: "border-status-failed",
  },
};

export const COLUMN_ORDER: TaskStatus[] = [
  "pending",
  "in_progress",
  "complete",
  "failed",
];
