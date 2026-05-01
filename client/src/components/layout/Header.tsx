import { useState, useRef, useEffect, useMemo } from "react";
import { useProjectPlans, useUpdatePlanFile } from "../../api/hooks";
import type { Project } from "../../types";

export type ViewTab = "board" | "graph" | "plan" | "learnings" | "stats";

interface Props {
  project: Project;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onProjectUpdated?: (project: Project) => void;
}

const TABS: { key: ViewTab; label: string }[] = [
  { key: "board", label: "Board" },
  { key: "stats", label: "Stats" },
  { key: "graph", label: "Graph" },
  { key: "plan", label: "Plan" },
  { key: "learnings", label: "Learnings" },
];

function PlanSwitcher({ project, onProjectUpdated }: { project: Project; onProjectUpdated?: (p: Project) => void }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const { data: plansData } = useProjectPlans(project.id);
  const updatePlanFile = useUpdatePlanFile();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFilter("");
      return;
    }

    requestAnimationFrame(() => filterRef.current?.focus());
  }, [open]);

  const plans = plansData?.plans ?? [];
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredPlans = useMemo(
    () =>
      normalizedFilter
        ? plans.filter((plan) => plan.toLowerCase().includes(normalizedFilter))
        : plans,
    [normalizedFilter, plans]
  );

  if (plans.length <= 1 && !project.planFile) return null;

  const slug = project.planFile ?? plans[0] ?? "plan";
  const label = slug.replace(/-/g, " ");
  const canSwitch = plans.length > 1;

  const handleSelect = (planFile: string) => {
    setOpen(false);
    if (planFile === project.planFile) return;
    updatePlanFile.mutate(
      { id: project.id, planFile },
      { onSuccess: (updated) => onProjectUpdated?.(updated) }
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => canSwitch && setOpen(!open)}
        className={`flex max-w-[42rem] items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-xs font-mono transition-colors ${
          canSwitch
            ? "text-zinc-400 hover:text-zinc-200 cursor-pointer"
            : "text-zinc-500 cursor-default"
        }`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M4 2h5.172a2 2 0 011.414.586l2.828 2.828A2 2 0 0114 6.828V13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
        </svg>
        <span className="min-w-0 truncate">{label}</span>
        {canSwitch && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M2.5 4L5 6.5 7.5 4" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(42rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface-1 shadow-xl">
          <div className="border-b border-border-subtle p-2">
            <input
              ref={filterRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter specs..."
              className="w-full rounded-md border border-border bg-surface-0 px-2.5 py-1.5 text-xs font-mono text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </div>
          <div className="max-h-[min(28rem,calc(100vh-9rem))] overflow-y-auto py-1 scrollbar-thin">
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => (
                <button
                  key={plan}
                  onClick={() => handleSelect(plan)}
                  title={plan}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-mono transition-colors ${
                    plan === project.planFile
                      ? "bg-surface-2 text-zinc-100"
                      : "text-zinc-400 hover:bg-surface-2/50 hover:text-zinc-200"
                  }`}
                >
                  {plan === project.planFile ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0"
                    >
                      <path d="M10 3L4.5 8.5 2 6" />
                    </svg>
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}
                  <span className="min-w-0 truncate">{plan.replace(/-/g, " ")}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-xs font-mono text-zinc-600">
                No matching specs
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Header({ project, activeTab, onTabChange, onProjectUpdated }: Props) {
  return (
    <header className="bg-surface-1 border-b border-border px-5 flex items-center justify-between h-14 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="font-mono font-medium text-base text-zinc-100">
          {project.name}
        </h1>
        <span className="text-xs text-zinc-600 font-mono hidden sm:inline">
          {project.path}
        </span>
        <PlanSwitcher project={project} onProjectUpdated={onProjectUpdated} />
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
