"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiRequest } from "@/lib/api";
import type { ConversationItem } from "@/lib/project-types";

function formatDate(value?: string | null) {
  if (!value) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MessagesInboxPage() {
  const router = useRouter();
  const { token, isReady, logout } = useAuth();
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const conversations = await apiRequest<ConversationItem[]>("/messages/conversations", {
          token,
        });
        setItems(conversations);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout();
          router.push("/login");
          return;
        }

        setError(
          requestError instanceof Error ? requestError.message : "Failed to load inbox.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isReady, logout, router, token]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_38%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            Collaboration
          </div>
          <h1 className="mt-3 text-4xl font-semibold">Workspace inbox</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Direct, project, workforce, payroll and Relu follow-up conversations powered by the
            operational messaging backend.
          </p>
        </section>

        {loading ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 text-slate-300">
            Loading conversations...
          </section>
        ) : error ? (
          <section className="rounded-[1.75rem] border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">
            {error}
          </section>
        ) : (
          <section className="grid gap-4">
            {items.length ? (
              items.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5 transition hover:border-cyan-400/40 hover:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                          {conversation.type}
                        </span>
                        {conversation.unreadCount ? (
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                            {conversation.unreadCount} unread
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-xl font-semibold text-white">
                        {conversation.title ||
                          conversation.project?.name ||
                          conversation.publicPost?.title ||
                          conversation.contract?.title ||
                          conversation.dispute?.title ||
                          "Conversation workspace"}
                      </h2>
                      <p className="mt-2 text-sm text-slate-300">
                        {conversation.lastMessagePreview || "No messages sent yet."}
                      </p>
                    </div>

                    <div className="text-right text-sm text-slate-400">
                      <div>{formatDate(conversation.lastMessageAt || conversation.createdAt)}</div>
                      <div className="mt-2">{conversation.participants.length} participants</div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 text-slate-400">
                No active conversations yet.
              </section>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
