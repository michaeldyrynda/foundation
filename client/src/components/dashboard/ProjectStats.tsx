import { useStats } from "../../api/hooks";
import { STATUS_CONFIG } from "../../lib/status";
import { StatusChart } from "./StatusChart";

interface Props {
  projectId: number;
}

export function ProjectStats({ projectId }: Props) {
  const { data: stats, isLoading } = useStats(projectId);

  if (isLoading || !stats)
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600">
        Loading stats...
      </div>
    );

  const completionPct =
    stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

  const statItems = [
    { key: "pending" as const, value: stats.pending },
    { key: "in_progress" as const, value: stats.inProgress },
    { key: "complete" as const, value: stats.complete },
    { key: "failed" as const, value: stats.failed },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map(({ key, value }) => {
          const config = STATUS_CONFIG[key];
          return (
            <div
              key={key}
              className="bg-surface-1 border border-border-subtle rounded-xl p-5 animate-stagger-in"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {config.label}
                </span>
              </div>
              <div
                className="font-mono text-4xl font-medium"
                style={{ color: config.color }}
              >
                {value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Completion
          </h3>
          <div className="flex items-end gap-4">
            <span className="font-mono text-5xl font-medium text-zinc-100">
              {completionPct}%
            </span>
            <span className="text-sm text-zinc-500 mb-2">
              {stats.complete} of {stats.total} tasks
            </span>
          </div>
          <div className="mt-4 h-2 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-status-complete rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <div className="bg-surface-1 border border-border-subtle rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Distribution
          </h3>
          <StatusChart stats={stats} />
        </div>
      </div>
    </div>
  );
}
