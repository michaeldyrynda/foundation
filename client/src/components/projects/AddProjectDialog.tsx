import { useState, useEffect } from "react";
import { useAddProject } from "../../api/hooks";
import { api, type BrowseEntry } from "../../api/client";

type Step = "path" | "browse" | "plan";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: (project: import("../../types").Project) => void;
}

export function AddProjectDialog({ open, onClose, onAdded }: Props) {
  const [step, setStep] = useState<Step>("path");
  const [path, setPath] = useState("");
  const [plans, setPlans] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);

  const [browseDir, setBrowseDir] = useState<string | undefined>(undefined);
  const [browseCurrent, setBrowseCurrent] = useState("");
  const [browseParent, setBrowseParent] = useState<string | null>(null);
  const [entries, setEntries] = useState<BrowseEntry[]>([]);
  const [browseCurrentHasAi, setBrowseCurrentHasAi] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);

  const addProject = useAddProject();

  useEffect(() => {
    if (!open) {
      setStep("path");
      setPath("");
      setPlans([]);
      setSelectedPlan(null);
      addProject.reset();
    }
  }, [open]);

  useEffect(() => {
    if (step !== "browse") return;
    setBrowseLoading(true);
    api.browse(browseDir).then((result) => {
      setBrowseCurrent(result.current);
      setBrowseParent(result.parent);
      setBrowseCurrentHasAi(result.currentHasAi);
      setEntries(result.entries);
      setBrowseLoading(false);
    });
  }, [step, browseDir]);

  if (!open) return null;

  const fetchPlansAndProceed = (projectPath: string) => {
    setPlansLoading(true);
    api.projects.listPlans(projectPath).then(({ plans }) => {
      setPlansLoading(false);
      if (plans.length > 1) {
        setPlans(plans);
        setSelectedPlan(plans[0]);
        setStep("plan");
      } else {
        submitProject(projectPath, plans.length === 1 ? plans[0] : undefined);
      }
    }).catch(() => {
      setPlansLoading(false);
      submitProject(projectPath);
    });
  };

  const submitProject = (projectPath: string, planFile?: string) => {
    addProject.mutate({ path: projectPath, planFile }, {
      onSuccess: (project) => {
        onAdded(project);
        onClose();
      },
    });
  };

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlansAndProceed(path.trim());
  };

  const handlePlanSubmit = () => {
    submitProject(path.trim(), selectedPlan ?? undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface-1 border border-border rounded-xl w-full max-w-xl shadow-2xl animate-stagger-in flex flex-col max-h-[80vh]">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold text-zinc-100 mb-1 font-mono">
            Add Project
          </h2>
          <p className="text-sm text-zinc-500 mb-5">
            {step === "plan"
              ? "Multiple plan documents found. Select the one to use."
              : <>
                  Pick a directory containing a{" "}
                  <code className="text-xs bg-surface-3 px-1.5 py-0.5 rounded font-mono text-amber-300">
                    .ai/
                  </code>{" "}
                  folder, or type the path directly.
                </>
            }
          </p>
        </div>

        {step === "plan" ? (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-6 pb-3">
              <div className="bg-surface-0 border border-border rounded-lg px-3 py-2 text-xs font-mono text-zinc-400 truncate">
                {path}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin border-t border-border">
              <div className="py-1">
                {plans.map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full flex items-center gap-3 px-6 py-2.5 text-left transition-colors group ${
                      selectedPlan === plan
                        ? "bg-surface-2"
                        : "hover:bg-surface-2"
                    }`}
                  >
                    <div className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan
                        ? "border-zinc-100"
                        : "border-zinc-600"
                    }`}>
                      {selectedPlan === plan && (
                        <div className="w-2 h-2 rounded-full bg-zinc-100" />
                      )}
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-zinc-500"
                    >
                      <path d="M4 2h5.172a2 2 0 011.414.586l2.828 2.828A2 2 0 0114 6.828V13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
                    </svg>
                    <span className={`text-sm font-mono flex-1 truncate ${
                      selectedPlan === plan
                        ? "text-zinc-100"
                        : "text-zinc-400 group-hover:text-zinc-200"
                    }`}>
                      {plan}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setStep("path"); setPlans([]); }}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-surface-3"
              >
                Back
              </button>
              <button
                onClick={handlePlanSubmit}
                disabled={!selectedPlan || addProject.isPending}
                className="px-4 py-2 text-sm bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {addProject.isPending ? "Adding..." : "Add Project"}
              </button>
            </div>
          </div>
        ) : step === "browse" ? (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-6 pb-3 flex items-center gap-2">
              {browseParent && (
                <button
                  onClick={() => setBrowseDir(browseParent)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-surface-3 rounded-lg transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 3L5 8l5 5" />
                  </svg>
                </button>
              )}
              <div className="flex-1 bg-surface-0 border border-border rounded-lg px-3 py-2 text-xs font-mono text-zinc-400 truncate">
                {browseCurrent}
              </div>
              <button
                onClick={() => setStep("path")}
                className="shrink-0 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors"
              >
                Cancel
              </button>
            </div>

            {browseCurrentHasAi && (
              <div className="px-6 pb-3">
                <button
                  onClick={() => {
                    setPath(browseCurrent);
                    setStep("path");
                    fetchPlansAndProceed(browseCurrent);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-status-complete-dim text-status-complete text-sm font-medium rounded-lg hover:bg-status-complete/20 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 4L6 11l-3-3" />
                  </svg>
                  Select this directory
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-thin border-t border-border">
              {browseLoading ? (
                <div className="p-6 text-center text-sm text-zinc-600">
                  Loading...
                </div>
              ) : entries.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-600">
                  No subdirectories
                </div>
              ) : (
                <div className="py-1">
                  {entries.map((entry) => (
                    <button
                      key={entry.path}
                      onClick={() => setBrowseDir(entry.path)}
                      className="w-full flex items-center gap-3 px-6 py-2.5 text-left hover:bg-surface-2 transition-colors group"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className={
                          entry.hasAi ? "text-status-complete" : "text-zinc-600"
                        }
                      >
                        <path
                          d="M2 4.5A1.5 1.5 0 013.5 3h3.172a1.5 1.5 0 011.06.44l.768.767a1.5 1.5 0 001.06.44H12.5A1.5 1.5 0 0114 6.146V11.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5v-7z"
                          fill="currentColor"
                        />
                      </svg>
                      <span
                        className={`text-sm flex-1 truncate ${
                          entry.hasAi
                            ? "text-zinc-100 font-medium"
                            : "text-zinc-400 group-hover:text-zinc-200"
                        }`}
                      >
                        {entry.name}
                      </span>
                      {entry.hasAi && (
                        <span className="shrink-0 text-xs font-mono px-1.5 py-0.5 rounded bg-status-complete-dim text-status-complete">
                          .ai
                        </span>
                      )}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-zinc-700 group-hover:text-zinc-500"
                      >
                        <path d="M5 3l4 4-4 4" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <form onSubmit={handlePathSubmit}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/Users/you/projects/my-project"
                  className="flex-1 bg-surface-0 border border-border rounded-lg px-4 py-3 text-sm text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setStep("browse")}
                  className="shrink-0 px-3 py-3 bg-surface-0 border border-border rounded-lg text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                  title="Browse directories"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 5a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828A2 2 0 0010.828 5H14a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                  </svg>
                </button>
              </div>
              {addProject.isError && (
                <p className="text-status-failed text-sm mt-2">
                  {addProject.error.message}
                </p>
              )}
              <div className="flex gap-3 mt-5 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-surface-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!path.trim() || addProject.isPending || plansLoading}
                  className="px-4 py-2 text-sm bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {plansLoading ? "Checking..." : addProject.isPending ? "Adding..." : "Add Project"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
