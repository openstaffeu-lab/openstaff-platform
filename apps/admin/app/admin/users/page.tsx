"use client";

import { useEffect, useState } from "react";
import { fetchApiJson } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  isTemporary?: boolean;
};

type LoadState = "loading" | "success" | "unauthorized" | "error";

const ASSIGNABLE_ROLES = ["SUPERADMIN", "ADMIN", "CONTRACTOR", "WORKER"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setState("loading");
      setMessage(null);

      const result = await fetchApiJson<AdminUser[]>("/admin/users");

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setUsers([]);
        setState(result.kind);
        setMessage(result.message);
        return;
      }

      setUsers(Array.isArray(result.data) ? result.data : []);
      setState("success");
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  async function updateRole(userId: string, role: string) {
    setSavingUserId(userId);
    setMessage(null);

    const result = await fetchApiJson<AdminUser>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    setSavingUserId(null);

    if (!result.ok) {
      setState(result.kind);
      setMessage(result.message);
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? { ...user, role: result.data.role } : user,
      ),
    );
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
            <h1 className="text-2xl font-semibold">Admin Users</h1>
            <p className="mt-2 text-sm text-slate-400">
              Superadmin can assign platform roles for backoffice access.
            </p>
          </div>
          <div className="rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            {users.length} users
          </div>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-800">
                  <td className="px-4 py-4">{user.email}</td>
                  <td className="px-4 py-4">
                    <select
                      value={user.role}
                      disabled={user.isTemporary || savingUserId === user.id}
                      onChange={(event) => void updateRole(user.id, event.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-50"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role.toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    {user.isTemporary
                      ? "Temporary"
                      : new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    {user.isTemporary ? "temporary superadmin" : "database"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

