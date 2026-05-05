"use client";

import { useEffect, useState } from "react";
import { fetchApiJson } from "@/lib/api";

type RolePermissions = {
  role: string;
  permissions: string[];
};

type LoadState = "loading" | "success" | "unauthorized" | "error";

const ALL_PERMISSIONS = ["READ", "WRITE", "DELETE", "MANAGE_USERS"];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RolePermissions[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      setState("loading");
      setMessage(null);

      const result = await fetchApiJson<RolePermissions[]>("/admin/roles");

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setRoles([]);
        setState(result.kind);
        setMessage(result.message);
        return;
      }

      setRoles(Array.isArray(result.data) ? result.data : []);
      setState("success");
    }

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  async function togglePermission(roleName: string, permission: string) {
    const current = roles.find((item) => item.role === roleName);

    if (!current) {
      return;
    }

    const nextPermissions = current.permissions.includes(permission)
      ? current.permissions.filter((item) => item !== permission)
      : [...current.permissions, permission];

    setSavingRole(roleName);
    setMessage(null);

    const result = await fetchApiJson<RolePermissions>(
      `/admin/roles/${roleName}/permissions`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions: nextPermissions }),
      },
    );

    setSavingRole(null);

    if (!result.ok) {
      setState(result.kind);
      setMessage(result.message);
      return;
    }

    setRoles((currentRoles) =>
      currentRoles.map((role) =>
        role.role === roleName ? { ...role, permissions: result.data.permissions } : role,
      ),
    );
  }

  if (state === "loading") {
    return <Shell title="Admin Roles" message="Loading role permissions..." />;
  }

  if (state === "unauthorized") {
    return (
      <Shell
        title="Admin Roles"
        message={message ?? "You do not have access to role administration."}
        tone="warning"
      />
    );
  }

  if (state === "error") {
    return (
      <Shell
        title="Admin Roles"
        message={message ?? "The roles module could not load."}
        tone="danger"
      />
    );
  }

  return (
    <div className="p-6 text-white md:p-8">
      <div className="rounded-3xl bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Admin Roles</h1>
        <p className="mt-2 text-sm text-slate-400">
          Superadmin can configure role permissions for the OpenStaff platform.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {roles.map((role) => (
            <div
              key={role.role}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{role.role.toLowerCase()}</h2>
                <span className="text-sm text-slate-400">
                  {savingRole === role.role ? "Saving..." : `${role.permissions.length} permissions`}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {ALL_PERMISSIONS.map((permission) => {
                  const checked = role.permissions.includes(permission);

                  return (
                    <label
                      key={permission}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3"
                    >
                      <span>{permission.toLowerCase()}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={savingRole === role.role}
                        onChange={() => void togglePermission(role.role, permission)}
                        className="h-4 w-4"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
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
