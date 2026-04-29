import { useState } from "react";
import { useProjects, useRemoveProject } from "../../api/hooks";
import { AddProjectDialog } from "../projects/AddProjectDialog";
import type { Project } from "../../types";

interface Props {
  selectedId: number | null;
  onSelect: (project: Project) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ selectedId, onSelect, collapsed, onToggle }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: projects, isLoading } = useProjects();
  const removeProject = useRemoveProject();

  return (
    <>
      <aside
        className={`h-screen bg-surface-1 border-r border-border flex flex-col shrink-0 transition-[width] duration-200 ${
          collapsed ? "w-14" : "w-64"
        }`}
      >
        <div className="h-14 px-3 border-b border-border flex items-center justify-between shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-zinc-900"
                >
                  <path
                    d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v9a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12.5v-9zM5 5h6M5 8h4M5 11h5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-mono font-medium text-sm text-zinc-100 tracking-tight">
                Foundation
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-surface-2 rounded-lg transition-colors shrink-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
            >
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <>
            <div className="p-3 border-b border-border">
              <button
                onClick={() => setDialogOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-surface-2 rounded-lg transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M7 1v12M1 7h12" />
                </svg>
                Add project
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto scrollbar-thin p-2">
              {isLoading && (
                <div className="p-3 text-sm text-zinc-600">Loading...</div>
              )}
              {projects?.map((project) => (
                <div
                  key={project.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-0.5 ${
                    selectedId === project.id
                      ? "bg-surface-2 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-surface-2/50"
                  }`}
                  onClick={() => onSelect(project)}
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      selectedId === project.id
                        ? "bg-status-complete"
                        : "bg-surface-3"
                    }`}
                  />
                  <span className="text-sm font-medium truncate flex-1">
                    {project.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProject.mutate(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-status-failed transition-all p-0.5"
                    title="Remove project"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M2 2l8 8M10 2l-8 8" />
                    </svg>
                  </button>
                </div>
              ))}
              {projects && projects.length === 0 && (
                <div className="p-4 text-center text-sm text-zinc-600">
                  No projects yet.
                  <br />
                  Add one to get started.
                </div>
              )}
            </nav>
          </>
        )}
      </aside>

      <AddProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdded={(project) => onSelect(project)}
      />
    </>
  );
}
