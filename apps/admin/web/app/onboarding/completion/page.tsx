"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingMe, updateOnboardingStep } from "@/lib/api";
import { useOnboardingState } from "@/lib/onboarding";

export default function OnboardingCompletionPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { ready, reset } = useOnboardingState();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getOnboardingMe>> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    let cancelled = false;

    async function load() {
      const nextSnapshot = await getOnboardingMe(token);
      if (!cancelled) {
        setSnapshot(nextSnapshot);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  if (!ready || !snapshot) {
    return null;
  }

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 18 }}>
        <div>
          <div style={{ color: "#00C060", fontWeight: 700, fontSize: 13 }}>Profile completion</div>
          <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: "6px 0 0" }}>
            Identity foundation ready
          </h2>
        </div>

        <div style={{ display: "grid", gap: 12, color: "#334155" }}>
          <div><strong>Display name:</strong> {snapshot.identityProfile.displayName}</div>
          <div><strong>Public slug:</strong> /profiles/{snapshot.identityProfile.publicSlug}</div>
          <div><strong>Verification:</strong> {snapshot.identityProfile.verificationStatus}</div>
          <div><strong>Completion:</strong> {snapshot.completionPercent}%</div>
          <div><strong>Current step:</strong> {snapshot.onboardingSession.currentStep}</div>
          <div><strong>Completed steps:</strong> {snapshot.onboardingSession.completedSteps.join(", ") || "none"}</div>
          <div><strong>Company:</strong> {snapshot.companyProfile?.companyName ?? "not added"}</div>
        </div>

        <div
          style={{
            borderRadius: 16,
            background: "#F8FAFC",
            border: "1px solid #E8EBF5",
            padding: 16,
            color: "#1E293B",
          }}
        >
          Profilul public nu expune email, billing, tokenuri sau metadata private. Acesta este
          stratul pregatit pentru marketplace si extensii viitoare de compliance.
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => router.push("/onboarding/company")} style={secondaryButton}>
            Inapoi
          </button>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href={`/profiles/${snapshot.identityProfile.publicSlug}`}
              style={{
                ...secondaryButton,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Vezi profilul public
            </Link>
            <button
              onClick={async () => {
                if (!token) {
                  return;
                }

                setSaving(true);
                try {
                  await updateOnboardingStep(
                    {
                      currentStep: "completion",
                      completedStep: "completion",
                      status: "COMPLETED",
                    },
                    token,
                  );
                  reset();
                  router.push("/dashboard");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              style={primaryButton}
            >
              {saving ? "Se finalizeaza..." : "Finalizeaza onboarding"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const primaryButton: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#00E87A",
  color: "#1B2A6B",
  fontWeight: 700,
};

const secondaryButton: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #E8EBF5",
  background: "white",
  color: "#1B2A6B",
};
