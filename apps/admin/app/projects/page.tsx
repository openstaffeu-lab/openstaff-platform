"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchApiJson } from "@/lib/api";

type ProjectRecord = {
  id?: string;
  title?: string | null;
  name?: string | null;
  clientName?: string | null;
  companyName?: string | null;
  ownerName?: string | null;
  status?: string | null;
  moderationStatus?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  domain?: string | null;
  category?: string | null;
  summary?: string | null;
  description?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currencyCode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type LoadState = "loading" | "success" | "unauthorized" | "error";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  async function loadProjects() {
    setState("loading");
    setMessage(null);

    const result = await fetchApiJson<ProjectRecord[]>("/projects");

    if (!result.ok) {
      setProjects([]);
      setState(result.kind);
      setMessage(result.message);
      return;
    }

    setProjects(Array.isArray(result.data) ? result.data : []);
    setState("success");
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialProjects() {
      const result = await fetchApiJson<ProjectRecord[]>("/projects");

      if (!mounted) {
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

    void loadInitialProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(
    () => ({
      total: projects.length,
      live: projects.filter((project) => normalizeStatus(project.status) === "LIVE").length,
      pending: projects.filter(
        (project) =>
          normalizeStatus(project.status).includes("PENDING") ||
          normalizeStatus(project.moderationStatus).includes("PENDING"),
      ).length,
    }),
    [projects],
  );

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Marketplace operations
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Projects</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Review project portfolio health, public readiness, ownership, and moderation state
              without exposing implementation payloads.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Projects" value={metrics.total} />
            <MetricCard label="Live" value={metrics.live} tone="success" />
            <MetricCard label="Pending" value={metrics.pending} tone="warning" />
          </div>
        </div>

        {message ? (
          <InlineNotice
            tone={state === "unauthorized" ? "warning" : "danger"}
            message={humanizeError(message)}
            actionLabel="Retry"
            onAction={() => void loadProjects()}
          />
        ) : null}

        {state === "loading" ? (
          <InlineNotice tone="neutral" message="Loading project portfolio..." />
        ) : null}

        {state === "success" && projects.length === 0 ? (
          <EmptyState
            title="No projects are ready for review"
            description="Once companies publish projects, they will appear here with moderation state, owner context, and commercial summary."
          />
        ) : null}

        {state === "success" && projects.length > 0 ? (
          <div className="mt-8 grid gap-5">
            {projects.map((project, index) => (
              <article
                key={project.id ?? `${project.title ?? "project"}-${index}`}
                className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge label={project.status ?? "Review"} tone={statusTone(project.status)} />
                      <Badge
                        label={project.moderationStatus ?? "Moderation pending"}
                        tone={statusTone(project.moderationStatus)}
                      />
                      <Badge label={project.category ?? project.domain ?? "General"} tone="info" />
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold text-cyan-100">
                      {project.title ?? project.name ?? "Untitled project"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {project.companyName ??
                        project.clientName ??
                        project.ownerName ??
                        "Owner to be confirmed"}
                    </p>

                    <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300">
                      {project.summary ??
                        project.description ??
                        "No public summary has been added yet. Ask the owner to complete the project brief before approval."}
                    </p>
                  </div>

                  <div className="grid w-full gap-3 text-sm text-slate-300 sm:grid-cols-3 lg:w-96 lg:grid-cols-1">
                    <InfoTile label="Location" value={formatLocation(project)} />
                    <InfoTile label="Budget" value={formatBudget(project)} />
                    <InfoTile label="Updated" value={formatDate(project.updatedAt ?? project.createdAt)} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-200"
      : tone === "warning"
        ? "text-amber-200"
        : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "info" | "success" | "warning" | "danger" }) {
  const styles =
    tone === "success"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
      : tone === "warning"
        ? "border-amber-400/25 bg-amber-400/10 text-amber-200"
        : tone === "danger"
          ? "border-rose-400/25 bg-rose-400/10 text-rose-200"
          : "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
      {formatLabel(label)}
    </span>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-slate-100">{value}</div>
    </div>
  );
}

function InlineNotice({
  actionLabel,
  message,
  onAction,
  tone,
}: {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  tone: "neutral" | "warning" | "danger";
}) {
  const styles =
    tone === "warning"
      ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
      : tone === "danger"
        ? "border-rose-400/25 bg-rose-400/10 text-rose-100"
        : "border-slate-800 bg-slate-950/70 text-slate-300";

  return (
    <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      <span>{message}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-8">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}

function normalizeStatus(value?: string | null) {
  return (value ?? "").trim().toUpperCase();
}

function statusTone(value?: string | null): "info" | "success" | "warning" | "danger" {
  const normalized = normalizeStatus(value);

  if (["LIVE", "ACTIVE", "APPROVED", "PUBLISHED", "COMPLETED"].includes(normalized)) {
    return "success";
  }

  if (["REJECTED", "FAILED", "OFFLINE", "CLOSED"].includes(normalized)) {
    return "danger";
  }

  if (["PENDING", "PENDING_MODERATION", "FLAGGED", "DRAFT"].includes(normalized)) {
    return "warning";
  }

  return "info";
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatLocation(project: ProjectRecord) {
  return [project.location, project.city, project.country].filter(Boolean).join(", ") || "Not set";
}

function formatBudget(project: ProjectRecord) {
  const values = [project.budgetMin, project.budgetMax].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (!values.length) {
    return "To be confirmed";
  }

  return `${project.currencyCode ?? "EUR"} ${values
    .map((value) => value.toLocaleString("ro-RO"))
    .join(" - ")}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function humanizeError(message: string) {
  if (/internal server error/i.test(message)) {
    return "Project data is temporarily unavailable. Navigation remains available while you retry.";
  }

  if (/network|cors|unavailable/i.test(message)) {
    return "Project data could not be reached. Check the connection and retry.";
  }

  return message;
}
