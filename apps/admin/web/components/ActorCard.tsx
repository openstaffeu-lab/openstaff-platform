"use client";

import Link from "next/link";
import { getApiUrl, type MarketplacePost } from "@/lib/api";

function resolveAssetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${getApiUrl()}${value.startsWith("/") ? value : `/${value}`}`;
}

export default function ActorCard({
  id,
  title,
  domain,
  ownerType,
  naceCodes,
  experienceLabel,
  location,
  mediaAssets,
}: Partial<MarketplacePost>) {
  const initial = (title || "?").slice(0, 1).toUpperCase();
  const portrait = mediaAssets?.find((item) => item.role === "PHOTO" || item.role === "GALLERY");
  const portraitUrl = resolveAssetUrl(portrait?.assetUrl);
  const taxonomy = naceCodes?.[0] ? `NACE ${naceCodes[0]}` : domain || ownerType || "Marketplace profile";
  const summary = [experienceLabel || ownerType, location].filter(Boolean).join(" | ");

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        {portraitUrl ? (
          <div
            className="h-16 w-16 rounded-2xl border border-[#E2E8F0] bg-cover bg-center"
            style={{ backgroundImage: `url(${portraitUrl})` }}
            aria-hidden="true"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F172A] text-2xl font-black text-white">
            {initial}
          </div>
        )}
        <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#15803D]">
          Approved profile
        </span>
      </div>

      <h3 className="mt-5 text-lg font-bold leading-6 text-[#1E293B]">{title || "Verified profile"}</h3>

      <div className="mt-4 grid gap-2 text-sm text-[#64748B]">
        <span className="rounded-xl bg-[#F8FAFC] px-3 py-2 font-semibold text-[#334155]">{taxonomy}</span>
        {summary ? <span className="leading-6">{summary}</span> : null}
      </div>

      <Link
        href={`/professionals/${id}`}
        prefetch={false}
        className="mt-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm font-bold text-[#1E293B] transition hover:border-[#2563EB] hover:text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
      >
        View profile
      </Link>
    </article>
  );
}
