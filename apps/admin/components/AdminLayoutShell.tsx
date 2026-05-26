"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import { useAuth } from "@/context/AuthContext";

type MenuItem = {
  name: string;
  path: string;
  description: string;
  visibility?: "all" | "superadmin";
};

type MenuGroup = {
  name: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    name: "Operations",
    items: [
      { name: "Dashboard", path: "/dashboard", description: "Executive queue overview" },
      { name: "Moderation", path: "/admin/posts", description: "Public marketplace approvals" },
      { name: "Media & Documents", path: "/admin/media", description: "Asset review queue" },
      { name: "Companies & Workforce", path: "/professionals", description: "Profiles and capacity" },
      { name: "Contracts", path: "/contracts", description: "Delivery agreements" },
      { name: "Financial Engine", path: "/financial", description: "Invoices, VAT and billing" },
      { name: "Countries & VAT", path: "/countries-vat", description: "Market tax settings" },
    ],
  },
  {
    name: "Trust",
    items: [
      { name: "RELU AI Moderation", path: "/admin/relu", description: "AI interpretation review" },
      { name: "Trust & Security", path: "/admin/security", description: "Account and access posture" },
      { name: "Users", path: "/admin/users", description: "Approvals and account state" },
      {
        name: "Roles",
        path: "/admin/roles",
        description: "Permission assignments",
        visibility: "superadmin",
      },
    ],
  },
  {
    name: "Technical",
    items: [
      {
        name: "AI Agent Settings",
        path: "/ai-config",
        description: "Secured technical configuration",
        visibility: "superadmin",
      },
      {
        name: "Prompts & Policies",
        path: "/ai-control",
        description: "AI governance controls",
        visibility: "superadmin",
      },
      {
        name: "AI Queue",
        path: "/ai-queue",
        description: "Task and audit diagnostics",
        visibility: "superadmin",
      },
      {
        name: "Taxonomy Imports",
        path: "/admin/taxonomy",
        description: "Reference data maintenance",
        visibility: "superadmin",
      },
      {
        name: "Delivery Events",
        path: "/admin/notifications",
        description: "Notification delivery diagnostics",
        visibility: "superadmin",
      },
      {
        name: "Production Readiness",
        path: "/admin/production-readiness",
        description: "Technical rollout telemetry",
        visibility: "superadmin",
      },
      {
        name: "UI Configuration",
        path: "/admin/ui-config",
        description: "Public surface controls",
        visibility: "superadmin",
      },
      {
        name: "Implementation Status",
        path: "/status",
        description: "Route and runtime status",
        visibility: "superadmin",
      },
    ],
  },
];

const PUBLIC_PATHS = new Set(["/login", "/status", "/unauthorized"]);

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  if (PUBLIC_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-[#0b1220]">
        <aside className="hidden border-r border-white/10 bg-[#111a2e] p-6 shadow-2xl shadow-slate-950/40 md:flex md:w-80 md:flex-col">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">OpenStaff</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Operational backoffice
            </p>
          </div>

          <nav className="space-y-6 overflow-y-auto pr-1">
            {menuGroups.map((group) => {
              const visibleItems = group.items.filter(
                (item) => item.visibility !== "superadmin" || isSuperAdmin,
              );

              if (visibleItems.length === 0) {
                return null;
              }

              return (
                <div key={group.name}>
                  <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {group.name}
                  </div>
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const active =
                        pathname === item.path ||
                        (item.path !== "/" && pathname.startsWith(`${item.path}/`));

                      return (
                        <Link
                          key={item.name}
                          href={item.path}
                          prefetch={false}
                          className={`block rounded-2xl px-4 py-3 transition ${
                            active
                              ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20"
                              : "text-slate-200 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className="text-sm font-semibold">{item.name}</div>
                          <div
                            className={`mt-1 text-xs leading-5 ${
                              active ? "text-slate-800" : "text-slate-500"
                            }`}
                          >
                            {item.description}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white">
              {isSuperAdmin ? "SuperAdmin technical mode" : "Operational admin mode"}
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-300">
              {isSuperAdmin
                ? "Operational tools are primary. Technical diagnostics stay isolated in the Technical group."
                : "Technical infrastructure and delivery diagnostics are hidden from this workspace."}
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-4 w-full rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="overflow-hidden border-b border-white/10 bg-[#0f172a]/95 px-6 py-5 backdrop-blur md:px-8">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
                  Live platform operations
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                  Backoffice Workspace
                </h1>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-3 lg:justify-end">
                <div className="max-w-full truncate rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 sm:max-w-56">
                  {user?.email ?? "Super Admin"}
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            </div>
            <nav className="mt-5 flex max-w-full flex-wrap gap-2 pb-1 md:hidden">
              {menuGroups
                .flatMap((group) => group.items)
                .filter((item) => item.visibility !== "superadmin" || isSuperAdmin)
                .map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    prefetch={false}
                    className="max-w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100"
                  >
                    {item.name}
                  </Link>
                ))}
            </nav>
          </header>

          <main className="flex-1 bg-[#0b1220]">{children}</main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
