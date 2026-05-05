"use client";

import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  LIVE: "#00E87A",
  PENDING_VERIFICATION: "#F59E0B",
  DRAFT: "#8892B0",
  CLOSED: "#EF4444",
  COMPLETED: "#3B82F6",
};

const CATEGORY_LABELS: Record<string, string> = {
  DATA_CENTER: "Data Center",
  PHOTOVOLTAIC: "Fotovoltaic",
  HORECA: "HoReCa",
  ENVIRONMENT: "Mediu",
  CONSTRUCTION: "Construcții",
  PCB_DESIGN: "PCB Design",
  LOGISTICS: "Logistică",
  HEALTHCARE: "Healthcare",
  OTHER: "Altele",
};

export default function JobCard({
  id,
  title,
  category,
  location,
  regionCode,
  budget,
  currency,
  status,
  naceCode,
  createdAt,
  actor,
}: any) {
  const statusColor = STATUS_COLORS[status] ?? "#8892B0";

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
          {CATEGORY_LABELS[category] || category}
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
          {status === "LIVE"
            ? "● LIVE"
            : status === "PENDING_VERIFICATION"
              ? "◐ Verificare"
              : status}
        </span>
      </div>

      <h3 style={{ color: "#1B2A6B", fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>

      <div style={{ color: "#8892B0", fontSize: 13, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {(location || regionCode) && <span>📍 {location || regionCode}</span>}
        {naceCode && <span>NACE {naceCode}</span>}
        {createdAt && <span>{new Date(createdAt).toLocaleDateString("ro-RO")}</span>}
      </div>

      {budget ? (
        <div style={{ color: "#00E87A", fontWeight: 800, fontSize: 20 }}>
          {Number(budget).toLocaleString("ro-RO")} {currency || "RON"}
        </div>
      ) : null}

      {actor ? (
        <div style={{ color: "#8892B0", fontSize: 12 }}>
          Postat de: <span style={{ color: "#1B2A6B", fontWeight: 600 }}>{actor.displayName}</span>
        </div>
      ) : null}

      <Link
        href={`/jobs/${id}`}
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
        Aplică acum
      </Link>
    </div>
  );
}
