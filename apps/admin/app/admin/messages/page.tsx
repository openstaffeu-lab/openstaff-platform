"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminApi,
  type AdminMessageConversation,
  type AdminMessageItem,
} from "@/lib/api";

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<AdminMessageConversation[]>([]);
  const [moderationItems, setModerationItems] = useState<AdminMessageItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [conversationData, moderationData] = await Promise.all([
        adminApi.getAdminMessageConversations({ q: query || undefined }),
        adminApi.getAdminMessageModeration({ q: query || undefined }),
      ]);
      setConversations(conversationData);
      setModerationItems(moderationData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nu am putut incarca dashboard-ul de mesagerie.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [query]);

  const stats = useMemo(
    () => ({
      conversations: conversations.length,
      unreadThreads: conversations.filter((item) => item.unreadCount > 0).length,
      moderationQueue: moderationItems.length,
      flaggedItems: moderationItems.filter((item) => item.isFlagged).length,
    }),
    [conversations, moderationItems],
  );

  async function moderate(
    messageId: string,
    moderationStatus: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED",
  ) {
    setActionLoading(messageId);
    setError(null);
    try {
      await adminApi.moderateAdminMessage(messageId, {
        moderationStatus,
        isFlagged: moderationStatus === "FLAGGED",
        applyToAttachments: true,
      });
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nu am putut modera mesajul selectat.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="space-y-8 p-8 text-white">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Messaging workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Conversations, moderation and audit</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Real operational messaging threads tied to projects, workforce, payroll and Relu
          follow-up. This admin view exposes unread activity, participant context and moderation
          controls for messages and attachments.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Conversations" value={stats.conversations} />
        <MetricCard label="Unread Threads" value={stats.unreadThreads} accent="amber" />
        <MetricCard label="Moderation Queue" value={stats.moderationQueue} accent="rose" />
        <MetricCard label="Flagged Items" value={stats.flaggedItems} accent="rose" />
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-300">
            Search by title, participant, message preview
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="project, payroll, workforce, relu..."
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
          />
        </label>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          Loading messaging workspace...
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="space-y-4">
            {conversations.map((conversation) => (
              <article
                key={conversation.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge label={conversation.type} tone="cyan" />
                      {conversation.unreadCount > 0 ? (
                        <Badge label={`${conversation.unreadCount} UNREAD`} tone="amber" />
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-white">
                      {conversation.title ||
                        conversation.project?.name ||
                        conversation.publicPost?.title ||
                        conversation.contract?.title ||
                        "Operational conversation"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {conversation.lastMessagePreview || "No message preview available yet."}
                    </p>
                  </div>
                  <div className="text-sm text-slate-400">
                    <div>Last activity {formatDate(conversation.lastMessageAt)}</div>
                    <div className="mt-2">{conversation.participants.length} participants</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {conversation.participants.map((participant) => (
                    <span
                      key={participant.id}
                      className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300"
                    >
                      {participant.user?.email || participant.userId} · {participant.role}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-4">
            {moderationItems.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge label={item.type} tone="slate" />
                      <Badge label={item.moderationStatus} tone={toneForStatus(item.moderationStatus)} />
                      {item.isFlagged ? <Badge label="FLAGGED" tone="rose" /> : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white">
                      {item.sender?.email || item.senderId}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">{item.content}</p>
                  </div>
                  <div className="text-sm text-slate-400">{formatDate(item.createdAt)}</div>
                </div>

                {item.attachments.length ? (
                  <div className="mt-4 space-y-2">
                    {item.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300"
                      >
                        {attachment.fileName} · {attachment.mimeType} · {attachment.status}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <ActionButton
                    label="Approve"
                    tone="emerald"
                    loading={actionLoading === item.id}
                    onClick={() => moderate(item.id, "APPROVED")}
                  />
                  <ActionButton
                    label="Reject"
                    tone="rose"
                    loading={actionLoading === item.id}
                    onClick={() => moderate(item.id, "REJECTED")}
                  />
                  <ActionButton
                    label="Flag"
                    tone="amber"
                    loading={actionLoading === item.id}
                    onClick={() => moderate(item.id, "FLAGGED")}
                  />
                </div>
              </article>
            ))}
          </section>
        </section>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  accent = "cyan",
}: {
  label: string;
  value: number;
  accent?: "cyan" | "amber" | "rose";
}) {
  const tones = {
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  } as const;

  return (
    <div className={`rounded-3xl border p-5 ${tones[accent]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.24em]">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "cyan" | "slate" | "amber" | "rose" | "emerald" }) {
  const tones = {
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    slate: "border-slate-700 bg-slate-950 text-slate-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  } as const;

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${tones[tone]}`}>
      {label}
    </span>
  );
}

function ActionButton({
  label,
  tone,
  loading,
  onClick,
}: {
  label: string;
  tone: "emerald" | "rose" | "amber";
  loading: boolean;
  onClick: () => void;
}) {
  const tones = {
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]}`}
    >
      {loading ? "Working..." : label}
    </button>
  );
}

function toneForStatus(status: string): "emerald" | "amber" | "rose" | "slate" {
  if (status === "APPROVED") {
    return "emerald";
  }
  if (status === "FLAGGED" || status === "PENDING") {
    return "amber";
  }
  if (status === "REJECTED") {
    return "rose";
  }
  return "slate";
}
