export type TaskStatus = "pending" | "in_progress" | "complete" | "failed";

export interface ParsedTask {
  number: number;
  status: TaskStatus;
  dependencies: number[];
  title: string;
  description: string;
  descriptionSections?: TaskDescriptionSections;
  html: string;
  filePath: string;
  soloTodoId: number | null;
  soloUrl: string | null;
}

export interface TaskDescriptionSections {
  role: string;
  goal: string;
  entryPoint: string;
  productSurface: string;
  completionState: string;
}

export interface ProjectSnapshot {
  tasks: ParsedTask[];
  planPath: string | null;
  learningsPath: string | null;
  soloProjectId: number | null;
}

export interface ProjectStats {
  total: number;
  pending: number;
  inProgress: number;
  complete: number;
  failed: number;
}

export type SSEEventType =
  | "task:updated"
  | "task:added"
  | "task:removed"
  | "learnings:updated"
  | "plan:updated"
  | "snapshot";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}
