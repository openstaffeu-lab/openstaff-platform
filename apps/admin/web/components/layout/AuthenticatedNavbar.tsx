"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OpenStaffLogo } from "../OpenStaffLogo";
import { useAuth } from "../../context/AuthContext";
import { getNotificationUnreadCount } from "../../lib/api";
import {
  AUTHENTICATED_DESTINATIONS,
  DESKTOP_COMPACT_DESTINATIONS,
  DESKTOP_OVERFLOW_DESTINATIONS,
  isAuthenticatedDestinationActive,
  type AuthenticatedDestination,
} from "../../lib/authenticated-navigation";
import { AuthenticatedAccountMenu } from "./AuthenticatedAccountMenu";
import { ShellIcon } from "./ShellIcon";

function NotificationBadge({ count }: { count: number | null }) {
  if (!count || count < 1) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold leading-none text-white"
      aria-label={`${count} unread notifications`}
    >
      {label}
    </span>
  );
}

function DestinationLink({
  destination,
  pathname,
  unreadCount,
  compact = false,
}: {
  destination: AuthenticatedDestination;
  pathname: string;
  unreadCount: number | null;
  compact?: boolean;
}) {
  const active = isAuthenticatedDestinationActive(pathname, destination.href);

  return (
    <Link
      href={destination.href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
        active
          ? destination.href === "/jobs"
            ? "bg-white/10 text-[#D946EF] shadow-[inset_0_-2px_0_#D946EF]"
            : "bg-white/10 text-[#22C55E] shadow-[inset_0_-2px_0_#22C55E]"
          : "text-[#94A3B8] hover:bg-white/10 hover:text-white"
      } ${compact ? "px-2" : ""}`}
    >
      <ShellIcon name={destination.icon} className="h-[18px] w-[18px] shrink-0" />
      <span>{destination.label}</span>
      {destination.href === "/notifications" ? (
        <NotificationBadge count={unreadCount} />
      ) : null}
    </Link>
  );
}

export function AuthenticatedNavbar() {
  const pathname = usePathname();
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(null);
      return;
    }

    try {
      const result = await getNotificationUnreadCount(token);
      setUnreadCount(
        Number.isFinite(result.unreadCount) ? Math.max(result.unreadCount, 0) : null,
      );
    } catch {
      setUnreadCount(null);
    }
  }, [token]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [pathname, refreshUnreadCount]);

  useEffect(() => {
    const interval = window.setInterval(() => void refreshUnreadCount(), 60_000);

    function refreshOnFocus() {
      void refreshUnreadCount();
    }

    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && moreOpen) {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  const notificationDestination = AUTHENTICATED_DESTINATIONS.find(
    ({ href }) => href === "/notifications",
  );
  const notificationsActive = isAuthenticatedDestinationActive(
    pathname,
    "/notifications",
  );
  const overflowActive = DESKTOP_OVERFLOW_DESTINATIONS.some(({ href }) =>
    isAuthenticatedDestinationActive(pathname, href),
  );

  return (
    <div
      className="h-16 border-b border-white/10 bg-[#0F172A] text-white shadow-[0_4px_18px_rgba(15,23,42,0.18)]"
      data-authenticated-shell="header"
    >
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 lg:px-6">
        <Link
          href="/dashboard"
          prefetch={false}
          className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          aria-label="OpenStaff Dashboard"
        >
          <span className="hidden min-[1200px]:inline-flex">
            <OpenStaffLogo size="sm" variant="full" dark />
          </span>
          <span className="inline-flex min-[1200px]:hidden">
            <OpenStaffLogo size="sm" variant="icon" />
          </span>
        </Link>

        <nav
          aria-label="Authenticated navigation"
          className="ml-2 hidden min-w-0 flex-1 items-center justify-center md:flex"
        >
          <div className="hidden items-center gap-1 min-[1200px]:flex">
            {AUTHENTICATED_DESTINATIONS.map((destination) => (
              <DestinationLink
                key={destination.href}
                destination={destination}
                pathname={pathname}
                unreadCount={unreadCount}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 min-[1200px]:hidden">
            {DESKTOP_COMPACT_DESTINATIONS.map((destination) => (
              <DestinationLink
                key={destination.href}
                destination={destination}
                pathname={pathname}
                unreadCount={unreadCount}
                compact
              />
            ))}
            <div className="relative" ref={moreRef}>
              <button
                ref={moreButtonRef}
                type="button"
                className={`flex h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  overflowActive
                    ? "bg-white/10 text-[#22C55E] shadow-[inset_0_-2px_0_#22C55E]"
                    : "text-[#94A3B8] hover:bg-white/10 hover:text-white"
                }`}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((current) => !current)}
              >
                <ShellIcon name="menu" className="h-[18px] w-[18px]" />
                More
              </button>
              {moreOpen ? (
                <div
                  role="menu"
                  aria-label="More destinations"
                  className="absolute right-0 top-12 z-50 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
                >
                  {DESKTOP_OVERFLOW_DESTINATIONS.map((destination) => {
                    const active = isAuthenticatedDestinationActive(
                      pathname,
                      destination.href,
                    );

                    return (
                      <Link
                        key={destination.href}
                        role="menuitem"
                        href={destination.href}
                        prefetch={false}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <ShellIcon name={destination.icon} />
                        {destination.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {notificationDestination ? (
            <Link
              href={notificationDestination.href}
              prefetch={false}
              aria-current={notificationsActive ? "page" : undefined}
              aria-label="Notifications"
              className={`relative flex h-10 w-10 items-center justify-center rounded-md outline-none transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 md:hidden ${
                notificationsActive
                  ? "bg-white/10 text-[#22C55E]"
                  : "text-[#94A3B8] hover:bg-white/10 hover:text-white"
              }`}
            >
              <ShellIcon name="notifications" />
              <NotificationBadge count={unreadCount} />
            </Link>
          ) : null}
          <AuthenticatedAccountMenu />
        </div>
      </div>
    </div>
  );
}
