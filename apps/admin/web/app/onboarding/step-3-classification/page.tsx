"use client";

import { useRouter } from "next/navigation";
import EscoMultiSelect from "@/components/EscoMultiSelect";
import NaceSearchInput from "@/components/NaceSearchInput";
import { useOnboardingState } from "@/lib/onboarding";

export default function OnboardingStep3Page() {
  const router = useRouter();
  const { ready, state, setPartial } = useOnboardingState();

  if (!ready) {
    return null;
  }

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 20 }}>
        <div>
          <div style={{ color: "#1B2A6B", fontWeight: 700, marginBottom: 8 }}>Cod NACE principal</div>
          <NaceSearchInput
            value={
              state.naceCode && state.naceDescription
                ? `${state.naceCode} — ${state.naceDescription}`
                : state.naceCode
            }
            onChange={(code, description) => setPartial({ naceCode: code, naceDescription: description })}
          />
        </div>

        <div>
          <div style={{ color: "#1B2A6B", fontWeight: 700, marginBottom: 8 }}>Ocupații ESCO</div>
          <EscoMultiSelect
            value={state.escoOccupations}
            onChange={(escoOccupations) => setPartial({ escoOccupations })}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button
          onClick={() => router.push("/onboarding/step-2-location")}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E8EBF5", background: "white" }}
        >
          Înapoi
        </button>
        <button
          onClick={() => router.push("/onboarding/step-4-profile")}
          style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#1B2A6B", color: "white" }}
        >
          Continuă
        </button>
      </div>
    </section>
  );
}
