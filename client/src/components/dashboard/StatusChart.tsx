import type { ProjectStats } from "../../types";
import { STATUS_CONFIG } from "../../lib/status";

interface Props {
  stats: ProjectStats;
}

export function StatusChart({ stats }: Props) {
  const segments = [
    { status: "complete" as const, value: stats.complete },
    { status: "in_progress" as const, value: stats.inProgress },
    { status: "pending" as const, value: stats.pending },
    { status: "failed" as const, value: stats.failed },
  ].filter((s) => s.value > 0);

  const total = stats.total || 1;
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-8">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {segments.map((segment) => {
          const pct = segment.value / total;
          const dashLength = pct * circumference;
          const currentOffset = offset;
          offset += dashLength;

          return (
            <circle
              key={segment.status}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={STATUS_CONFIG[segment.status].color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
              className="transition-all duration-500"
            />
          );
        })}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="fill-zinc-100 font-mono text-2xl font-medium"
        >
          {stats.total}
        </text>
        <text
          x="80"
          y="96"
          textAnchor="middle"
          className="fill-zinc-500 text-xs"
        >
          tasks
        </text>
      </svg>

      <div className="space-y-2.5">
        {segments.map((segment) => {
          const config = STATUS_CONFIG[segment.status];
          const pct = Math.round((segment.value / total) * 100);
          return (
            <div key={segment.status} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-sm text-zinc-400 w-20">
                {config.label}
              </span>
              <span className="font-mono text-sm text-zinc-200">
                {segment.value}
              </span>
              <span className="font-mono text-xs text-zinc-600">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
