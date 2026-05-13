"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingMe, updateOnboardingStep, upsertCompanyProfile } from "@/lib/api";
import { useOnboardingState } from "@/lib/onboarding";

export default function OnboardingCompanyPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { ready, state, setPartial } = useOnboardingState();
  const [form, setForm] = useState({
    companyName: "",
    legalName: "",
    registrationNumber: "",
    vatId: "",
    country: "Romania",
    city: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    let cancelled = false;

    async function load() {
      const snapshot = await getOnboardingMe(token);
      if (cancelled) {
        return;
      }

      setForm({
        companyName: snapshot.companyProfile?.companyName ?? state.companyName ?? "",
        legalName: snapshot.companyProfile?.legalName ?? "",
        registrationNumber: snapshot.companyProfile?.registrationNumber ?? "",
        vatId: snapshot.companyProfile?.vatId ?? state.companyCui ?? "",
        country: snapshot.companyProfile?.country ?? state.countryCode ?? "Romania",
        city: snapshot.companyProfile?.city ?? "",
        addressLine1: snapshot.companyProfile?.addressLine1 ?? "",
        addressLine2: snapshot.companyProfile?.addressLine2 ?? "",
        postalCode: snapshot.companyProfile?.postalCode ?? "",
        website: snapshot.companyProfile?.website ?? state.website ?? "",
      });
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, state.companyCui, state.companyName, state.countryCode, state.website, token]);

  if (!ready) {
    return null;
  }

  const companyRequired = user?.actorType !== "INDIVIDUAL";

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 16 }}>
        <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: 0 }}>Company identity</h2>
        <p style={{ color: "#334155", margin: 0 }}>
          Pentru conturi individuale poti sari peste acest pas. Pentru companii si institutii,
          acest strat va alimenta viitoarele directoare publice si extensii KYC.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} placeholder="Company name" style={inputStyle} />
          <input value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} placeholder="Legal name" style={inputStyle} />
          <input value={form.registrationNumber} onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))} placeholder="Registration number" style={inputStyle} />
          <input value={form.vatId} onChange={(event) => setForm((current) => ({ ...current, vatId: event.target.value }))} placeholder="VAT ID" style={inputStyle} />
          <input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder="Country" style={inputStyle} />
          <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="City" style={inputStyle} />
          <input value={form.addressLine1} onChange={(event) => setForm((current) => ({ ...current, addressLine1: event.target.value }))} placeholder="Address line 1" style={inputStyle} />
          <input value={form.addressLine2} onChange={(event) => setForm((current) => ({ ...current, addressLine2: event.target.value }))} placeholder="Address line 2" style={inputStyle} />
          <input value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} placeholder="Postal code" style={inputStyle} />
          <input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} placeholder="Website URL" style={inputStyle} />
        </div>

        {error ? <div style={{ color: "#DC2626" }}>{error}</div> : null}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => router.push("/onboarding/identity")} style={secondaryButton}>
            Inapoi
          </button>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {!companyRequired ? (
              <button
                onClick={async () => {
                  if (!token) {
                    return;
                  }

                  await updateOnboardingStep(
                    {
                      currentStep: "completion",
                      completedStep: "company",
                      status: "SKIPPED",
                    },
                    token,
                  );
                  setPartial({ currentStep: "completion" });
                  router.push("/onboarding/completion");
                }}
                style={secondaryButton}
              >
                Skip
              </button>
            ) : null}

            <button
              onClick={async () => {
                if (!token) {
                  router.push("/login");
                  return;
                }

                if (!form.companyName.trim()) {
                  setError("Company name este obligatoriu pentru acest pas.");
                  return;
                }

                setSaving(true);
                setError("");

                try {
                  await upsertCompanyProfile(form, token);
                  await updateOnboardingStep(
                    {
                      currentStep: "completion",
                      completedStep: "company",
                    },
                    token,
                  );
                  setPartial({
                    companyName: form.companyName,
                    companyCui: form.vatId,
                    website: form.website,
                    currentStep: "completion",
                  });
                  router.push("/onboarding/completion");
                } catch (saveError) {
                  setError(
                    saveError instanceof Error
                      ? saveError.message
                      : "Nu am putut salva company profile.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              style={primaryButton}
            >
              {saving ? "Se salveaza..." : "Continua"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #E8EBF5",
};

const primaryButton: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#1B2A6B",
  color: "white",
};

const secondaryButton: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #E8EBF5",
  background: "white",
};
