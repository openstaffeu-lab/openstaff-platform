"use client";

import Link from "next/link";
import { useState } from "react";
import { OpenStaffLogo } from "./OpenStaffLogo";
import { brand } from "../lib/brand";

const links = [
  { href: "/jobs", label: "Jobs" },
  { href: "/professionals", label: "Professionals" },
  { href: "/categories/construction", label: "Categories" },
  { href: "/status", label: "Status" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border-b shadow-sm"
      style={{
        backgroundColor: brand.navy,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
        <Link href="/" className="shrink-0">
          <OpenStaffLogo size="sm" variant="full" dark />
        </Link>

        <div className="hidden min-w-0 flex-1 md:block">
          <div className="flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white/80">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 21L16.65 16.65M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              placeholder="Search jobs, NACE, ESCO, regions..."
              className="ml-3 w-full border-0 bg-transparent text-sm font-medium text-white placeholder:text-white/55 focus:outline-none"
            />
          </div>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-full border px-4 py-2 text-sm font-bold"
            style={{ borderColor: brand.green, color: brand.green }}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full px-4 py-2 text-sm font-black"
            style={{ backgroundColor: brand.green, color: brand.navy }}
          >
            Register
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-white md:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-label="Toggle navigation"
        >
          <span className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 px-4 pb-4 md:hidden">
          <div className="mt-3 flex flex-col gap-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl bg-white/8 px-4 py-3 text-sm font-semibold text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-2xl border px-4 py-3 text-sm font-bold"
              style={{ borderColor: brand.green, color: brand.green }}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-2xl px-4 py-3 text-sm font-black"
              style={{ backgroundColor: brand.green, color: brand.navy }}
            >
              Register
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
