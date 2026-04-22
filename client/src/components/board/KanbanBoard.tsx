import { useState, useMemo, useCallback } from "react";
import type { Task } from "../../types";
import { COLUMN_ORDER } from "../../lib/status";
import { KanbanColumn } from "./KanbanColumn";
import { TaskDetail } from "../detail/TaskDetail";

interface Props {
  tasks: Task[];
}

export function KanbanBoard({ tasks }: Props) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const selectedTask = useMemo(
    () => (selectedNumber !== null ? tasks.find((t) => t.number === selectedNumber) ?? null : null),
    [tasks, selectedNumber]
  );

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedNumber(task.number);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedNumber(null);
  }, []);

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        COLUMN_ORDER.map((status) => [
          status,
          tasks
            .filter((t) => t.status === status)
            .sort((a, b) => a.number - b.number),
        ])
      ),
    [tasks]
  );

  return (
    <>
      <div className="flex gap-4 h-full p-4 overflow-x-auto">
        {COLUMN_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={grouped[status] || []}
            allTasks={tasks}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          allTasks={tasks}
          onClose={handleClose}
        />
      )}
    </>
  );
}
