"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError, apiRequest } from "../../lib/api";
import { ConversationItem } from "../../lib/project-types";

function formatRelativeDate(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getConversationHref(conversation: ConversationItem) {
  if (conversation.projectId) {
    return `/projects/${conversation.projectId}`;
  }

  return "/profile#messages";
}

function getConversationLabel(conversation: ConversationItem) {
  if (conversation.type === "PROJECT") {
    return "Project Chat";
  }

  if (conversation.type === "CONTRACT") {
    return "Contract Chat";
  }

  if (conversation.type === "DISPUTE") {
    return "Dispute Chat";
  }

  return "Direct Chat";
}

function getConversationContext(conversation: ConversationItem) {
  if (conversation.type === "PROJECT") {
    return conversation.project?.name || "OpenStaff project thread";
  }

  if (conversation.type === "CONTRACT") {
    return conversation.contract?.title || "Contractual thread";
  }

  if (conversation.type === "DISPUTE") {
    return conversation.dispute?.title || "Dispute thread";
  }

  const others = conversation.participants
    .map((participant) => participant.user?.email)
    .filter(Boolean)
    .slice(0, 2);

  return others.join(", ") || "Private conversation";
}

function getConversationTone(conversation: ConversationItem) {
  if (conversation.type === "PROJECT") {
    return "border-indigo-100 bg-indigo-50 text-brand-navy";
  }

  if (conversation.type === "CONTRACT") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (conversation.type === "DISPUTE") {
    return "border-rose-100 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function MessagingDock() {
  const { token, isReady, remainingPrivateContacts, subscription } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => conversations.reduce((total, item) => total + item.unreadCount, 0),
    [conversations],
  );

  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      if (!token) {
        setConversations([]);
        return;
      }

      try {
        const items = await apiRequest<ConversationItem[]>("/conversations", { token });
        if (!cancelled) {
          setConversations(items.slice(0, 8));
          setUpgradeMessage(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 403) {
          setConversations([]);
          setUpgradeMessage("Upgrade your plan to unlock more private outreach and direct threads.");
        }
      }
    };

    if (isReady) {
      loadConversations();
    }

    const interval = window.setInterval(loadConversations, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isReady, token]);

  if (!isReady || !token) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-22 right-4 z-40 md:bottom-6 md:right-6">
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex items-center gap-3 rounded-full border border-indigo-100 bg-white px-5 py-3 text-sm font-semibold text-brand-charcoal shadow-soft"
        >
          OpenStaff Messages
          {unreadCount > 0 ? (
            <span className="rounded-full bg-brand-navy px-2.5 py-1 text-xs text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>

        {isOpen ? (
          <div className="mt-3 w-[23rem] rounded-[1.8rem] border border-slate-200 bg-white/98 p-4 shadow-[0_24px_60px_rgba(26,35,126,0.14)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-navy/70">
                  Communication
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  Quick access to project, contract, dispute, and direct threads.
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Plan: {subscription?.planName ?? "No active plan"} · Private contacts left:{" "}
                  {remainingPrivateContacts === null ? "Unlimited / not tracked" : remainingPrivateContacts}
                </div>
              </div>
              <Link
                href="/profile#messages"
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Open inbox
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {upgradeMessage ? (
                <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="font-semibold">{upgradeMessage}</div>
                  <Link
                    href="/pricing?reason=private-contact-limit&plan=BRONZE"
                    className="mt-3 inline-flex rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Compare plans
                  </Link>
                </div>
              ) : null}
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={getConversationHref(conversation)}
                    className="block rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:border-indigo-200 hover:bg-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${getConversationTone(
                              conversation,
                            )}`}
                          >
                            {getConversationLabel(conversation)}
                          </span>
                          {conversation.unreadCount > 0 ? (
                            <span className="rounded-full bg-brand-mint px-2 py-1 text-[10px] font-semibold text-brand-charcoal">
                              {conversation.unreadCount} unread
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 truncate text-sm font-semibold text-brand-charcoal">
                          {getConversationContext(conversation)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {conversation.latestMessage?.content || "No messages yet."}
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      {formatRelativeDate(conversation.latestMessage?.createdAt ?? null)}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No conversations yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
