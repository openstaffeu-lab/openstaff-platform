"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ActorCard from "@/components/ActorCard";
import GeminiChatbot from "@/components/GeminiChatbot";
import JobCard from "@/components/JobCard";
import {
  getMarketplaceProfessionals,
  getMarketplaceProjects,
  trackRolloutFunnelEvent,
  type MarketplacePost,
} from "@/lib/api";

const categoryDomains = [
  { label: "Industrial", icon: "factory", href: "/jobs?category=INDUSTRIAL" },
  { label: "Construction", icon: "build", href: "/jobs?category=CONSTRUCTION" },
  { label: "HORECA", icon: "hospitality", href: "/jobs?category=HORECA" },
  { label: "Data Center", icon: "server", href: "/jobs?category=DATA_CENTER" },
  { label: "Energy", icon: "energy", href: "/jobs?category=ENERGY" },
  { label: "Logistics", icon: "logistics", href: "/logistics" },
  { label: "Aviation", icon: "aviation", href: "/jobs?category=AVIATION" },
  { label: "Robotics / Drones", icon: "robotics", href: "/jobs?category=ROBOTICS" },
];

const trustItems = [
  { label: "Verified Companies", icon: "shield" },
  { label: "AI Matching", icon: "spark" },
  { label: "Secure Contracting", icon: "lock" },
  { label: "Live Monitoring", icon: "bars" },
];

const operationsLinks = [
  { label: "Publish now", href: "/publish", icon: "briefcase" },
  { label: "Find Talent", href: "/professionals", icon: "people" },
  { label: "Logistics Services", href: "/logistics", icon: "truck" },
  { label: "Specialized Tests", href: "/tests", icon: "shield" },
  { label: "Pricing Tiers", href: "/pricing", icon: "tag" },
];

const workflowSteps = [
  {
    title: "Descoperă Oportunități",
    body: "Browse approved projects, professional capability pools, and demand signals in one public marketplace.",
    icon: "search",
  },
  {
    title: "Potrivire prin AI (NACE/ESCO)",
    body: "RELU AI helps classify work, skills, and domains so teams can compare fit with less manual triage.",
    icon: "spark",
  },
  {
    title: "Contractare Securizată",
    body: "Keep hiring intent, company readiness, and execution context structured before operations begin.",
    icon: "lock",
  },
  {
    title: "Monitorizare Live",
    body: "Follow delivery readiness, workforce activity, and operational signals from a shared workspace.",
    icon: "bars",
  },
];

