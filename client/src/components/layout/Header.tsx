import type { Project } from "../../types";

export type ViewTab = "board" | "graph" | "plan" | "learnings" | "stats";

interface Props {
  project: Project;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

const TABS: { key: ViewTab; label: string }[] = [
  { key: "board", label: "Board" },
  { key: "stats", label: "Stats" },
  { key: "graph", label: "Graph" },
  { key: "plan", label: "Plan" },
  { key: "learnings", label: "Learnings" },
];

export function Header({ project, activeTab, onTabChange }: Props) {
  return (
    <header className="bg-surface-1 border-b border-border px-5 flex items-center justify-between h-14 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="font-mono font-medium text-base text-zinc-100">
          {project.name}
        </h1>
        <span className="text-xs text-zinc-600 font-mono hidden sm:inline">
          {project.path}
        </span>
      </div>

      <nav className="flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-surface-2 text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-surface-2/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
