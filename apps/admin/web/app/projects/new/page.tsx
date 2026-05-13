"use client";

import { useAuth } from "../../../context/AuthContext";
import ProjectWorkspaceForm from "../../../components/projects/ProjectWorkspaceForm";

export default function NewProjectPage() {
  const { canCreateProjects, subscription } = useAuth();

  if (!canCreateProjects) {
    return (
      <main className="min-h-screen px-6 py-8 text-white">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-amber-300/20 bg-slate-950/80 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-amber-200/80">
            Subscription Gate
          </div>
          <h1 className="mt-4 text-3xl font-semibold">
            Your current plan does not include project ingestion.
          </h1>
          <p className="mt-4 text-slate-300">
            Active plan: {subscription?.planName ?? "No active plan"}.
            Upgrade to Bronze or above to create structured project workspaces,
            upload intake documents, and run AI-assisted matching.
          </p>
        </div>
      </main>
    );
  }

  return <ProjectWorkspaceForm mode="create" />;
}
