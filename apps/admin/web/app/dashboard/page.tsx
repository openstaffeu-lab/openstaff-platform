"use client";

import Link from "next/link";

export default function PublicDashboardPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 64px" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid #E8EBF5" }}>
        <h1 style={{ color: "#1B2A6B", fontSize: 32, fontWeight: 800, margin: "0 0 10px" }}>Dashboard OpenStaff</h1>
        <p style={{ color: "#64748B", lineHeight: 1.7 }}>
          Onboarding-ul a fost finalizat. Poți continua către profilul tău operațional sau către joburile live.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <Link href="/profile" style={{ padding: "12px 18px", background: "#1B2A6B", color: "white", borderRadius: 10, textDecoration: "none" }}>
            Deschide profilul
          </Link>
          <Link href="/jobs" style={{ padding: "12px 18px", background: "#00E87A", color: "#1B2A6B", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
            Vezi joburile live
          </Link>
        </div>
      </div>
    </main>
  );
}
