"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TechnicalModeGate } from "@/components/TechnicalModeGate";
import { ReluAgent, adminApi } from "@/lib/api";

type LoadState = "loading" | "ready" | "error";

type PromptDraft = {
  description: string;
  systemPrompt: string;
  policyJson: string;
};

export default function AIControlPage() {
  return (
    <TechnicalModeGate>
      <AIControlWorkspace />
    </TechnicalModeGate>
  );
}

function AIControlWorkspace() {
  const [agents, setAgents] = useState<ReluAgent[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, PromptDraft>>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await adminApi.getReluPromptsPolicies();

        if (!active) {
          return;
        }

        setAgents(data);
        setDrafts(
          Object.fromEntries(
            data.map((agent) => [
              agent.id,
              {
                description: agent.description ?? "",
                systemPrompt: agent.systemPrompt ?? "",
                policyJson: JSON.stringify(agent.policyJson ?? {}, null, 2),
              },
            ]),
          ),
        );
        setState("ready");
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(error instanceof Error ? error.message : "Failed to load prompts.");
        setState("error");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredAgents = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return agents;
    }

    return agents.filter((agent) => {
      const haystack = [
        agent.name,
        agent.type,
        agent.accessMode,
        agent.description ?? "",
        agent.systemPrompt ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [agents, query]);

  async function save(agentId: string) {
    const draft = drafts[agentId];
    if (!draft) {
      return;
    }

    setSavingId(agentId);
    setMessage(null);

    try {
      const parsedPolicy = JSON.parse(draft.policyJson) as Record<string, unknown>;
      const updated = await adminApi.updateReluPromptPolicy(agentId, {
        description: draft.description.trim() || null,
        systemPrompt: draft.systemPrompt,
        policyJson: parsedPolicy,
      });

      setAgents((current) =>
        current.map((agent) => (agent.id === agentId ? { ...agent, ...updated } : agent)),
      );
      setMessage(`Saved prompt and policy for ${updated.name}.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save prompt or policy JSON.",
      );
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(agentId: string, patch: Partial<PromptDraft>) {
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
          <h1 className="mt-2 text-3xl font-semibold text-white">Prompts and Policies</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            These prompts define how Relu behaves in public, authenticated, and
            admin-secured modes. Policies should reflect the rule that Relu learns
            only from OpenStaff secured data loaded server-side for the active task,
            and public visitors never receive sensitive user or contract information.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/ai-config"
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-500/50 hover:text-white"
          >
            Agent config
          </Link>
          <Link
            href="/ai-queue"
            className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            AI queue
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-300">
            Search agents, prompts, or policy keywords
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="public, eligibility, policy, notifications..."
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
          />
        </label>
      </section>

      {message ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm text-slate-200">
          {message}
        </div>
      ) : null}

      {state === "loading" ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
          Loading prompt library...
        </div>
      ) : null}

      {state === "error" ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          {message ?? "Failed to load Relu prompt library."}
        </div>
      ) : null}

      {state === "ready" ? (
        <section className="space-y-6">
          {filteredAgents.map((agent) => {
            const draft = drafts[agent.id];

            return (
              <article
                key={agent.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {agent.type} • {agent.accessMode}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{agent.name}</h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      agent.publicEnabled
                        ? "bg-cyan-500/20 text-cyan-200"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {agent.publicEnabled ? "Public entry enabled" : "Secured only"}
                  </span>
                </div>

                {draft ? (
                  <div className="mt-6 grid gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-300">Description</span>
                      <input
                        value={draft.description}
                        onChange={(event) =>
                          updateDraft(agent.id, { description: event.target.value })
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-300">System prompt</span>
                      <textarea
                        value={draft.systemPrompt}
                        onChange={(event) =>
                          updateDraft(agent.id, { systemPrompt: event.target.value })
                        }
                        rows={8}
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-slate-300">
                        Policy JSON
                      </span>
                      <textarea
                        value={draft.policyJson}
                        onChange={(event) =>
                          updateDraft(agent.id, { policyJson: event.target.value })
                        }
                        rows={10}
                        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-500"
                      />
                    </label>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Updated {new Date(agent.updatedAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => void save(agent.id)}
                    disabled={savingId === agent.id}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                  >
                    {savingId === agent.id ? "Saving..." : "Save prompt and policy"}
                  </button>
                </div>
              </article>
            );
          })}

          {filteredAgents.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
              No agents match the current filter.
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
