import { usePlan } from "../../api/hooks";

interface Props {
  projectId: number;
}

export function PlanViewer({ projectId }: Props) {
  const { data, isLoading, isError } = usePlan(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600">
        Loading plan...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mb-3 text-zinc-700"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p className="text-sm">No plan file found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="p-6 max-w-4xl mx-auto">
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      </div>
    </div>
  );
}
