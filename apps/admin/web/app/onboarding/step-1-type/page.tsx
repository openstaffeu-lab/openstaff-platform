"use client";

import { useRouter } from "next/navigation";
import { useOnboardingState } from "@/lib/onboarding";

const options = [
  { key: "INDIVIDUAL", title: "Individual", description: "Liber profesionist, tehnician sau contractor independent." },
  { key: "COMPANY", title: "Companie", description: "Firmă care aplică la proiecte sau publică joburi." },
  { key: "PUBLIC_INSTITUTION", title: "Instituție", description: "Instituție publică sau entitate non-profit." },
];

export default function OnboardingStep1Page() {
  const router = useRouter();
  const { ready, state, setPartial } = useOnboardingState();

  if (!ready) {
    return null;
  }

  return (
    <section style={{ display: "grid", gap: 18 }}>
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => {
            setPartial({ actorType: option.key as any });
            router.push("/onboarding/step-2-location");
          }}
          style={{
            textAlign: "left",
            background: "white",
            borderRadius: 18,
            border: state.actorType === option.key ? "2px solid #00E87A" : "1px solid #E8EBF5",
            padding: 24,
          }}
        >
          <div style={{ color: "#1B2A6B", fontSize: 24, fontWeight: 800 }}>{option.title}</div>
          <div style={{ color: "#64748B", marginTop: 8 }}>{option.description}</div>
        </button>
      ))}
    </section>
  );
}
