"use client";

import { useEffect, useState } from "react";
import { fetchApiJson } from "@/lib/api";

type Project = Record<string, unknown>;
type LoadState = "loading" | "success" | "unauthorized" | "error";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      setState("loading");
      setMessage(null);

      const result = await fetchApiJson<Project[]>("/projects");

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setProjects([]);
        setState(result.kind);
        setMessage(result.message);
        return;
      }

      setProjects(Array.isArray(result.data) ? result.data : []);
      setState("success");
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="p-6 text-white md:p-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-3 text-slate-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (state === "unauthorized") {
    return (
      <div className="p-6 text-white md:p-8">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h1 className="text-2xl font-semibold text-amber-200">
            Autentificare necesar\u0103
          </h1>
          <p className="mt-3 text-amber-100">
            {message ??
              "API-ul func\u021Bioneaz\u0103, dar lipse\u0219te tokenul JWT."}
          </p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="p-6 text-white md:p-8">
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-rose-200">Eroare API</h1>
          <p className="mt-3 text-rose-100">
            {message ?? "API-ul nu r\u0103spunde."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white md:p-8">
      <div className="rounded-3xl bg-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="mt-2 text-slate-400">
              API conectat. Rezultatele brute sunt afi\u0219ate pentru testare
              local\u0103.
            </p>
          </div>
          <div className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-300">
            {projects.length} rezultate
          </div>
        </div>

        {projects.length === 0 ? (
          <p className="mt-6 text-slate-400">
            API-ul a r\u0103spuns cu succes, dar nu exist\u0103 proiecte de
            afi\u0219at.
          </p>
        ) : (
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-200">
            {JSON.stringify(projects, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
