"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "../../lib/api";
import { ConversationItem } from "../../lib/project-types";
import { ConversationThreadPanel } from "./ConversationThreadPanel";

type DirectConversationsPanelProps = {
  token: string;
  onError?: (message: string | null) => void;
  onSuccess?: (message: string | null) => void;
};

function formatDate(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DirectConversationsPanel({
  token,
  onError,
  onSuccess,
}: DirectConversationsPanelProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeConversation = useMemo(
    () =>
      conversations.find((item) => item.id === activeConversationId) ??
      conversations[0] ??
      null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      try {
        setIsLoading(true);
        const items = await apiRequest<ConversationItem[]>("/conversations?type=DIRECT", {
          token,
        });

        if (cancelled) {
          return;
        }

        setConversations(items);
        setActiveConversationId((current) =>
          current && items.some((item) => item.id === current)
            ? current
            : (items[0]?.id ?? null),
        );
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 403) {
            setConversations([]);
            return;
          }

          onError?.(
            error instanceof Error ? error.message : "Failed to load direct conversations.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadConversations();

    const interval = window.setInterval(loadConversations, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [onError, token]);

  return (
    <section id="messages" className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="openstaff-surface rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-navy/70">
              Direct Conversations
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Private OpenStaff communication between owners, contractors, workers, and admins.
            </div>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            {conversations.reduce((total, item) => total + item.unreadCount, 0)} unread
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Loading direct conversations...
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conversation) => {
              const others = conversation.participants
                .map((participant) => participant.user?.email)
                .filter(Boolean)
                .slice(0, 2);
              const displayLabel = others.join(", ") || "Direct conversation";

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                    activeConversation?.id === conversation.id
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-brand-charcoal">
                        {displayLabel}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Latest activity {formatDate(conversation.latestMessage?.createdAt ?? null)}
                      </div>
                    </div>
                    {conversation.unreadCount > 0 ? (
                      <span className="rounded-full bg-brand-mint px-3 py-1 text-xs font-semibold text-brand-charcoal">
                        {conversation.unreadCount} unread
                      </span>
                    ) : null}
                  </div>
                  {conversation.latestMessage ? (
                    <div className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {conversation.latestMessage.content}
                    </div>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No direct conversations yet. They appear here as soon as a private thread exists.
            </div>
          )}
        </div>
      </section>

      <ConversationThreadPanel
        token={token}
        title="Direct Chat"
        subtitle="Unread state, read status, and system-safe conversation handling are already active."
        conversation={activeConversation}
        emptyLabel="This direct conversation does not have any messages yet."
        onError={onError}
        onSuccess={onSuccess}
      />
    </section>
  );
}
