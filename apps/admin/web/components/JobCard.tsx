"use client";

import Link from "next/link";
import type { MarketplacePost } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  LIVE: "#00E87A",
  PENDING: "#F59E0B",
  OFFLINE: "#8892B0",
  CLOSED: "#EF4444",
  WARRANTY: "#3B82F6",
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
  const statusColor = STATUS_COLORS[status ?? "LIVE"] ?? "#8892B0";
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
      ? "Strong Fit"
      : reluMatch >= 72
        ? "Good Fit"
        : "Requires Additional Certifications";

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        border: "1px solid #E8EBF5",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <span
          style={{
            background: "#1B2A6B",
            color: "white",
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {domain || "Marketplace Project"}
        </span>
        <span
          style={{
            background: `${statusColor}20`,
            color: statusColor,
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {status || "LIVE"}
        </span>
      </div>

      <h3 style={{ color: "#1B2A6B", fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>

      <div style={{ color: "#8892B0", fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {location ? <span>📍 {location}</span> : null}
        {naceCodes?.[0] ? <span>NACE {naceCodes[0]}</span> : null}
        {createdAt ? <span>{new Date(createdAt).toLocaleDateString("ro-RO")}</span> : null}
      </div>

      {budgetLabel ? (
        <div style={{ color: "#00E87A", fontWeight: 800, fontSize: 20 }}>{budgetLabel}</div>
      ) : null}

      <div
        style={{
          border: "1px solid #D6F5E5",
          background: "#F0FDF7",
          borderRadius: 10,
          padding: 12,
          display: "grid",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ color: "#0F766E" }}>{reluMatch}% Match</strong>
          <span style={{ color: "#166534", fontSize: 12, fontWeight: 700 }}>{reluFit}</span>
        </div>
        <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.5 }}>
          RELU Flash: duration 2-8 weeks, contract risk {budgetLabel ? "low" : "medium"},
          certifications {naceCodes?.[0] ? `NACE ${naceCodes[0]}` : "pending validation"}.
        </div>
      </div>

      {ownerName ? (
        <div style={{ color: "#8892B0", fontSize: 12 }}>
          Postat de: <span style={{ color: "#1B2A6B", fontWeight: 600 }}>{ownerName}</span>
        </div>
      ) : null}

      <Link
        href={`/jobs/${id}`}
        prefetch={false}
        style={{
          display: "block",
          textAlign: "center",
          background: "#1B2A6B",
          color: "white",
          padding: "10px 0",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 14,
          marginTop: "auto",
        }}
      >
        Vezi detalii
      </Link>
    </div>
  );
}
