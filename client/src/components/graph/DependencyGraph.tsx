import { useMemo, useState } from "react";
import type { Task } from "../../types";
import { STATUS_CONFIG } from "../../lib/status";
import { TaskDetail } from "../detail/TaskDetail";

interface Props {
  tasks: Task[];
}

interface LayoutNode {
  task: Task;
  x: number;
  y: number;
  col: number;
  row: number;
}

function layoutDAG(tasks: Task[]): LayoutNode[] {
  const taskMap = new Map(tasks.map((t) => [t.number, t]));
  const depths = new Map<number, number>();

  function getDepth(num: number): number {
    if (depths.has(num)) return depths.get(num)!;
    const task = taskMap.get(num);
    if (!task || task.dependencies.length === 0) {
      depths.set(num, 0);
      return 0;
    }
    const maxDep = Math.max(
      ...task.dependencies
        .filter((d) => taskMap.has(d))
        .map((d) => getDepth(d) + 1)
    );
    depths.set(num, maxDep);
    return maxDep;
  }

  for (const t of tasks) getDepth(t.number);

  const columns = new Map<number, Task[]>();
  for (const t of tasks) {
    const d = depths.get(t.number) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(t);
  }

  const nodeW = 200;
  const nodeH = 50;
  const gapX = 60;
  const gapY = 16;
  const nodes: LayoutNode[] = [];

  for (const [col, colTasks] of columns) {
    colTasks.sort((a, b) => a.number - b.number);
    for (let row = 0; row < colTasks.length; row++) {
      nodes.push({
        task: colTasks[row],
        x: col * (nodeW + gapX) + 40,
        y: row * (nodeH + gapY) + 40,
        col,
        row,
      });
    }
  }

  return nodes;
}

export function DependencyGraph({ tasks }: Props) {
  const [selected, setSelected] = useState<Task | null>(null);
  const [hoveredNum, setHoveredNum] = useState<number | null>(null);

  const tasksWithDeps = useMemo(
    () => tasks.filter((t) => t.dependencies.length > 0),
    [tasks]
  );

  const nodes = useMemo(() => layoutDAG(tasksWithDeps.length > 0 ? tasks : tasks), [tasks, tasksWithDeps]);
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.task.number, n])),
    [nodes]
  );

  const hoveredDeps = useMemo(() => {
    if (!hoveredNum) return new Set<number>();
    const task = tasks.find((t) => t.number === hoveredNum);
    if (!task) return new Set<number>();
    const deps = new Set<number>(task.dependencies);
    deps.add(hoveredNum);
    const dependents = tasks
      .filter((t) => t.dependencies.includes(hoveredNum))
      .map((t) => t.number);
    for (const d of dependents) deps.add(d);
    return deps;
  }, [hoveredNum, tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600">
        No tasks
      </div>
    );
  }

  const maxX = Math.max(...nodes.map((n) => n.x)) + 240;
  const maxY = Math.max(...nodes.map((n) => n.y)) + 80;

  const edges: { from: LayoutNode; to: LayoutNode }[] = [];
  for (const node of nodes) {
    for (const dep of node.task.dependencies) {
      const fromNode = nodeMap.get(dep);
      if (fromNode) edges.push({ from: fromNode, to: node });
    }
  }

  return (
    <>
      <div className="w-full h-full overflow-auto scrollbar-thin p-4">
        <svg width={maxX} height={maxY} className="min-w-full">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="4"
              refX="6"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 6 2, 0 4" fill="#3f3f46" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="6"
              markerHeight="4"
              refX="6"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 6 2, 0 4" fill="#60a5fa" />
            </marker>
          </defs>

          {edges.map((edge, i) => {
            const x1 = edge.from.x + 190;
            const y1 = edge.from.y + 22;
            const x2 = edge.to.x;
            const y2 = edge.to.y + 22;
            const midX = (x1 + x2) / 2;
            const isHighlighted =
              hoveredNum !== null &&
              hoveredDeps.has(edge.from.task.number) &&
              hoveredDeps.has(edge.to.task.number);

            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={isHighlighted ? "#60a5fa" : "#27272a"}
                strokeWidth={isHighlighted ? 1.5 : 1}
                markerEnd={`url(#arrowhead${isHighlighted ? "-active" : ""})`}
                className="transition-all duration-200"
              />
            );
          })}

          {nodes.map((node) => {
            const config = STATUS_CONFIG[node.task.status];
            const isActive =
              hoveredNum === null || hoveredDeps.has(node.task.number);

            return (
              <g
                key={node.task.number}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNum(node.task.number)}
                onMouseLeave={() => setHoveredNum(null)}
                onClick={() => setSelected(node.task)}
                opacity={isActive ? 1 : 0.2}
              >
                <rect
                  width="190"
                  height="44"
                  rx="6"
                  fill="#18181b"
                  stroke={
                    hoveredNum === node.task.number ? config.color : "#27272a"
                  }
                  strokeWidth={hoveredNum === node.task.number ? 1.5 : 1}
                />
                <rect
                  x="0"
                  y="6"
                  width="3"
                  height="32"
                  rx="1.5"
                  fill={config.color}
                />
                <text
                  x="14"
                  y="18"
                  fill={config.color}
                  fontSize="11"
                  fontFamily="Geist Mono, monospace"
                >
                  #{String(node.task.number).padStart(3, "0")}
                </text>
                <text
                  x="14"
                  y="34"
                  fill="#d4d4d8"
                  fontSize="11"
                  fontFamily="Geist, sans-serif"
                >
                  {node.task.title.length > 22
                    ? node.task.title.slice(0, 22) + "..."
                    : node.task.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected && (
        <TaskDetail
          task={selected}
          allTasks={tasks}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
