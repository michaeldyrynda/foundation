import { useMemo, useCallback } from "react";
import type { Task, TaskStatus } from "../../types";
import { STATUS_CONFIG } from "../../lib/status";
import { TaskCard } from "./TaskCard";

interface Props {
  status: TaskStatus;
  tasks: Task[];
  allTasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function KanbanColumn({ status, tasks, allTasks, onTaskClick }: Props) {
  const config = STATUS_CONFIG[status];

  const completedSet = useMemo(() => {
    const set = new Set<number>();
    for (const t of allTasks) {
      if (t.status === "complete") set.add(t.number);
    }
    return set;
  }, [allTasks]);

  const isBlocked = useCallback(
    (task: Task) =>
      task.status === "pending" &&
      task.dependencies.length > 0 &&
      !task.dependencies.every((d) => completedSet.has(d)),
    [completedSet]
  );

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="px-3 pb-3 flex items-center gap-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <h3 className="text-sm font-medium text-zinc-300">{config.label}</h3>
        <span
          className="font-mono text-xs px-2 py-0.5 rounded-full"
          style={{
            color: config.color,
            backgroundColor: config.dimColor,
          }}
        >
          {tasks.length}
        </span>
      </div>
      <div
        className="border-t-2 rounded-t-sm"
        style={{ borderColor: config.color }}
      />
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2 max-h-[calc(100vh-160px)]">
        {tasks.map((task, i) => (
          <TaskCard
            key={task.number}
            task={task}
            isBlocked={isBlocked(task)}
            onClick={() => onTaskClick(task)}
            style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-sm text-zinc-700">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
