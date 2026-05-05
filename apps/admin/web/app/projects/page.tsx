"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError, apiRequest } from "../../lib/api";
import {
  EngagementModel,
  ProjectListItem,
  ProjectStatus,
} from "../../lib/project-types";

const statusOptions: Array<ProjectStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
];

const engagementOptions: Array<EngagementModel | "ALL"> = [
  "ALL",
  "B2B",
  "B2C",
  "MIXED",
];

export default function ProjectsPage() {
  const router = useRouter();
  const { token, isReady, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [engagementFilter, setEngagementFilter] = useState<EngagementModel | "ALL">(
    "ALL",
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (statusFilter !== "ALL") {
      params.set("status", statusFilter);
    }

    if (engagementFilter !== "ALL") {
      params.set("engagementModel", engagementFilter);
    }

    const output = params.toString();
    return output ? `?${output}` : "";
  }, [engagementFilter, statusFilter]);

  const dashboardStats = useMemo(() => {
    return {
      activeProjects: projects.filter((project) => project.status === "ACTIVE").length,
      draftProjects: projects.filter((project) => project.status === "DRAFT").length,
      totalJobRequests: projects.reduce(
        (accumulator, project) => accumulator + project.counts.jobRequests,
        0,
      ),
      mixedProjects: projects.filter((project) => project.engagementModel === "MIXED")
        .length,
    };
  }, [projects]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const nextQuery = queryString ? `/projects${queryString}` : "/projects";
    window.history.replaceState({}, "", nextQuery);

    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiRequest<ProjectListItem[]>(`/projects${queryString}`, {
          token,
        });

        setProjects(data);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout();
          router.push("/login");
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load projects.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [isReady, logout, queryString, router, token]);

  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-cyan-300">
                Contractor Dashboard
              </div>
              <h1 className="mt-3 text-4xl font-semibold">
                Project intake and workforce command board
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Manage the contractor pipeline for B2B, B2C, and mixed-delivery
                work with structured project requests, job demand, clauses, AI
                interpretation, and match-ready records.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100 transition hover:border-cyan-400/30"
              >
                My profile
              </Link>
              <Link
                href="/projects/new"
                className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                New structured project
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3 font-semibold text-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Active Projects
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {dashboardStats.activeProjects}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Draft Projects
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {dashboardStats.draftProjects}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Workforce Requests
            </div>
            <div className="mt-3 text-3xl font-semibold">
              {dashboardStats.totalJobRequests}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-cyan-400/15 bg-cyan-400/8 p-5">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/80">
              Mixed Engagement
            </div>
            <div className="mt-3 text-3xl font-semibold text-cyan-100">
              {dashboardStats.mixedProjects}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">
              Status
            </span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ProjectStatus | "ALL")
              }
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All statuses" : option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">
              Engagement
            </span>
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none"
              value={engagementFilter}
              onChange={(event) =>
                setEngagementFilter(event.target.value as EngagementModel | "ALL")
              }
            >
              {engagementOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All models" : option}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Loaded Projects
            </div>
            <div className="mt-2 text-2xl font-semibold">{projects.length}</div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-4 text-sm text-slate-300">
            Matching is now profile-aware. Open a project to run the deterministic
            match engine against subcontractor and professional profiles.
          </div>
        </section>

        <section className="mt-6">
          {isLoading ? (
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 text-slate-300">
              Loading contractor projects...
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-8 text-rose-200">
              {error}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8">
              <h2 className="text-2xl font-semibold">No projects yet</h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                Start with a structured project request so your first workforce
                demand, clauses, taxonomy, AI interpretation, and match signals are
                captured from day one.
              </p>
              <Link
                href="/projects/new"
                className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
              >
                Create first project
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 transition hover:border-cyan-400/30 hover:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-200">
                      {project.engagementModel}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-300">
                      {project.status.replaceAll("_", " ")}
                    </span>
                    {project.aiInterpretation ? (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                        AI {project.aiInterpretation.status}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold transition group-hover:text-cyan-200">
                    {project.name}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {project.summary ||
                      "No summary yet. Open the project to refine workforce demand, clause structure, and match candidates."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Job Requests
                      </div>
                      <div className="mt-2 text-2xl font-semibold">
                        {project.counts.jobRequests}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Clauses
                      </div>
                      <div className="mt-2 text-2xl font-semibold">
                        {project.counts.conditions}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-slate-950/70 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Taxonomy
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-200">
                        {project.escoSkills.length +
                          project.naceCodes.length +
                          project.uniclassCodes.length}{" "}
                        tags
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.escoSkills.slice(0, 2).map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-white/8 px-3 py-1 text-xs text-slate-300"
                      >
                        ESCO {item.code}
                      </span>
                    ))}
                    {project.naceCodes.slice(0, 1).map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-white/8 px-3 py-1 text-xs text-slate-300"
                      >
                        NACE {item.code}
                      </span>
                    ))}
                    {project.uniclassCodes.slice(0, 1).map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-white/8 px-3 py-1 text-xs text-slate-300"
                      >
                        UNICLASS {item.code}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
                    <span>{project.location || "Location pending"}</span>
                    <span>{project.owner.email}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
