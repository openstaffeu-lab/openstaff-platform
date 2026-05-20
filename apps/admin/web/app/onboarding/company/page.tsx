"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getOnboardingMe,
  lookupCompanyProfile,
  updateOnboardingStep,
  upsertCompanyProfile,
  type CompanyLookupResult,
} from "@/lib/api";
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
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState<CompanyLookupResult | null>(null);

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
          For individual accounts you can skip this step. For companies, the fiscal or VAT code can
          prefill legal details before you review and override them manually.
        </p>

        <div
          style={{
            borderRadius: 16,
            background: "#F8FAFC",
            border: "1px solid #E8EBF5",
            padding: 16,
            color: "#334155",
          }}
        >
          Start with the VAT or fiscal code when you have it. OpenStaff will suggest company data
          where possible, explain what was inferred, and still let you edit every field.
        </div>

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

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={async () => {
              setLookingUp(true);
              setError("");

              try {
                const result = await lookupCompanyProfile({
                  fiscalCode: form.vatId,
                  countryCode: (form.country || "RO").slice(0, 2).toUpperCase(),
                });
                setLookup(result);
                setForm((current) => ({
                  ...current,
                  companyName: result.company.companyName ?? current.companyName,
                  legalName: result.company.legalName ?? current.legalName,
                  registrationNumber:
                    result.company.registrationNumber ?? current.registrationNumber,
                  vatId: result.company.vatId ?? current.vatId,
                  country: result.company.country ?? current.country,
                  city: result.company.city ?? current.city,
                  addressLine1: result.company.addressLine1 ?? current.addressLine1,
                  postalCode: result.company.postalCode ?? current.postalCode,
                }));
                setPartial({
                  companyName: result.company.companyName ?? form.companyName,
                  companyCui: result.company.vatId ?? form.vatId,
                });
              } catch (lookupError) {
                setError(
                  lookupError instanceof Error
                    ? lookupError.message
                    : "We could not look up that company automatically.",
                );
              } finally {
                setLookingUp(false);
              }
            }}
            disabled={lookingUp || !form.vatId.trim()}
            style={primaryButton}
          >
            {lookingUp ? "Looking up company..." : "Autofill from fiscal / VAT code"}
          </button>
          <span style={{ alignSelf: "center", color: "#64748B", fontSize: 14 }}>
            Manual edit always stays available after autofill.
          </span>
        </div>

        {lookup ? (
          <div
            style={{
              borderRadius: 16,
              border: "1px solid #E8EBF5",
              background: "#F8FAFC",
              padding: 16,
              color: "#1E293B",
            }}
          >
            <div style={{ fontWeight: 700, color: "#1B2A6B" }}>
              Lookup status: {lookup.lookupStatus}
            </div>
            <div style={{ marginTop: 6 }}>{lookup.explanation}</div>
            <div style={{ marginTop: 10, fontSize: 14, color: "#475569" }}>
              Provider: {lookup.provider} · Verification: {lookup.verificationStatus} · Normalized
              code: {lookup.normalizedFiscalCode || "-"}
            </div>
          </div>
        ) : null}

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
