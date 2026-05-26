"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { loginPathForCurrentLocation } from "@/lib/auth-redirect";
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

function deriveSmartMatch(project: ProjectListItem, isLoggedIn: boolean) {
  const taxonomyCount =
    project.escoSkills.length + project.naceCodes.length + project.uniclassCodes.length;
  const hasBudget = project.budgetMinCents !== null || project.budgetMaxCents !== null;
  const hasAi = Boolean(project.aiInterpretation);
  const base = isLoggedIn ? 54 : 38;
  const score = Math.min(
    96,
    base +
      Math.min(24, taxonomyCount * 5) +
      (hasBudget ? 8 : 0) +
      (project.location ? 6 : 0) +
      (hasAi ? 8 : 0),
  );

  return {
    score,
    label:
      score >= 86
        ? "Strong Fit"
        : score >= 70
          ? "Good Fit"
          : "Requires Additional Certifications",
    confidence: hasAi ? "Contextual AI confidence: high" : "Contextual AI confidence: draft",
  };
}

function deriveFlashPrediction(project: ProjectListItem) {
  const budget =
    project.budgetMinCents !== null || project.budgetMaxCents !== null
      ? `${project.currencyCode ?? "EUR"} ${Math.round(
          (project.budgetMinCents ?? project.budgetMaxCents ?? 0) / 100,
        ).toLocaleString()}+`
      : "Budget pending";

  return {
    duration: project.startDate && project.endDate ? "Scheduled window available" : "2-8 weeks estimated",
    budget,
    objective: project.summary?.split(".")[0] || "Clarify delivery scope and workforce demand",
    risk: project.status === "DRAFT" || !project.aiInterpretation ? "Medium" : "Low",
    certifications:
      project.escoSkills.length > 0
        ? project.escoSkills.slice(0, 2).map((item) => item.code).join(", ")
        : "Manual certification check",
  };
}

function mapConversationalSearch(value: string) {
  const normalized = value.toLowerCase();

  return {
    geography:
      ["bacau", "bucuresti", "cluj", "brasov", "iasi"].find((city) =>
        normalized.includes(city),
      ) ?? "Any region",
    taxonomy: normalized.includes("industrial")
      ? "Industrial"
      : normalized.includes("construct")
        ? "Construction"
        : normalized.includes("horeca") || normalized.includes("hotel")
          ? "Tourism/HORECA"
          : "Open taxonomy",
    certifications: normalized.includes("iscir")
      ? "ISCIR"
      : normalized.includes("safety")
        ? "Safety"
        : "No explicit certification",
    projectType: normalized.includes("subcontract")
      ? "Subcontractor package"
      : normalized.includes("project")
        ? "Project delivery"
        : "Any project type",
    budget: normalized.match(/(\d+[\d.]*)\s*(eur|euro)/)?.[0] ?? "Any budget",
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { token, isReady, logout, canCreateProjects, subscription } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSearch, setAiSearch] = useState("");
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

  const aiSearchMapping = useMemo(
    () => mapConversationalSearch(aiSearch),
    [aiSearch],
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push(loginPathForCurrentLocation());
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
          router.push(loginPathForCurrentLocation());
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
              {canCreateProjects ? (
                <Link
                  href="/projects/new"
                  className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  New structured project
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-100/70"
                  title="Project ingestion is available from Bronze and above."
                >
                  Upgrade required for project intake
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  router.push(loginPathForCurrentLocation());
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

        <section className="mt-6 rounded-[2rem] border border-cyan-400/15 bg-slate-900/75 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <label className="block flex-1">
              <span className="mb-2 block text-xs uppercase tracking-[0.28em] text-cyan-200">
                RELU conversational search
              </span>
              <input
                className="w-full rounded-2xl border border-cyan-300/20 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-300"
                value={aiSearch}
                onChange={(event) => setAiSearch(event.target.value)}
                placeholder="Caut proiecte industriale in Bacau peste 20.000 EUR pentru subcontractori ISCIR."
              />
            </label>
            <div className="grid gap-2 rounded-2xl border border-white/8 bg-slate-950/70 p-4 text-xs text-slate-300 sm:grid-cols-2 lg:min-w-[520px]">
              <span>Geography: {aiSearchMapping.geography}</span>
              <span>Taxonomy: {aiSearchMapping.taxonomy}</span>
              <span>Certifications: {aiSearchMapping.certifications}</span>
              <span>Project type: {aiSearchMapping.projectType}</span>
              <span className="sm:col-span-2">Budget: {aiSearchMapping.budget}</span>
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

        {!canCreateProjects ? (
          <section className="mt-6 rounded-[1.75rem] border border-amber-300/20 bg-amber-400/10 p-5 text-amber-100">
            <div className="text-xs uppercase tracking-[0.3em] text-amber-100/80">
              Plan Gate
            </div>
            <h2 className="mt-2 text-xl font-semibold">
              Structured project intake is not enabled on your current plan.
            </h2>
            <p className="mt-2 text-sm text-amber-50/90">
              Current plan: {subscription?.planName ?? "No active plan"}.
              Upgrade to Bronze or above to create project workspaces with AI-assisted
              ingestion.
            </p>
          </section>
        ) : null}

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
              {canCreateProjects ? (
                <Link
                  href="/projects/new"
                  className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950"
                >
                  Create first project
                </Link>
              ) : (
                <div className="mt-6 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-100/70">
                  Project creation available from Bronze plan
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {projects.map((project) => {
                const smartMatch = deriveSmartMatch(project, Boolean(token));
                const prediction = deriveFlashPrediction(project);

                return (
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
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                      {smartMatch.score}% Match
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold transition group-hover:text-cyan-200">
                    {project.name}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {project.summary ||
                      "No summary yet. Open the project to refine workforce demand, clause structure, and match candidates."}
                  </p>

                  <div className="mt-5 grid gap-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/8 p-4 text-sm text-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-cyan-100">{smartMatch.label}</span>
                      <span className="text-xs text-cyan-100/80">{smartMatch.confidence}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <span>Duration: {prediction.duration}</span>
                      <span>Budget: {prediction.budget}</span>
                      <span>Risk: {prediction.risk}</span>
                      <span>Certifications: {prediction.certifications}</span>
                    </div>
                    <p className="text-xs leading-6 text-slate-300">
                      Objective: {prediction.objective}
                    </p>
                  </div>

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
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
