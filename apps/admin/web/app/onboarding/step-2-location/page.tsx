"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useOnboardingState } from "@/lib/onboarding";

const regions = [
  "AB", "AR", "AG", "BC", "BH", "BN", "BT", "BR", "BV", "B", "BZ", "CS", "CL", "CJ", "CT", "CV", "DB", "DJ",
  "GL", "GR", "GJ", "HR", "HD", "IL", "IS", "IF", "MM", "MH", "MS", "NT", "OT", "PH", "SM", "SJ", "SB", "SV",
  "TR", "TM", "TL", "VS", "VL", "VN", "Internațional",
];

export default function OnboardingStep2Page() {
  const router = useRouter();
  const { ready, state, setPartial } = useOnboardingState();
  const [regionCode, setRegionCode] = useState(state.regionCode);
  const [vatNumber, setVatNumber] = useState(state.vatNumber);

  const isVatValid = useMemo(() => !vatNumber || /^RO\d{2,10}$/i.test(vatNumber), [vatNumber]);

  if (!ready) {
    return null;
  }

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 18 }}>
        <label>
          <div style={{ color: "#1B2A6B", fontWeight: 700, marginBottom: 8 }}>Județ / regiune</div>
          <select
            value={regionCode}
            onChange={(event) => setRegionCode(event.target.value)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
          >
            <option value="">Selectează regiunea</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div style={{ color: "#1B2A6B", fontWeight: 700, marginBottom: 8 }}>CUI / VAT</div>
          <input
            value={vatNumber}
            onChange={(event) => setVatNumber(event.target.value.toUpperCase())}
            placeholder="RO12345678"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
          />
          {!isVatValid ? (
            <div style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>
              Format valid: `RO` urmat de 2 până la 10 cifre.
            </div>
          ) : null}
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button
          onClick={() => router.push("/onboarding/step-1-type")}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E8EBF5", background: "white" }}
        >
          Înapoi
        </button>
        <button
          onClick={() => {
            setPartial({ regionCode, vatNumber });
            router.push("/onboarding/step-3-classification");
          }}
          disabled={!regionCode || !isVatValid}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#1B2A6B",
            color: "white",
            opacity: !regionCode || !isVatValid ? 0.5 : 1,
          }}
        >
          Continuă
        </button>
      </div>
    </section>
  );
}
