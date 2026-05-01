import { useLearnings } from "../../api/hooks";
import { MarkdownDocumentView } from "./MarkdownDocumentView";

interface Props {
  projectId: number;
}

export function LearningsViewer({ projectId }: Props) {
  const { data, isLoading, isError } = useLearnings(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600">
        Loading learnings...
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
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
        <p className="text-sm">No learnings recorded yet</p>
      </div>
    );
  }

  return <MarkdownDocumentView html={data.html} />;
}
