import { useEffect } from "react";
import type { Task } from "../../types";
import { STATUS_CONFIG } from "../../lib/status";

interface Props {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
}

const DETAIL_SECTIONS = [
  ["Goal", "goal"],
  ["Entry point", "entryPoint"],
  ["Product surface", "productSurface"],
  ["Completion state", "completionState"],
] as const;

function TaskFraming({ task }: { task: Task }) {
  const sections = task.descriptionSections;
  if (!sections) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-zinc-700/60 bg-surface-2/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_40px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.03]">
      <div className="border-b border-white/5 bg-zinc-800/20 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="py-0.5 text-xs uppercase tracking-[0.22em] text-zinc-500">
            Task framing
          </p>
          <span className="shrink-0 rounded border border-zinc-500/30 bg-zinc-700/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {sections.role}
          </span>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {DETAIL_SECTIONS.map(([label, key]) => (
          <div key={key} className="px-4 py-3.5">
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {label}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-200">
              {sections[key]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TaskDetail({ task, allTasks, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  const config = STATUS_CONFIG[task.status];
  const depTasks = task.dependencies
    .map((num) => allTasks.find((t) => t.number === num))
    .filter(Boolean) as Task[];

  const dependents = allTasks.filter((t) =>
    t.dependencies.includes(task.number)
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-surface-1 border-l border-border shadow-2xl overflow-y-auto scrollbar-thin animate-stagger-in">
        <div className="sticky top-0 bg-surface-1/95 backdrop-blur-sm border-b border-border z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-sm font-medium px-2 py-1 rounded"
                style={{
                  color: config.color,
                  backgroundColor: config.dimColor,
                }}
              >
                #{String(task.number).padStart(3, "0")}
              </span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full border"
                style={{
                  color: config.color,
                  borderColor: config.color + "40",
                  backgroundColor: config.dimColor + "40",
                }}
              >
                {config.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-surface-3"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-semibold text-zinc-100 mb-6 leading-tight">
            {task.title}
          </h2>

          {depTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Dependencies
              </h3>
              <div className="space-y-1.5">
                {depTasks.map((dep) => {
                  const depConfig = STATUS_CONFIG[dep.status];
                  return (
                    <div
                      key={dep.number}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: depConfig.color }}
                      />
                      <span className="font-mono text-xs text-zinc-500">
                        #{String(dep.number).padStart(3, "0")}
                      </span>
                      <span className="text-zinc-400 truncate">
                        {dep.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {dependents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Blocks
              </h3>
              <div className="space-y-1.5">
                {dependents.map((dep) => {
                  const depConfig = STATUS_CONFIG[dep.status];
                  return (
                    <div
                      key={dep.number}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: depConfig.color }}
                      />
                      <span className="font-mono text-xs text-zinc-500">
                        #{String(dep.number).padStart(3, "0")}
                      </span>
                      <span className="text-zinc-400 truncate">
                        {dep.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-5">
            <TaskFraming task={task} />
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: task.html }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
