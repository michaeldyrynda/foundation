export type TaskStatus = "pending" | "in_progress" | "complete" | "failed";

export interface Task {
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

export interface Project {
  id: number;
  name: string;
  path: string;
  aiPath: string;
  planFile: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  total: number;
  pending: number;
  inProgress: number;
  complete: number;
  failed: number;
}

export interface DocumentContent {
  content: string;
  html: string;
  soloProjectId?: number | null;
}
