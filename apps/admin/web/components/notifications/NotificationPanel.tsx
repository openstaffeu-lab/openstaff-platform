"use client";

import { NotificationItem, NotificationListResponse } from "../../lib/project-types";

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function badgeForSeverity(severity: string) {
  if (severity === "CRITICAL") {
    return "border-rose-400/20 bg-rose-500/10 text-rose-100";
  }

  if (severity === "WARNING") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-100";
  }

  return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
}

type Props = {
  title?: string;
  notifications: NotificationListResponse | null;
  onMarkRead: (notification: NotificationItem) => Promise<void>;
  onRecompute?: () => Promise<void>;
  workingId?: string | null;
};

export function NotificationPanel({
  title = "Notifications",
  notifications,
  onMarkRead,
  onRecompute,
  workingId,
}: Props) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">{title}</div>
          <div className="mt-2 text-sm text-slate-400">
            In-app reminders, compliance deadlines, and contract accountability updates.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
            {notifications?.unreadCount ?? 0} unread
          </span>
          {onRecompute ? (
            <button
              type="button"
              onClick={onRecompute}
              className="rounded-[1.25rem] border border-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-100"
            >
              Recompute reminders
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {notifications?.items.length ? (
          notifications.items.map((notification) => (
            <div
              key={notification.id}
              className="rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">{notification.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{notification.message}</div>
                  <div className="mt-3 text-xs text-slate-500">
                    Scheduled {formatDate(notification.scheduledFor)} · {notification.type}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${badgeForSeverity(
                      notification.severity,
                    )}`}
                  >
                    {notification.severity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onMarkRead(notification)}
                    disabled={notification.status === "READ" || workingId === notification.id}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-xs text-slate-200 disabled:opacity-60"
                  >
                    {notification.status === "READ"
                      ? "Read"
                      : workingId === notification.id
                        ? "Saving..."
                        : "Mark read"}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
            No notifications yet.
          </div>
        )}
      </div>
    </section>
  );
}
