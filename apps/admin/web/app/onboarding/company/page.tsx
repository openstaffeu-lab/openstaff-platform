"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocationAutocomplete } from "@/components/location/LocationAutocomplete";
import { useAuth } from "@/context/AuthContext";
import {
  getOnboardingMe,
  lookupCompanyProfile,
  updateOnboardingStep,
  upsertCompanyProfile,
  type CompanyLookupResult,
} from "@/lib/api";
import type { OpenStaffLocationSuggestion } from "@/lib/location/location-types";
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
  const [selectedLocation, setSelectedLocation] =
    useState<OpenStaffLocationSuggestion | null>(null);

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
  const canContinue = !companyRequired || form.companyName.trim().length > 0;

  function updateField<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 16 }}>
        <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: 0 }}>Company identity</h2>
        <p style={{ color: "#334155", margin: 0 }}>
          For companies, add the business name first, then use fiscal or VAT lookup when it helps.
          Every lookup value is a suggestion you can review, change, or ignore before continuing.
        </p>

        <div style={releaseNoteStyle}>
          Company name is required for company accounts. Fiscal or VAT lookup, legal details,
          website, and address details are optional helpers, and manual setup remains available if
          lookup or AI assistance is unavailable.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <CompanyField label="Company name" required={companyRequired} helper="The public-facing business name shown in OpenStaff.">
            <input value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} placeholder="Example: OpenStaff Construction SRL" style={inputStyle} />
          </CompanyField>
          <CompanyField label="Legal name" helper="Use the registered legal name if it differs from the display name.">
            <input value={form.legalName} onChange={(event) => updateField("legalName", event.target.value)} placeholder="Registered legal name" style={inputStyle} />
          </CompanyField>
          <CompanyField label="Registration number" helper="Optional registry or trade register number for review context.">
            <input value={form.registrationNumber} onChange={(event) => updateField("registrationNumber", event.target.value)} placeholder="Registration number" style={inputStyle} />
          </CompanyField>
          <CompanyField label="Fiscal or VAT code" helper="Use this to request autofill when available; it is not required for manual setup.">
            <input value={form.vatId} onChange={(event) => updateField("vatId", event.target.value)} placeholder="Example: RO12345678" style={inputStyle} />
          </CompanyField>
          <div style={{ minWidth: 0 }}>
            <LocationAutocomplete
              label="Company locality"
              placeholder="Search city, locality, or registered address"
              value={selectedLocation}
              onChange={(location) => {
                setSelectedLocation(location);
                if (!location) {
                  return;
                }

                setForm((current) => ({
                  ...current,
                  country: location.country || current.country,
                  city: location.locality || current.city,
                  addressLine1: location.formattedAddress || current.addressLine1,
                }));
              }}
              defaultCountry={deriveCountryCode(form.country, form.vatId)}
              helperText="Optional Places lookup. Manual country, city, and address fields remain editable."
            />
          </div>
          <CompanyField label="Country" helper="Used for lookup routing and marketplace context.">
            <input value={form.country} onChange={(event) => updateField("country", event.target.value)} placeholder="Country" style={inputStyle} />
          </CompanyField>
          <CompanyField label="City" helper="Optional city or main operating location.">
            <input value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="City" style={inputStyle} />
          </CompanyField>
          <CompanyField label="Address line 1" helper="Optional registered or operating address.">
            <input value={form.addressLine1} onChange={(event) => updateField("addressLine1", event.target.value)} placeholder="Street and number" style={inputStyle} />
          </CompanyField>
          <CompanyField label="Address line 2" helper="Optional building, floor, suite, or locality detail.">
            <input value={form.addressLine2} onChange={(event) => updateField("addressLine2", event.target.value)} placeholder="Additional address detail" style={inputStyle} />
          </CompanyField>
          <CompanyField label="Postal code" helper="Optional postal code for company records.">
            <input value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} placeholder="Postal code" style={inputStyle} />
          </CompanyField>
          <CompanyField label="Website" helper="Optional public website, if available.">
            <input value={form.website} onChange={(event) => updateField("website", event.target.value)} placeholder="https://example.com" style={inputStyle} />
          </CompanyField>
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
                  countryCode: deriveCountryCode(form.country, form.vatId),
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
              } catch {
                setError("Company lookup is unavailable. You can continue manually.");
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
            Lookup never saves automatically. Keep, change, or ignore any filled value.
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
            <div style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
              Review the filled fields above before continuing. This step still saves only when you
              press Continua.
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
              Source: {lookup.providerLabel} | Review status:{" "}
              {lookup.verifiedSource ? "trusted source" : "manual review still needed"} | Checked at:{" "}
              {new Date(lookup.lookupTimestamp).toLocaleString("ro-RO")}
            </div>
            {lookup.company.legalStatus ? (
              <div style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
                Legal status: {lookup.company.legalStatus}
              </div>
            ) : null}
            <div style={{ marginTop: 10, fontSize: 14, color: "#475569" }}>
              Verification: {lookup.verificationStatus}. Normalized fiscal code:{" "}
              {lookup.normalizedFiscalCode || "-"}.
            </div>
          </div>
        ) : null}

        {error ? <div style={errorStyle}>{error} Manual company setup remains available.</div> : null}

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
                  setError("Company name is required for company accounts.");
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
                } catch {
                  setError("We could not save the company profile.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !canContinue}
              title={!canContinue ? "Add a company name to continue." : undefined}
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

function CompanyField({
  label,
  helper,
  required = false,
  children,
}: {
  label: string;
  helper: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#0F172A", fontWeight: 700 }}>
        {label}
        <span style={required ? requiredPillStyle : optionalPillStyle}>
          {required ? "Required" : "Optional"}
        </span>
      </span>
      {children}
      <span style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45 }}>{helper}</span>
    </label>
  );
}

const releaseNoteStyle: CSSProperties = {
  borderRadius: 16,
  border: "1px solid #BFDBFE",
  background: "#EFF6FF",
  color: "#1E3A8A",
  padding: 14,
  lineHeight: 1.55,
};

const errorStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid #FECACA",
  background: "#FEF2F2",
  color: "#991B1B",
  padding: 14,
  lineHeight: 1.5,
};

const requiredPillStyle: CSSProperties = {
  borderRadius: 999,
  background: "#DBEAFE",
  color: "#1D4ED8",
  padding: "2px 8px",
  fontSize: 11,
  fontWeight: 800,
};

const optionalPillStyle: CSSProperties = {
  borderRadius: 999,
  background: "#F1F5F9",
  color: "#475569",
  padding: "2px 8px",
  fontSize: 11,
  fontWeight: 800,
};

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

function deriveCountryCode(country: string, vatId: string) {
  const normalizedVat = vatId.trim().toUpperCase();
  if (/^[A-Z]{2}/.test(normalizedVat)) {
    return normalizedVat.slice(0, 2);
  }

  const normalizedCountry = country.trim().toLowerCase();
  if (!normalizedCountry) {
    return "RO";
  }

  const mapping: Record<string, string> = {
    romania: "RO",
    romaniai: "RO",
    germany: "DE",
    deutschland: "DE",
    france: "FR",
    italy: "IT",
    spain: "ES",
    netherlands: "NL",
    belgium: "BE",
    austria: "AT",
    poland: "PL",
    portugal: "PT",
    czechia: "CZ",
    czech: "CZ",
    ireland: "IE",
    greece: "EL",
    sweden: "SE",
    denmark: "DK",
    finland: "FI",
    luxembourg: "LU",
  };

  return mapping[normalizedCountry] ?? normalizedCountry.slice(0, 2).toUpperCase();
}
