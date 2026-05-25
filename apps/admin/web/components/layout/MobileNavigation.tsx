"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useUiConfig } from "../../context/UiConfigContext";

export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { config } = useUiConfig();
  const { isAuthenticated, logout } = useAuth();
  const navItems = config.header.menu.slice(0, isAuthenticated ? 3 : 4);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-300/80 bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-2 px-3 py-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href.replace("#messages", ""));

          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch={false}
              className={`rounded-2xl px-3 py-3 text-center text-xs font-semibold ${
                active
                  ? "bg-brand-navy text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-2xl bg-slate-100 px-3 py-3 text-center text-xs font-semibold text-slate-600"
          >
            Logout
          </button>
        ) : null}
      </div>
    </nav>
  );
}
