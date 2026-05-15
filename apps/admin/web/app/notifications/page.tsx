"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ApiError,
  dismissNotification,
  getNotificationPreferences,
  getNotificationUnreadCount,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from "@/lib/api";
import type {
  NotificationCategory,
  NotificationItem,
  NotificationListResponse,
  NotificationPreference,
} from "@/lib/project-types";

const categories: NotificationCategory[] = [
  "ACCOUNT",
  "BILLING",
  "VERIFICATION",
  "PROJECTS",
  "MESSAGING",
  "WORKFORCE",
  "PAYROLL",
  "RELU",
  "ADMIN",
];

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "READ") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  if (status === "FAILED") return "border-rose-500/30 bg-rose-500/10 text-rose-100";
  if (status === "DISMISSED") return "border-slate-600 bg-slate-800 text-slate-300";
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-100";
}

export default function NotificationsPage() {
  const router = useRouter();
  const { token, isReady, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationListResponse | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (authToken: string) => {
    const [notificationData, unreadData, preferenceData] = await Promise.all([
      getNotifications(authToken),
      getNotificationUnreadCount(authToken),
      getNotificationPreferences(authToken),
    ]);

    setNotifications(notificationData);
    setUnreadCount(unreadData.unreadCount);
    setPreferences(preferenceData);
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await load(token);
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nu am putut incarca notificarile.",
        );
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [isReady, logout, router, token]);

  const visibleNotifications = useMemo(() => notifications?.items ?? [], [notifications]);

  const handleMarkRead = async (notification: NotificationItem) => {
    if (!token) return;
    setSaving(notification.id);
    setError(null);
    try {
      await markNotificationRead(notification.id, token);
      await load(token);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nu am putut marca notificarea.");
    } finally {
      setSaving(null);
    }
  };

  const handleDismiss = async (notification: NotificationItem) => {
    if (!token) return;
    setSaving(notification.id);
    setError(null);
    try {
      await dismissNotification(notification.id, token);
      await load(token);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nu am putut ascunde notificarea.");
    } finally {
      setSaving(null);
    }
  };

  const handleReadAll = async () => {
    if (!token) return;
    setSaving("read-all");
    setError(null);
    try {
      await markAllNotificationsRead(token);
      await load(token);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nu am putut marca toate notificarile.");
    } finally {
      setSaving(null);
    }
  };

  const handleTogglePreference = async (
    key: "inAppEnabled" | "emailEnabled" | "smsEnabled",
    value: boolean,
  ) => {
    if (!token || !preferences) return;
    setSaving(key);
    setError(null);
    try {
      const updated = await updateNotificationPreferences({ [key]: value }, token);
      setPreferences(updated);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nu am putut salva preferintele.");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleCategory = async (category: NotificationCategory, value: boolean) => {
    if (!token || !preferences) return;
    setSaving(category);
    setError(null);
    try {
      const updated = await updateNotificationPreferences(
        {
          categories: {
            ...preferences.categories,
            [category]: value,
          },
        },
        token,
      );
      setPreferences(updated);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Nu am putut salva categoria.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <main className="min-h-screen px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">
                Notifications
              </div>
              <h1 className="mt-3 text-4xl font-semibold">Workflow updates and alerts</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Persisted alerts from account, billing, verification, workforce, payroll,
                messaging and Relu.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
                {unreadCount} unread
              </span>
              <button
                type="button"
                onClick={handleReadAll}
                disabled={saving === "read-all"}
                className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {saving === "read-all" ? "Saving..." : "Mark all read"}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 p-5 text-rose-100">
            {error}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="text-sm font-semibold text-white">Recent notifications</div>
            <div className="mt-4 space-y-4">
              {loading ? (
                <div className="text-sm text-slate-400">Loading notifications...</div>
              ) : visibleNotifications.length ? (
                visibleNotifications.map((notification) => (
                  <article
                    key={notification.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-white">
                            {notification.title}
                          </h2>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClass(
                              notification.status,
                            )}`}
                          >
                            {notification.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {notification.message}
                        </p>
                        <div className="mt-3 text-xs text-slate-500">
                          {notification.category ?? "GENERAL"} • {notification.type} •{" "}
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleMarkRead(notification)}
                          disabled={
                            notification.status === "READ" || saving === notification.id
                          }
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                        >
                          Read
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDismiss(notification)}
                          disabled={saving === notification.id}
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                  No notifications available yet.
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="text-sm font-semibold text-white">Preferences</div>
            <div className="mt-4 space-y-3">
              <ToggleRow
                label="In-app"
                checked={preferences?.inAppEnabled ?? true}
                disabled={!preferences || saving === "inAppEnabled"}
                onChange={(value) => void handleTogglePreference("inAppEnabled", value)}
              />
              <ToggleRow
                label="Email"
                checked={preferences?.emailEnabled ?? true}
                disabled={!preferences || saving === "emailEnabled"}
                onChange={(value) => void handleTogglePreference("emailEnabled", value)}
              />
              <ToggleRow
                label="SMS placeholder"
                checked={preferences?.smsEnabled ?? false}
                disabled={!preferences || saving === "smsEnabled"}
                onChange={(value) => void handleTogglePreference("smsEnabled", value)}
              />
            </div>

            <div className="mt-6 text-xs uppercase tracking-[0.24em] text-slate-500">
              Categories
            </div>
            <div className="mt-3 space-y-3">
              {categories.map((category) => (
                <ToggleRow
                  key={category}
                  label={category}
                  checked={preferences?.categories?.[category] ?? true}
                  disabled={!preferences || saving === category}
                  onChange={(value) => void handleToggleCategory(category, value)}
                />
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
      <span className="text-sm text-white">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-cyan-400"
      />
    </label>
  );
}
