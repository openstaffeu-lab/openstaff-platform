"use client";

import Link from "next/link";

export default function ActorCard({
  id,
  displayName,
  naceCode,
  naceDescription,
  rating,
  reviewCount,
  experienceYears,
  isVerified,
  regionCode,
}: any) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: isVerified ? "1.5px solid #00E87A" : "1px solid #E8EBF5",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#1B2A6B",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        {displayName?.[0]?.toUpperCase() || "?"}
      </div>

      {isVerified ? (
        <span
          style={{
            background: "#00E87A20",
            color: "#00C060",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 4,
            display: "inline-block",
            marginBottom: 8,
          }}
        >
          ✓ VERIFIED CONTRACTOR PARTNER
        </span>
      ) : null}

      <h3 style={{ color: "#1B2A6B", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
        {displayName}
      </h3>

      {naceCode ? (
        <div style={{ color: "#00C060", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          NACE {naceCode} · {naceDescription || ""}
        </div>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= Math.round(rating || 0) ? "#00E87A" : "#E2E8F0",
              fontSize: 14,
            }}
          >
            ★
          </span>
        ))}
        <span style={{ color: "#8892B0", fontSize: 12 }}>({reviewCount || 0})</span>
      </div>

      <div style={{ color: "#8892B0", fontSize: 12, marginBottom: 12 }}>
        {experienceYears ? `${experienceYears} ani experiență` : ""}
        {regionCode ? ` · ${regionCode}` : ""}
      </div>

      <Link
        href={`/professionals/${id}`}
        style={{
          display: "block",
          textAlign: "center",
          border: "2px solid #1B2A6B",
          color: "#1B2A6B",
          padding: "8px 0",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        Vezi profil
      </Link>
    </div>
  );
}
