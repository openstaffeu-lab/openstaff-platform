"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ONBOARDING_STEPS } from "@/lib/onboarding";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    ONBOARDING_STEPS.findIndex((step) => step.path === pathname),
  );
  const progress = ((currentIndex + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 64px" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 24, border: "1px solid #E8EBF5", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ color: "#00C060", fontWeight: 700, fontSize: 13 }}>Onboarding OpenStaff</div>
            <h1 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: "6px 0 0" }}>Configurare cont</h1>
          </div>
          <Link href="/" style={{ color: "#1B2A6B", textDecoration: "none", fontWeight: 700 }}>
            Ieșire
          </Link>
        </div>

        <div style={{ height: 10, background: "#E8EBF5", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #00E87A 0%, #1B2A6B 100%)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
          {ONBOARDING_STEPS.map((step, index) => (
            <div key={step.path} style={{ color: index <= currentIndex ? "#1B2A6B" : "#94A3B8", fontSize: 12, fontWeight: 700 }}>
              {index + 1}. {step.label}
            </div>
          ))}
        </div>
      </div>

      {children}
    </main>
  );
}
