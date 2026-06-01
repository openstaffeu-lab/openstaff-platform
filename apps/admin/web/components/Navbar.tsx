"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { OpenStaffLogo } from "./OpenStaffLogo";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { href: "/#how-it-works", label: "Cum funcționează", icon: "book" },
  { href: "/pricing", label: "Prețuri", icon: "tag" },
] as const;

const topicOptions = [
  "Hiring / Post a Job",
  "Find Talent",
  "Logistics",
  "Specialized Tests",
  "Pricing",
  "Support",
  "Partnership",
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [language, setLanguage] = useState("RO");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.replace("/login");
  }

  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="border-b border-[#1D4ED8]/40 bg-[#1E3A8A] text-white shadow-[0_10px_30px_rgba(30,58,138,0.18)]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
        <Link href="/" prefetch={false} className="shrink-0" onClick={() => setOpen(false)}>
          <OpenStaffLogo size="sm" variant="full" showTagline dark />
        </Link>

        <div className="hidden min-w-[230px] max-w-[380px] flex-1 md:block">
          <label className="flex items-center rounded-xl border border-white/25 bg-white px-4 py-2.5 text-[#1E293B] shadow-sm transition focus-within:border-[#14B8A6] focus-within:ring-2 focus-within:ring-[#14B8A6]/30">
            <Icon name="search" className="h-5 w-5 text-[#1D4ED8]" />
            <input
              placeholder="Caută joburi, NACE, ESCO..."
              className="ml-3 w-full border-0 bg-transparent text-sm font-medium text-[#1E293B] placeholder:text-[#64748B] focus:outline-none"
            />
          </label>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-[#1D4ED8] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-[#1D4ED8] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
          >
            <Icon name="mail" className="h-4 w-4" />
            Contact
          </button>
          <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/90">
            <Icon name="globe" className="h-4 w-4" />
            <span>Limba</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none"
              aria-label="Limba"
            >
              <option className="text-[#1E3A8A]" value="RO">
                RO
              </option>
              <option className="text-[#1E3A8A]" value="EN">
                EN
              </option>
            </select>
          </label>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                prefetch={false}
                className="max-w-40 truncate rounded-xl border border-white/35 px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                title={user?.email ?? "Profile"}
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-xl bg-[#10B981] px-4 py-2 text-sm font-black text-white transition hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                prefetch={false}
                className="rounded-xl border border-white/40 px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
              >
                Login
              </Link>
              <Link
                href="/register"
                prefetch={false}
                className="rounded-xl bg-[#10B981] px-4 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(16,185,129,0.24)] transition hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-white"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 text-white transition hover:bg-[#1D4ED8] md:hidden"
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
          <div className="mt-3">
            <label className="flex items-center rounded-xl border border-white/25 bg-white px-4 py-2.5 text-[#1E293B] focus-within:border-[#14B8A6] focus-within:ring-2 focus-within:ring-[#14B8A6]/30">
              <Icon name="search" className="h-5 w-5 text-[#1D4ED8]" />
              <input
                placeholder="Caută joburi, NACE, ESCO..."
                className="ml-3 w-full border-0 bg-transparent text-sm font-medium text-[#1E293B] placeholder:text-[#64748B] focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-3 grid gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#1D4ED8]/55 px-4 py-3 text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setContactOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1D4ED8]/55 px-4 py-3 text-left text-sm font-semibold text-white"
            >
              <Icon name="mail" className="h-4 w-4" />
              Contact
            </button>
            <label className="inline-flex items-center gap-2 rounded-2xl bg-[#1D4ED8]/55 px-4 py-3 text-sm font-semibold text-white">
              <Icon name="globe" className="h-4 w-4" />
              Limba
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="ml-auto bg-transparent text-sm font-semibold text-white focus:outline-none"
                aria-label="Limba"
              >
                <option className="text-[#1E3A8A]" value="RO">
                  RO
                </option>
                <option className="text-[#1E3A8A]" value="EN">
                  EN
                </option>
              </select>
            </label>
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  prefetch={false}
                  className="rounded-2xl border border-white/25 px-4 py-3 text-sm font-bold text-white"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-2xl bg-[#10B981] px-4 py-3 text-left text-sm font-black text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  prefetch={false}
                  className="rounded-2xl border border-white/25 px-4 py-3 text-sm font-bold text-white"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  prefetch={false}
                  className="rounded-2xl bg-[#10B981] px-4 py-3 text-sm font-black text-white"
                  onClick={() => setOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}

      {contactOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#172554]/75 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white p-6 text-[#1E293B] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold uppercase text-[#1D4ED8]">Contact OpenStaff</div>
                <h2 className="mt-2 text-2xl font-black text-[#172554]">Tell us what you need</h2>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  Share hiring, talent, logistics, pricing, or support context. For urgent
                  requests, email info@openstaff.eu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContactOpen(false);
                  setSubmitted(false);
                }}
                className="rounded-full border border-[#BFDBFE] px-3 py-1 text-sm font-bold text-[#1E3A8A] transition hover:bg-[#EFF6FF]"
                aria-label="Close contact modal"
              >
                Close
              </button>
            </div>

            {submitted ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                Thank you. Please send any urgent details to info@openstaff.eu.
              </div>
            ) : null}

            <form onSubmit={handleContactSubmit} className="mt-5 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <ContactField label="Name" name="name" />
                <ContactField label="Email" name="email" type="email" />
                <ContactField label="Company" name="company" />
                <label className="grid gap-1 text-sm font-semibold text-[#334155]">
                  Topic
                  <select className="rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]">
                    {topicOptions.map((topic) => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold text-[#334155]">
                Message
                <textarea
                  rows={4}
                  className="resize-none rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <a className="text-sm font-bold text-[#2563EB]" href="mailto:info@openstaff.eu">
                  info@openstaff.eu
                </a>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                >
                  Prepare message
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ContactField({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-[#334155]">
      {label}
      <input
        name={name}
        type={type}
        className="rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
      />
    </label>
  );
}

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  switch (name) {
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M20.5 13.5 13 21l-10-10V3h8l9.5 10.5z" />
          <path d="M7.5 7.5h.01" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <path d="M4 4h16v16H4z" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15 15 0 0 1 0 20" />
          <path d="M12 2a15 15 0 0 0 0 20" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
  }
}
