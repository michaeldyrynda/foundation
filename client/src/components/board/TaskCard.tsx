import { memo } from "react";
import type { Task } from "../../types";
import { STATUS_CONFIG } from "../../lib/status";

interface Props {
  task: Task;
  isBlocked: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const TaskCard = memo(function TaskCard({
  task,
  isBlocked,
  onClick,
  style,
}: Props) {
  const config = STATUS_CONFIG[task.status];

  return (
    <div
      onClick={onClick}
      style={style}
      className={`group relative bg-surface-1 border border-border-subtle rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 hover:border-surface-3 ${
        isBlocked ? "opacity-50" : ""
      } ${task.status === "in_progress" ? "animate-pulse-glow" : ""}`}
    >
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <div className="pl-4 pr-3 py-3">
        <div className="flex items-start gap-2">
          <span
            className="shrink-0 font-mono text-xs font-medium px-1.5 py-0.5 rounded"
            style={{
              color: config.color,
              backgroundColor: config.dimColor,
            }}
          >
            #{String(task.number).padStart(3, "0")}
          </span>
          {isBlocked && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="shrink-0 mt-0.5 text-zinc-500"
            >
              <rect
                x="3"
                y="6"
                width="8"
                height="6"
                rx="1"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M5 6V4.5a2 2 0 014 0V6"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        <p className="text-sm text-zinc-200 mt-1.5 leading-snug line-clamp-2">
          {task.title}
        </p>
        {task.dependencies.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-zinc-600"
            >
              <path
                d="M2 6h3l2-3 2 6 2-3h1"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xs text-zinc-600 font-mono">
              {task.dependencies.length} dep
              {task.dependencies.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
