"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createActorProfile } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useOnboardingState } from "@/lib/onboarding";

export default function OnboardingStep5Page() {
  const router = useRouter();
  const { token } = useAuth();
  const { ready, state, reset } = useOnboardingState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!ready) {
    return null;
  }

  const payload: Record<string, unknown> = {
    actorType: state.actorType,
    displayName: state.displayName || state.companyName || "OpenStaff User",
    email: state.email || undefined,
    phone: state.phone || undefined,
    regionCode: state.regionCode || undefined,
    countryCode: state.countryCode,
    languageCode: state.languageCode,
    vatNumber: state.vatNumber || undefined,
    naceCode: state.naceCode || undefined,
    naceDescription: state.naceDescription || undefined,
    escoOccupations: state.escoOccupations,
    bio: state.bio || undefined,
    experienceYears: state.experienceYears ? Number(state.experienceYears) : undefined,
    onboardingStep: 5,
    onboardingDone: true,
    companyProfile:
      state.actorType === "INDIVIDUAL"
        ? undefined
        : {
            name: state.companyName || state.displayName || "OpenStaff Company",
            legalType: state.companyLegalType,
            cui: state.companyCui || state.vatNumber || "RO00000000",
            administrator: state.companyAdministrator || undefined,
            ciFileUrl: state.ciFileUrl || undefined,
            cazierUrl: state.cazierUrl || undefined,
          },
  };

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: "0 0 18px" }}>Confirmare profil</h2>
      <div style={{ display: "grid", gap: 10, color: "#334155" }}>
        <div><strong>Tip:</strong> {state.actorType}</div>
        <div><strong>Nume:</strong> {state.displayName || state.companyName}</div>
        <div><strong>Email:</strong> {state.email || "n/a"}</div>
        <div><strong>Regiune:</strong> {state.regionCode || "n/a"}</div>
        <div><strong>NACE:</strong> {state.naceCode || "n/a"} {state.naceDescription ? `— ${state.naceDescription}` : ""}</div>
        <div><strong>ESCO:</strong> {state.escoOccupations.join(", ") || "n/a"}</div>
        <div><strong>CI upload:</strong> {state.ciFileUrl || "neîncărcat"}</div>
        <div><strong>Cazier upload:</strong> {state.cazierUrl || "neîncărcat"}</div>
      </div>

      {error ? <div style={{ marginTop: 16, color: "#EF4444" }}>{error}</div> : null}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button
          onClick={() => router.push("/onboarding/step-4-profile")}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E8EBF5", background: "white" }}
        >
          Înapoi
        </button>
        <button
          onClick={async () => {
            setSaving(true);
            setError("");
            try {
              await createActorProfile(payload, token);
              reset();
              router.push("/dashboard");
            } catch (saveError) {
              setError(saveError instanceof Error ? saveError.message : "Nu am putut salva profilul.");
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#00E87A", color: "#1B2A6B", fontWeight: 700 }}
        >
          {saving ? "Se salvează..." : "Finalizează"}
        </button>
      </div>
    </section>
  );
}
