"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUiConfig } from "../../context/UiConfigContext";
import {
  isAuthenticatedDestinationActive,
  MOBILE_OVERFLOW_DESTINATIONS,
  MOBILE_PRIMARY_DESTINATIONS,
  type ShellMode,
} from "../../lib/authenticated-navigation";
import { ShellIcon } from "./ShellIcon";

export function MobileNavigation({ mode }: { mode: ShellMode }) {
  if (mode === "AUTHENTICATED") {
    return <AuthenticatedMobileNavigation />;
  }

  if (mode !== "PUBLIC") {
    return null;
  }

  return <PublicMobileNavigation />;
}

function PublicMobileNavigation() {
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

function AuthenticatedMobileNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sheet = sheetRef.current;
    const focusable = sheet?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [moreOpen]);

  const overflowActive = MOBILE_OVERFLOW_DESTINATIONS.some(({ href }) =>
    isAuthenticatedDestinationActive(pathname, href),
  );

  return (
    <>
      <nav
        aria-label="Mobile authenticated navigation"
        className="fixed inset-x-0 bottom-0 z-[900] border-t border-white/10 bg-[#0F172A]/98 shadow-[0_-8px_24px_rgba(15,23,42,0.2)] backdrop-blur md:hidden"
        data-authenticated-shell="mobile-navigation"
      >
        <div className="grid h-[calc(4.25rem+env(safe-area-inset-bottom))] grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
          {MOBILE_PRIMARY_DESTINATIONS.map((destination) => {
            const active = isAuthenticatedDestinationActive(
              pathname,
              destination.href,
            );

            return (
              <Link
                key={destination.href}
                href={destination.href}
                prefetch={false}
                aria-label={destination.label}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
                  active
                    ? destination.href === "/jobs"
                      ? "text-[#D946EF]"
                      : "text-[#22C55E]"
                    : "text-[#94A3B8]"
                }`}
              >
                <ShellIcon name={destination.icon} className="h-5 w-5" />
                <span className="max-w-full truncate">
                  {destination.mobileLabel ?? destination.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-0.5 w-6 rounded-full ${
                    active
                      ? destination.href === "/jobs"
                        ? "bg-[#D946EF]"
                        : "bg-[#22C55E]"
                      : "bg-transparent"
                  }`}
                />
              </Link>
            );
          })}

          <button
            ref={triggerRef}
            type="button"
            aria-label="More destinations"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 ${
              overflowActive || moreOpen ? "text-[#22C55E]" : "text-[#94A3B8]"
            }`}
            onClick={() => setMoreOpen(true)}
          >
            <ShellIcon name="menu" className="h-5 w-5" />
            <span>More</span>
            <span
              aria-hidden="true"
              className={`h-0.5 w-6 rounded-full ${
                overflowActive ? "bg-[#22C55E]" : "bg-transparent"
              }`}
            />
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div
          className="fixed inset-0 z-[1100] flex items-end bg-slate-950/45 md:hidden"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setMoreOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            className="w-full rounded-t-lg bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 id="mobile-more-title" className="text-base font-bold text-slate-900">
                More destinations
              </h2>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-md text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-600"
                onClick={() => {
                  setMoreOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close more destinations"
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  &times;
                </span>
              </button>
            </div>
            <div className="grid gap-2 pt-3">
              {MOBILE_OVERFLOW_DESTINATIONS.map((destination) => {
                const active = isAuthenticatedDestinationActive(
                  pathname,
                  destination.href,
                );

                return (
                  <Link
                    key={destination.href}
                    href={destination.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <ShellIcon name={destination.icon} />
                    {destination.label}
                    <ShellIcon name="chevron" className="ml-auto h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