export default function HomePage() {
  const [projects, setProjects] = useState<MarketplacePost[]>([]);
  const [professionals, setProfessionals] = useState<MarketplacePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackRolloutFunnelEvent({
      eventType: "LANDING_PAGE_VISIT",
      surface: "homepage",
      dedupeKey: "homepage",
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadMarketplace() {
      try {
        setLoading(true);
        setError(null);
        const [projectFeed, professionalFeed] = await Promise.all([
          getMarketplaceProjects(6),
          getMarketplaceProfessionals(8),
        ]);

        if (!alive) return;
        setProjects(projectFeed.data);
        setProfessionals(professionalFeed.data);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Marketplace content is temporarily unavailable.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadMarketplace();

    return () => {
      alive = false;
    };
  }, []);

  const visibleProjects = useMemo(() => projects.slice(0, 6), [projects]);
  const visibleProfessionals = useMemo(() => professionals.slice(0, 8), [professionals]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <section className="relative overflow-hidden bg-[#1E3A8A] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.20),transparent_42%),linear-gradient(0deg,rgba(30,58,138,0.94),rgba(30,58,138,0.94))]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-24 lg:pt-18">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center rounded-full border border-white/25 bg-[#1D4ED8]/45 px-4 py-2 text-sm font-semibold text-[#DBEAFE]">
              AI-POWERED PROCUREMENT & STAFFING
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
              Your place where projects find the right professionals.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#DBEAFE] md:text-lg">
              Simplify how you manage your workforce and contracts under NACE codes. Whether you are a government entity, an enterprise developer, or an independent specialist, RELU AI does the heavy lifting: scoring compatibility, automatically assessing skills through custom tests, and centralizing all your operations inside your digital workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/publish"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2 focus:ring-offset-[#1E3A8A]"
              >
                Publish now
              </Link>
              <Link
                href="/jobs"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/25 transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2 focus:ring-offset-[#1E3A8A]"
              >
                Explore
              </Link>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm font-medium text-[#EFF6FF]">
                  <CircleIcon icon={item.icon} tone="dark" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <HeroDashboard />
        </div>
      </section>

      <QuickActionBoard />

      <section id="how-it-works" className="bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="HOW OPENSTAFF WORKS"
            title="One operational flow from demand discovery to monitored delivery."
            description="OpenStaff connects public opportunity discovery, AI-assisted skill matching, secure coordination, and live operational visibility."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-[#DBEAFE] bg-white p-6 shadow-sm shadow-blue-100/40">
                <div className="flex items-center justify-between">
                  <CircleIcon icon={step.icon} tone="light" />
                  <span className="text-sm font-semibold text-[#94A3B8]">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#1E293B]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#64748B]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="GLOBAL DOMAINS"
            title="Explore work by industry domain."
            description="Browse structured project demand and specialist availability across high-mobility operational sectors."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categoryDomains.map((domain) => (
              <Link
                key={domain.label}
                href={domain.href}
                className="group flex min-h-32 flex-col items-center justify-center rounded-2xl border border-[#DBEAFE] bg-white px-4 py-6 text-center shadow-sm shadow-blue-100/40 transition hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8] transition group-hover:bg-white">
                  <CategoryIcon icon={domain.icon} />
                </span>
                <span className="mt-4 text-sm font-semibold text-[#334155]">{domain.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              align="left"
              badge="APPROVED PROJECT FEED"
              title="Projects open for delivery"
              description="Approved marketplace demand ready for specialist review, capability matching, and compliant execution planning."
            />
            <Link
              href="/jobs"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2"
            >
              View all projects
            </Link>
          </div>

          <div className="mt-10">
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-72 rounded-2xl border border-[#DBEAFE] bg-white shadow-sm">
                    <div className="h-full animate-pulse rounded-2xl bg-[linear-gradient(90deg,#F8FAFC,#DBEAFE,#F8FAFC)]" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-sm text-[#991B1B]">{error}</div>
            ) : visibleProjects.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleProjects.map((project) => (
                  <JobCard key={project.id} {...project} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#DBEAFE] bg-white p-8 text-center text-[#64748B]">
                Approved project opportunities will appear here as soon as they are available.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              align="left"
              badge="VERIFIED NETWORK"
              title="Companies and professionals ready for structured work."
              description="Review approved public profiles with domain, taxonomy, and regional context before making contact."
            />
            <Link
              href="/professionals"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#BFDBFE] bg-white px-5 py-3 text-sm font-semibold text-[#1E3A8A] transition hover:border-[#2563EB] hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
            >
              View profiles
            </Link>
          </div>

          <div className="mt-10">
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-72 rounded-2xl border border-[#DBEAFE] bg-white shadow-sm">
                    <div className="h-full animate-pulse rounded-2xl bg-[linear-gradient(90deg,#F8FAFC,#DBEAFE,#F8FAFC)]" />
                  </div>
                ))}
              </div>
            ) : visibleProfessionals.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {visibleProfessionals.map((actor) => (
                  <ActorCard key={actor.id} {...actor} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#DBEAFE] bg-white p-8 text-center text-[#64748B]">
                Approved company and professional profiles will appear here after moderation.
              </div>
            )}
          </div>
        </div>
      </section>

      <GeminiChatbot />
    </div>
  );
}

function HeroDashboard() {
  return (
    <div className="relative min-h-[520px] min-w-0 overflow-hidden lg:min-h-[560px]">
      <div className="absolute inset-x-6 top-10 mx-auto h-80 max-w-md rounded-full border border-[#93C5FD]/35 bg-[#1D4ED8]/25" />
      <div className="relative mx-auto flex h-full w-full min-w-0 max-w-xl items-center justify-center">
        <div className="w-full min-w-0 rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl shadow-blue-950/35 backdrop-blur">
          <div className="rounded-[1.5rem] border border-[#DBEAFE] bg-[#F8FAFC] p-5 text-[#1E293B] shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#64748B]">OpenStaff workspace</p>
                <h2 className="mt-1 text-2xl font-bold text-[#172554]">Global delivery cockpit</h2>
              </div>
              <span className="rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-semibold text-[#047857]">LIVE</span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MetricCard label="Active Projects" value="128" delta="+18%" />
              <MetricCard label="Industries covered" value="32" delta="NACE mapped" />
            </div>

            <div className="mt-4 rounded-2xl border border-[#DBEAFE] bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#64748B]">AI Match Score</p>
                  <p className="mt-1 text-sm text-[#047857]">Excellent Match</p>
                </div>
                <div className="relative h-24 w-24">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="40" stroke="#E2E8F0" strokeWidth="10" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10B981"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="251"
                      strokeDashoffset="20"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-[#172554]">92%</div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#DBEAFE] bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#64748B]">Verified Specialists</p>
                  <p className="mt-1 text-2xl font-bold text-[#172554]">24,350</p>
                </div>
                <div className="flex -space-x-2">
                  {["OS", "AI", "EU", "RO", "UK"].map((label) => (
                    <span
                      key={label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#DBEAFE] text-xs font-bold text-[#1D4ED8]"
                    >
                      {label}
                    </span>
                  ))}
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#10B981] text-sm font-bold text-white">
                    +
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#DBEAFE] bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#64748B]">Procurement pulse</p>
                  <p className="mt-1 text-sm text-[#64748B]">Compatibility, tests, and contracts in one view</p>
                </div>
                <MiniChart />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-0 top-24 hidden rounded-2xl border border-[#DBEAFE] bg-white p-4 text-[#1E293B] shadow-2xl lg:block">
          <p className="text-xs font-semibold text-[#64748B]">Tests completed</p>
          <p className="mt-1 text-2xl font-bold text-[#172554]">8,940</p>
        </div>
        <div className="absolute bottom-16 right-0 hidden rounded-2xl border border-[#DBEAFE] bg-white p-4 text-[#1E293B] shadow-2xl lg:block">
          <p className="text-xs font-semibold text-[#64748B]">Secure contracting</p>
          <p className="mt-1 text-sm font-semibold text-[#047857]">Ready for review</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-2xl border border-[#DBEAFE] bg-white p-4">
      <p className="text-sm font-semibold text-[#64748B]">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-3xl font-bold text-[#172554]">{value}</span>
        <span className="rounded-full bg-[#D1FAE5] px-2 py-1 text-xs font-semibold text-[#047857]">{delta}</span>
      </div>
    </div>
  );
}

function QuickActionBoard() {
  return (
    <section className="relative z-10 -mt-8 bg-[#F8FAFC] px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-xl shadow-blue-100/70 md:grid-cols-[1.5fr_1fr] md:p-7">
        <div>
          <div className="flex items-center gap-3">
            <CircleIcon icon="briefcase" tone="light" />
            <h2 className="text-xl font-bold text-[#172554]">Business & Operations</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {operationsLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex min-h-20 flex-col items-start justify-center rounded-2xl border border-[#DBEAFE] bg-white px-4 py-3 text-sm font-semibold text-[#334155] transition hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
              >
                <CircleIcon icon={link.icon} tone="compact" />
                <span className="mt-3">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#DBEAFE] bg-[#F8FAFC] p-5">
          <div className="flex items-center gap-3">
            <CircleIcon icon="phone" tone="light" />
            <div>
              <h2 className="text-xl font-bold text-[#172554]">Quick Contact</h2>
              <p className="mt-1 text-sm text-[#64748B]">Get in touch with our team</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <a
              href="mailto:info@openstaff.eu"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2"
            >
              Contact Us
            </a>
            <a
              href="mailto:info@openstaff.eu"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#BFDBFE] bg-white px-4 py-3 text-sm font-semibold text-[#1D4ED8] transition hover:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
            >
              info@openstaff.eu
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  badge,
  title,
  description,
  align = "center",
}: {
  badge: string;
  title: string;
  description: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div className="inline-flex rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-bold text-[#1E3A8A]">{badge}</div>
      <h2 className="mt-4 text-3xl font-bold leading-tight text-[#172554] md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[#64748B]">{description}</p>
    </div>
  );
}

function CircleIcon({ icon, tone }: { icon: string; tone: "dark" | "light" | "compact" }) {
  const classes =
    tone === "dark"
      ? "h-8 w-8 bg-[#1D4ED8]/55 text-[#DBEAFE] border-white/20"
      : tone === "compact"
        ? "h-8 w-8 bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]"
        : "h-12 w-12 bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]";

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border ${classes}`}>
      <Icon name={icon} />
    </span>
  );
}

function CategoryIcon({ icon }: { icon: string }) {
  return <Icon name={icon} />;
}

function Icon({ name }: { name: string }) {
  const common = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  switch (name) {
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M10 17h4V5H2v12h3" />
          <path d="M14 8h4l4 4v5h-3" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M20.6 13.5 13.5 20.6a2 2 0 0 1-2.8 0L3 12.9V3h9.9l7.7 7.7a2 2 0 0 1 0 2.8Z" />
          <circle cx="7.5" cy="7.5" r="1" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
          <path d="m19 15 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 15Z" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "bars":
      return (
        <svg {...common}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20V8" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "factory":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V9l5 3V9l5 3V6h4v15" />
        </svg>
      );
    case "build":
      return (
        <svg {...common}>
          <path d="M4 21V5a2 2 0 0 1 2-2h8v18" />
          <path d="M14 9h4a2 2 0 0 1 2 2v10" />
          <path d="M8 7h2M8 11h2M8 15h2" />
        </svg>
      );
    case "hospitality":
      return (
        <svg {...common}>
          <path d="M7 2v20" />
          <path d="M11 2v8a4 4 0 0 1-8 0V2" />
          <path d="M17 2v20" />
          <path d="M17 2c2.8 2.3 4 5 4 8h-4" />
        </svg>
      );
    case "server":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="6" rx="2" />
          <rect x="3" y="14" width="18" height="6" rx="2" />
          <path d="M7 7h.01M7 17h.01" />
        </svg>
      );
    case "energy":
      return (
        <svg {...common}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
        </svg>
      );
    case "logistics":
      return (
        <svg {...common}>
          <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z" />
          <path d="M3.3 7 12 12l8.7-5" />
          <path d="M12 22V12" />
        </svg>
      );
    case "aviation":
      return (
        <svg {...common}>
          <path d="M2 16 22 7l-6 14-4-6-6-1 5-3" />
        </svg>
      );
    case "robotics":
      return (
        <svg {...common}>
          <rect x="6" y="7" width="12" height="10" rx="2" />
          <path d="M12 7V3" />
          <path d="M8 12h.01M16 12h.01" />
          <path d="M9 17v3M15 17v3" />
          <path d="M4 11H2M22 11h-2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

function MiniChart() {
  return (
    <svg className="h-16 w-28 text-[#2563EB]" viewBox="0 0 112 64" fill="none" aria-hidden="true">
      <path d="M2 50 C18 48 20 37 34 39 C48 42 48 22 62 24 C74 26 73 14 84 16 C96 18 96 8 110 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M2 58h108" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
      <circle cx="84" cy="16" r="4" fill="#10B981" />
    </svg>
  );
}
