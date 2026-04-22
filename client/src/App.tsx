import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/layout/Sidebar";
import { Header, type ViewTab } from "./components/layout/Header";
import { KanbanBoard } from "./components/board/KanbanBoard";
import { DependencyGraph } from "./components/graph/DependencyGraph";
import { PlanViewer } from "./components/detail/PlanViewer";
import { LearningsViewer } from "./components/detail/LearningsViewer";
import { ProjectStats } from "./components/dashboard/ProjectStats";
import { useTasks, useSSE } from "./api/hooks";
import type { Project } from "./types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function ProjectView({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<ViewTab>("board");
  const { data: tasks = [] } = useTasks(project.id);

  useSSE(project.id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="flex-1 overflow-hidden">
        {activeTab === "board" && <KanbanBoard tasks={tasks} />}
        {activeTab === "graph" && <DependencyGraph tasks={tasks} />}
        {activeTab === "plan" && <PlanViewer projectId={project.id} />}
        {activeTab === "learnings" && (
          <LearningsViewer projectId={project.id} />
        )}
        {activeTab === "stats" && <ProjectStats projectId={project.id} />}
      </main>
    </div>
  );
}

function AppContent() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selectedId={selectedProject?.id ?? null}
        onSelect={setSelectedProject}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      {selectedProject ? (
        <ProjectView key={selectedProject.id} project={selectedProject} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-zinc-600"
              >
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <h2 className="text-lg font-mono font-medium text-zinc-400 mb-2">
              Foundation
            </h2>
            <p className="text-sm text-zinc-600 max-w-xs">
              Select a project from the sidebar or add a new one to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
