"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  approvalStatus: string;
  accountStatus: string;
  createdAt: string;
  approvedAt: string | null;
  lastLoginAt: string | null;
  profile: {
    id: string;
    slug: string;
    displayName: string;
    companyName: string | null;
    profileType: string;
    visibility: string;
    moderationStatus: string;
    status: string;
  } | null;
};

type LoadState = "loading" | "success" | "unauthorized" | "error";

const ASSIGNABLE_ROLES = ["SUPERADMIN", "ADMIN", "EMPLOYER", "CONTRACTOR", "GENERAL_CONTRACTOR", "PROFESSIONAL", "WORKER"];
const APPROVAL_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];
const ACCOUNT_STATUS_OPTIONS = ["LIVE", "OFFLINE", "SUSPENDED"];
const PROFILE_MODERATION_OPTIONS = ["PENDING", "APPROVED", "CHANGES_REQUESTED", "REJECTED"];
const PROFILE_STATUS_OPTIONS = ["LIVE", "OFFLINE", "SUSPENDED"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function loadUsers() {
    setState("loading");
    setMessage(null);

    try {
      const response = await adminApi.getUsers();
      setUsers(Array.isArray(response) ? response : []);
      setState("success");
    } catch (error) {
      setUsers([]);
      setState("error");
      setMessage(error instanceof Error ? error.message : "The users module could not load.");
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleRole(userId: string, role: string) {
    setSavingKey(`${userId}:role`);
    setMessage(null);

    try {
      const updated = (await adminApi.updateUserRole(userId, role)) as Partial<AdminUser>;
      setUsers((current) =>
        current.map((user) => (user.id === userId ? { ...user, ...updated } : user)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update role.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleApproval(userId: string, approvalStatus: string) {
    setSavingKey(`${userId}:approval`);
    setMessage(null);

    try {
      const updated = (await adminApi.updateUserApproval(
        userId,
        approvalStatus,
      )) as Partial<AdminUser>;
      setUsers((current) =>
        current.map((user) => (user.id === userId ? { ...user, ...updated } : user)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update approval.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleAccountStatus(userId: string, accountStatus: string) {
    setSavingKey(`${userId}:account`);
    setMessage(null);

    try {
      const updated = (await adminApi.updateAccountStatus(
        userId,
        accountStatus,
      )) as Partial<AdminUser>;
      setUsers((current) =>
        current.map((user) => (user.id === userId ? { ...user, ...updated } : user)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update account status.");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleProfileModeration(
    userId: string,
    moderationStatus: string,
    status: string,
  ) {
    setSavingKey(`${userId}:profile`);
    setMessage(null);

    try {
      const updated = (await adminApi.updateProfileModeration(
        userId,
        moderationStatus,
        status,
      )) as { profile: Partial<AdminUser["profile"]> };
      setUsers((current) =>
        current.map((user) =>
          user.id === userId && user.profile
            ? {
                ...user,
                profile: {
                  ...user.profile,
                  ...updated.profile,
                },
              }
            : user,
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to moderate profile.");
    } finally {
      setSavingKey(null);
    }
  }

  if (state === "loading") {
    return <Shell title="Admin Users" message="Loading users..." />;
  }

  if (state === "unauthorized") {
    return (
      <Shell
        title="Admin Users"
        message={message ?? "You do not have access to user administration."}
        tone="warning"
      />
    );
  }

  if (state === "error") {
    return (
      <Shell
        title="Admin Users"
        message={message ?? "The users module could not load."}
        tone="danger"
      />
    );
  }

  return (
    <div className="p-6 text-white md:p-8">
      <div className="rounded-3xl bg-slate-900 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User Approval & Profile Moderation</h1>
            <p className="mt-2 text-sm text-slate-400">
              Approve accounts, suspend access, moderate public profiles, and control live or offline state.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300"
          >
            Refresh {users.length} users
          </button>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        <div className="mt-6 space-y-5">
          {users.map((user) => (
            <article key={user.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="text-lg font-semibold text-white">{user.email}</div>
                  <div className="mt-2 text-sm text-slate-400">
                    Created {new Date(user.createdAt).toLocaleString()}
                    {user.lastLoginAt ? ` · Last login ${new Date(user.lastLoginAt).toLocaleString()}` : ""}
                  </div>
                  {user.profile ? (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                      <div className="font-semibold text-white">{user.profile.displayName}</div>
                      <div className="mt-1">
                        {user.profile.profileType.replaceAll("_", " ")} · {user.profile.visibility}
                      </div>
                      <div className="mt-1">
                        Slug: <span className="text-cyan-300">{user.profile.slug}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-500">
                      No profile created yet.
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ControlCard label="Role">
                    <select
                      value={user.role}
                      disabled={savingKey === `${user.id}:role`}
                      onChange={(event) => void handleRole(user.id, event.target.value)}
                      className={selectClassName}
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </ControlCard>

                  <ControlCard label="Account Approval">
                    <select
                      value={user.approvalStatus}
                      disabled={savingKey === `${user.id}:approval`}
                      onChange={(event) => void handleApproval(user.id, event.target.value)}
                      className={selectClassName}
                    >
                      {APPROVAL_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </ControlCard>

                  <ControlCard label="Account Status">
                    <select
                      value={user.accountStatus}
                      disabled={savingKey === `${user.id}:account`}
                      onChange={(event) => void handleAccountStatus(user.id, event.target.value)}
                      className={selectClassName}
                    >
                      {ACCOUNT_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </ControlCard>

                  <ControlCard label="Approved At">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-slate-300">
                      {user.approvedAt ? new Date(user.approvedAt).toLocaleString() : "Not approved"}
                    </div>
                  </ControlCard>

                  <ControlCard label="Profile Moderation">
                    <select
                      value={user.profile?.moderationStatus ?? "PENDING"}
                      disabled={!user.profile || savingKey === `${user.id}:profile`}
                      onChange={(event) =>
                        void handleProfileModeration(
                          user.id,
                          event.target.value,
                          user.profile?.status ?? "OFFLINE",
                        )
                      }
                      className={selectClassName}
                    >
                      {PROFILE_MODERATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </ControlCard>

                  <ControlCard label="Profile Status">
                    <select
                      value={user.profile?.status ?? "OFFLINE"}
                      disabled={!user.profile || savingKey === `${user.id}:profile`}
                      onChange={(event) =>
                        void handleProfileModeration(
                          user.id,
                          user.profile?.moderationStatus ?? "PENDING",
                          event.target.value,
                        )
                      }
                      className={selectClassName}
                    >
                      {PROFILE_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </ControlCard>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ControlCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function Shell({
  title,
  message,
  tone = "neutral",
}: {
  title: string;
  message: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClasses =
    tone === "warning"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
      : tone === "danger"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
        : "border-slate-800 bg-slate-900 text-slate-300";

  return (
    <div className="p-6 text-white md:p-8">
      <div className={`rounded-3xl border p-6 ${toneClasses}`}>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3">{message}</p>
      </div>
    </div>
  );
}

const selectClassName =
  "w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-3 text-sm text-white";
