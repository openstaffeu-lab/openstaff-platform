"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, apiRequest } from "../../lib/api";
import {
  ConversationItem,
  ConversationMessage,
  ConversationType,
  MessageType,
} from "../../lib/project-types";

type EnsureConversationPayload = {
  type: ConversationType;
  projectId?: string;
  contractId?: string;
  disputeId?: string;
  participantUserIds?: string[];
};

type ConversationThreadPanelProps = {
  token: string;
  title: string;
  subtitle?: string;
  emptyLabel?: string;
  conversation?: ConversationItem | null;
  ensurePayload?: EnsureConversationPayload;
  onConversationLoaded?: (conversation: ConversationItem) => void;
  onError?: (message: string | null) => void;
  onSuccess?: (message: string | null) => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function decodeJwtSub(token: string | null) {
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function getConversationTone(type: ConversationType | undefined) {
  if (type === "PROJECT") {
    return "border-indigo-100 bg-indigo-50 text-brand-navy";
  }

  if (type === "CONTRACT") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (type === "DISPUTE") {
    return "border-rose-100 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getTypeBadge(type: MessageType) {
  if (type === "SYSTEM") {
    return "border-indigo-100 bg-indigo-50 text-brand-navy";
  }

  if (type === "FILE") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}

export function ConversationThreadPanel({
  token,
  title,
  subtitle,
  emptyLabel = "No messages yet.",
  conversation,
  ensurePayload,
  onConversationLoaded,
  onError,
  onSuccess,
}: ConversationThreadPanelProps) {
  const [resolvedConversation, setResolvedConversation] = useState<ConversationItem | null>(
    conversation ?? null,
  );
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const currentUserId = useMemo(() => decodeJwtSub(token), [token]);
  const ensureKey = JSON.stringify(ensurePayload ?? null);

  useEffect(() => {
    setResolvedConversation(conversation ?? null);
  }, [conversation]);

  useEffect(() => {
    let cancelled = false;

    const hydrateConversation = async () => {
      if (!token) {
        return;
      }

      if (conversation) {
        setResolvedConversation(conversation);
        return;
      }

      if (!ensurePayload) {
        setResolvedConversation(null);
        return;
      }

      try {
        const createdConversation = await apiRequest<ConversationItem>("/conversations", {
          method: "POST",
          token,
          body: ensurePayload,
        });

        if (cancelled) {
          return;
        }

        setResolvedConversation(createdConversation);
        onConversationLoaded?.(createdConversation);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
          setResolvedConversation(null);
          return;
        }

        onError?.(error instanceof Error ? error.message : "Failed to load conversation.");
      }
    };

    hydrateConversation();

    return () => {
      cancelled = true;
    };
  }, [conversation, ensureKey, ensurePayload, onConversationLoaded, onError, token]);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async (shouldMarkRead = true) => {
      if (!token || !resolvedConversation?.id) {
        setMessages([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const nextMessages = await apiRequest<ConversationMessage[]>(
          `/conversations/${resolvedConversation.id}/messages`,
          { token },
        );

        if (cancelled) {
          return;
        }

        setMessages(nextMessages);

        if (shouldMarkRead && currentUserId) {
          const unreadMessages = nextMessages.filter(
            (message) =>
              message.senderId !== currentUserId &&
              !message.reads.some((read) => read.userId === currentUserId),
          );

          for (const message of unreadMessages) {
            await apiRequest(`/messages/${message.id}/read`, {
              method: "POST",
              token,
            });
          }
        }
      } catch (error) {
        if (!cancelled) {
          onError?.(error instanceof Error ? error.message : "Failed to load messages.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMessages();

    const interval = window.setInterval(() => {
      loadMessages(false);
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [currentUserId, onError, resolvedConversation?.id, token]);

  const handleSend = async () => {
    if (!token || !resolvedConversation?.id || !draft.trim()) {
      return;
    }

    setIsSending(true);
    onError?.(null);

    try {
      const message = await apiRequest<ConversationMessage>(
        `/conversations/${resolvedConversation.id}/messages`,
        {
          method: "POST",
          token,
          body: {
            type: "TEXT",
            content: draft.trim(),
          },
        },
      );

      setMessages((current) => [...current, message]);
      setDraft("");
      onSuccess?.("Message sent.");
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="openstaff-surface rounded-[2rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-navy/70">
              {title}
            </div>
            {resolvedConversation ? (
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${getConversationTone(
                  resolvedConversation.type,
                )}`}
              >
                {resolvedConversation.type}
              </span>
            ) : null}
          </div>
          {subtitle ? <div className="mt-2 text-sm text-slate-500">{subtitle}</div> : null}
        </div>
        {resolvedConversation ? (
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            {resolvedConversation.participants.length} participants
          </span>
        ) : null}
      </div>

      {resolvedConversation ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {resolvedConversation.participants.map((participant) => (
              <span
                key={participant.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
              >
                {participant.user?.email || participant.userId} · {participant.role}
              </span>
            ))}
          </div>

          <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading messages...
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => {
                const isOwnMessage = currentUserId === message.senderId;
                const readCount = message.reads.length;

                return (
                  <div
                    key={message.id}
                    className={`rounded-[1.5rem] border p-4 ${
                      message.type === "SYSTEM"
                        ? "border-indigo-100 bg-indigo-50"
                        : isOwnMessage
                          ? "border-emerald-100 bg-emerald-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-brand-charcoal">
                          {message.type === "SYSTEM"
                            ? `${title} · System`
                            : message.sender?.email || "System"}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getTypeBadge(
                            message.type,
                          )}`}
                        >
                          {message.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>

                    <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {message.content}
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Read by {readCount} of {resolvedConversation.participants.length}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                {emptyLabel}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-soft">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-charcoal">
                Send message
              </span>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                placeholder="Share a project update, coordination note, or contractual clarification..."
              />
            </label>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !draft.trim()}
                className="rounded-[1.25rem] bg-brand-navy px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          You do not currently have access to this conversation.
        </div>
      )}
    </section>
  );
}
