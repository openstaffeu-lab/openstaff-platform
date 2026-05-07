"use client";

import Link from "next/link";
import type { MarketplacePost } from "@/lib/api";

export default function ActorCard({
  id,
  title,
  ownerType,
  naceCodes,
  experienceLabel,
  location,
  mediaAssets,
}: Partial<MarketplacePost>) {
  const initial = (title || "?").slice(0, 1).toUpperCase();
  const portrait = mediaAssets?.find((item) => item.role === "PHOTO" || item.role === "GALLERY");

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1.5px solid #00E87A",
      }}
    >
      {portrait?.assetUrl ? (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundImage: `url(${portrait.assetUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            marginBottom: 12,
          }}
        />
      ) : (
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
          {initial}
        </div>
      )}

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
        ✓ MARKETPLACE VERIFIED
      </span>

      <h3 style={{ color: "#1B2A6B", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
        {title}
      </h3>

      {naceCodes?.[0] ? (
        <div style={{ color: "#00C060", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          NACE {naceCodes[0]}
        </div>
      ) : null}

      <div style={{ color: "#8892B0", fontSize: 12, marginBottom: 12 }}>
        {experienceLabel || ownerType || "Available for marketplace opportunities"}
        {location ? ` · ${location}` : ""}
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
