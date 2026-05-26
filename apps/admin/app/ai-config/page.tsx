"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TechnicalModeGate } from "@/components/TechnicalModeGate";
import {
  ReluAccessMode,
  ReluAgent,
  adminApi,
} from "@/lib/api";

type LoadState = "loading" | "ready" | "error";

type EditableConfig = {
  model: string;
  accessMode: ReluAccessMode;
  temperature: number;
  enabled: boolean;
  publicEnabled: boolean;
  maxContextItems: number;
  webhookUrl: string;
};

const ACCESS_MODE_LABELS: Record<ReluAccessMode, string> = {
  PUBLIC_LIMITED: "Public limited",
  AUTHENTICATED_USER: "Authenticated user",
  ADMIN_SECURED: "Admin secured",
};

export default function AiConfigPage() {
  return (
    <TechnicalModeGate>
      <AiConfigWorkspace />
    </TechnicalModeGate>
  );
}

function AiConfigWorkspace() {
  const [agents, setAgents] = useState<ReluAgent[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, EditableConfig>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await adminApi.getReluConfig();

        if (!active) {
          return;
        }

        setAgents(data);
        setDrafts(
          Object.fromEntries(
            data.map((agent) => [
              agent.id,
              {
                model: agent.model,
                accessMode: agent.accessMode,
                temperature: agent.temperature ?? 0.3,
                enabled: agent.enabled,
                publicEnabled: agent.publicEnabled,
                maxContextItems: agent.maxContextItems ?? 12,
                webhookUrl: agent.webhookUrl ?? "",
              },
            ]),
          ),
        );
        setState("ready");
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(error instanceof Error ? error.message : "Failed to load Relu AI config.");
        setState("error");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function saveAgent(agentId: string) {
    const draft = drafts[agentId];
    if (!draft) {
      return;
    }

    setSavingId(agentId);
    setMessage(null);

    try {
      const updated = await adminApi.updateReluConfig(agentId, {
        model: draft.model,
        accessMode: draft.accessMode,
        temperature: draft.temperature,
        enabled: draft.enabled,
        publicEnabled: draft.publicEnabled,
        maxContextItems: draft.maxContextItems,
        webhookUrl: draft.webhookUrl.trim() || null,
      });

      setAgents((current) =>
        current.map((agent) => (agent.id === agentId ? { ...agent, ...updated } : agent)),
      );
      setMessage(`Saved configuration for ${updated.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save agent configuration.");
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(agentId: string, patch: Partial<EditableConfig>) {
    setDrafts((current) => ({
      ...current,
      [agentId]: {
        ...current[agentId],
        ...patch,
      },
    }));
  }

  return (
    <main className="space-y-8 p-8 text-white">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Relu AI
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Operational Configuration</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Configure which Relu agents are enabled, which security mode they run in,
            and how much secured context they are allowed to consume from OpenStaff.
            Public mode stays generic by design. Authenticated and admin modes only use
            OpenStaff data loaded inside the API for the active task.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/ai-control"
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-500/50 hover:text-white"
          >
            Prompts and policies
          </Link>
          <Link
            href="/ai-queue"
            className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            View AI queue
          </Link>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm text-slate-200">
          {message}
        </div>
      ) : null}

      {state === "loading" ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
          Loading Relu AI configuration...
        </div>
      ) : null}

      {state === "error" ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          {message ?? "Failed to load Relu AI configuration."}
        </div>
      ) : null}

      {state === "ready" ? (
        <section className="grid gap-6 xl:grid-cols-2">
          {agents.map((agent) => {
            const draft = drafts[agent.id];

            return (
              <article
                key={agent.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {agent.type}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{agent.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {agent.description ?? "No description yet."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">
                      {ACCESS_MODE_LABELS[agent.accessMode]}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-semibold ${
                        agent.enabled
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {agent.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                {draft ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-300">Model</span>
                      <input
                        value={draft.model}
                        onChange={(event) =>
                          updateDraft(agent.id, { model: event.target.value })
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-300">Access mode</span>
                      <select
                        value={draft.accessMode}
                        onChange={(event) =>
                          updateDraft(agent.id, {
                            accessMode: event.target.value as ReluAccessMode,
                          })
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                      >
                        {Object.entries(ACCESS_MODE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-300">Temperature</span>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={draft.temperature}
                        onChange={(event) =>
                          updateDraft(agent.id, {
                            temperature: Number(event.target.value),
                          })
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-300">Max context items</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        step={1}
                        value={draft.maxContextItems}
                        onChange={(event) =>
                          updateDraft(agent.id, {
                            maxContextItems: Number(event.target.value),
                          })
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-slate-300">
                        Webhook URL
                      </span>
                      <input
                        value={draft.webhookUrl}
                        onChange={(event) =>
                          updateDraft(agent.id, { webhookUrl: event.target.value })
                        }
                        placeholder="Optional external operational webhook"
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </label>

                    <div className="flex flex-wrap gap-6 md:col-span-2">
                      <label className="flex items-center gap-3 text-sm text-slate-200">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(event) =>
                            updateDraft(agent.id, { enabled: event.target.checked })
                          }
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                        />
                        Agent enabled
                      </label>

                      <label className="flex items-center gap-3 text-sm text-slate-200">
                        <input
                          type="checkbox"
                          checked={draft.publicEnabled}
                          onChange={(event) =>
                            updateDraft(agent.id, {
                              publicEnabled: event.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                        />
                        Public entry allowed
                      </label>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Updated {new Date(agent.updatedAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => void saveAgent(agent.id)}
                    disabled={savingId === agent.id}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    {savingId === agent.id ? "Saving..." : "Save configuration"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}
