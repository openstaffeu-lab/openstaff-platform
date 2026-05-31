"use client";

import Link from "next/link";
import type { MarketplacePost } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  LIVE: "LIVE",
  PENDING: "PENDING",
  OFFLINE: "OFFLINE",
  CLOSED: "CLOSED",
  WARRANTY: "WARRANTY",
};

export default function JobCard({
  id,
  title,
  domain,
  location,
  budgetMin,
  budgetMax,
  currencyCode,
  status,
  naceCodes,
  createdAt,
  ownerName,
}: Partial<MarketplacePost>) {
  const budgetLabel =
    typeof budgetMin === "number" || typeof budgetMax === "number"
      ? `${currencyCode || "EUR"} ${[
          typeof budgetMin === "number" ? Number(budgetMin).toLocaleString("ro-RO") : null,
          typeof budgetMax === "number" ? Number(budgetMax).toLocaleString("ro-RO") : null,
        ]
          .filter(Boolean)
          .join(" - ")}`
      : null;
  const taxonomyCount = naceCodes?.length ?? 0;
  const reluMatch = Math.min(
    95,
    58 + (budgetLabel ? 10 : 0) + (location ? 9 : 0) + Math.min(18, taxonomyCount * 6),
  );
  const reluFit =
    reluMatch >= 86
      ? "Strong fit"
      : reluMatch >= 72
        ? "Good fit"
        : "Review needed";
  const statusLabel = STATUS_LABELS[status ?? "LIVE"] ?? status ?? "LIVE";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#92400E]">
          {domain || "Marketplace Project"}
        </span>
        <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#15803D]">
          {statusLabel}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-bold leading-6 text-[#1E293B]">{title || "Approved project"}</h3>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#64748B]">
        {location ? <span className="rounded-full bg-[#F8FAFC] px-3 py-1">{location}</span> : null}
        {naceCodes?.[0] ? <span className="rounded-full bg-[#F8FAFC] px-3 py-1">NACE {naceCodes[0]}</span> : null}
        {createdAt ? (
          <span className="rounded-full bg-[#F8FAFC] px-3 py-1">
            {new Date(createdAt).toLocaleDateString("ro-RO")}
          </span>
        ) : null}
      </div>

      {budgetLabel ? <div className="mt-5 text-2xl font-black text-[#22C55E]">{budgetLabel}</div> : null}

      <div className="mt-5 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#166534]">AI match score</p>
            <p className="mt-1 text-2xl font-black text-[#22C55E]">{reluMatch}%</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#15803D]">{reluFit}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#475569]">
          RELU signal: delivery fit is based on scope, location, and taxonomy coverage.
        </p>
      </div>

      {ownerName ? (
        <p className="mt-4 text-sm text-[#64748B]">
          Posted by <span className="font-semibold text-[#1E293B]">{ownerName}</span>
        </p>
      ) : null}

      <Link
        href={`/jobs/${id}`}
        prefetch={false}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0F172A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
      >
        Vezi detalii
      </Link>
    </article>
  );
}
