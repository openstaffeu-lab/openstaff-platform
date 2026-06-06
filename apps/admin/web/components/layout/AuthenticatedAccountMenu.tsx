"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AuthUser } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { ShellIcon } from "./ShellIcon";

function identityDescription(user: AuthUser | null) {
  switch (user?.identityState.selectedIdentityType) {
    case "PROFESSIONAL":
      return "Professional profile";
    case "COMPANY":
      return "Company profile";
    case "BOTH":
      return "Professional and company profiles";
    default:
      return "OpenStaff account";
  }
}

function initials(user: AuthUser | null) {
  const source = user?.displayName?.trim() || user?.email || "OS";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AuthenticatedAccountMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { logout, user } = useAuth();
  const accountInitials = useMemo(() => initials(user), [user]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.replace("/login");
  }

  const menuItemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600";

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#22C55E]/70 bg-white/10 text-sm font-bold text-white outline-none transition hover:border-[#22C55E] hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {accountInitials}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-12 z-50 w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
        >
          <div className="border-b border-slate-200 px-3 py-3">
            <p className="truncate text-sm font-bold text-slate-900">
              {user?.displayName || "OpenStaff account"}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">{user?.email}</p>
            <p className="mt-2 text-xs font-semibold text-blue-700">
              {identityDescription(user)}
            </p>
          </div>

          <div className="grid gap-1 pt-2">
            <Link
              role="menuitem"
              href="/profile"
              prefetch={false}
              className={menuItemClass}
              onClick={() => setOpen(false)}
            >
              <ShellIcon name="profile" />
              Profile
            </Link>
            <Link
              role="menuitem"
              href="/security"
              prefetch={false}
              className={menuItemClass}
              onClick={() => setOpen(false)}
            >
              <ShellIcon name="security" />
              Security
            </Link>
            <button
              role="menuitem"
              type="button"
              className={`${menuItemClass} text-red-700 hover:bg-red-50`}
              onClick={() => void handleLogout()}
            >
              <ShellIcon name="logout" />
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
