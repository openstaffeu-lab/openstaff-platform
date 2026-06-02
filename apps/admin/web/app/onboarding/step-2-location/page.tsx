"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useOnboardingState } from "@/lib/onboarding";

const regions = [
  "AB", "AR", "AG", "BC", "BH", "BN", "BT", "BR", "BV", "B", "BZ", "CS", "CL", "CJ", "CT", "CV", "DB", "DJ",
  "GL", "GR", "GJ", "HR", "HD", "IL", "IS", "IF", "MM", "MH", "MS", "NT", "OT", "PH", "SM", "SJ", "SB", "SV",
  "TR", "TM", "TL", "VS", "VL", "VN", "International",
];

export default function OnboardingStep2Page() {
  const router = useRouter();
  const { ready, state, setPartial } = useOnboardingState();
  const [regionCode, setRegionCode] = useState(state.regionCode);
  const [vatNumber, setVatNumber] = useState(state.vatNumber);

  const isVatValid = useMemo(() => {
    if (!vatNumber) {
      return true;
    }

    const compact = vatNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    return /^RO\d{2,10}$/.test(compact) || /^[A-Z]{2}[A-Z0-9]{4,14}$/.test(compact);
  }, [vatNumber]);

  if (!ready) {
    return null;
  }

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 18 }}>
        <label>
          <div style={{ color: "#1B2A6B", fontWeight: 700, marginBottom: 8 }}>Judet / regiune</div>
          <select
            value={regionCode}
            onChange={(event) => setRegionCode(event.target.value)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
          >
            <option value="">Selecteaza regiunea</option>
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
            placeholder="RO12345678 or DE123456789"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
          />
          {!isVatValid ? (
            <div style={{ color: "#EF4444", fontSize: 12, marginTop: 8 }}>
              Use a valid Romanian CUI or European VAT format, for example RO12345678 or DE123456789.
            </div>
          ) : null}
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button
          onClick={() => router.push("/onboarding/step-1-type")}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E8EBF5", background: "white" }}
        >
          Inapoi
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
          Continua
        </button>
      </div>
    </section>
  );
}
