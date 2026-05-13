"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingMe, upsertIdentityProfile, updateOnboardingStep } from "@/lib/api";
import { useOnboardingState } from "@/lib/onboarding";

export default function OnboardingIdentityPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { ready, state, setPartial } = useOnboardingState();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    phone: "",
    bio: "",
    language: "ro",
    timezone: "Europe/Bucharest",
    country: "Romania",
    city: "",
    website: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
        firstName: snapshot.identityProfile.firstName ?? state.firstName,
        lastName: snapshot.identityProfile.lastName ?? state.lastName,
        displayName: snapshot.identityProfile.displayName ?? state.displayName,
        phone: snapshot.identityProfile.phone ?? state.phone,
        bio: snapshot.identityProfile.bio ?? state.bio,
        language: snapshot.identityProfile.language ?? state.languageCode,
        timezone: snapshot.identityProfile.timezone ?? state.timezone,
        country: snapshot.identityProfile.country ?? state.countryCode,
        city: snapshot.identityProfile.city ?? "",
        website: snapshot.identityProfile.website ?? state.website,
        linkedinUrl: snapshot.identityProfile.linkedinUrl ?? state.linkedinUrl,
        githubUrl: snapshot.identityProfile.githubUrl ?? state.githubUrl,
        portfolioUrl: snapshot.identityProfile.portfolioUrl ?? state.portfolioUrl,
      });
      setPartial({
        email: user?.email ?? state.email,
      });
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, setPartial, state, token, user?.email]);

  if (!ready) {
    return null;
  }

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 16 }}>
        <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: 0 }}>Identity profile</h2>
        <p style={{ color: "#334155", margin: 0 }}>
          Acest strat este public-safe si separat de auth sau billing. Emailul ramane privat.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} placeholder="First name" style={inputStyle} />
          <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} placeholder="Last name" style={inputStyle} />
          <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Display name" style={inputStyle} />
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" style={inputStyle} />
          <input value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} placeholder="Language" style={inputStyle} />
          <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} placeholder="Timezone" style={inputStyle} />
          <input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder="Country" style={inputStyle} />
          <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="City" style={inputStyle} />
          <input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} placeholder="Website URL" style={inputStyle} />
          <input value={form.linkedinUrl} onChange={(event) => setForm((current) => ({ ...current, linkedinUrl: event.target.value }))} placeholder="LinkedIn URL" style={inputStyle} />
          <input value={form.githubUrl} onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))} placeholder="GitHub URL" style={inputStyle} />
          <input value={form.portfolioUrl} onChange={(event) => setForm((current) => ({ ...current, portfolioUrl: event.target.value }))} placeholder="Portfolio URL" style={inputStyle} />
        </div>

        <textarea
          value={form.bio}
          onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
          placeholder="Bio"
          rows={5}
          style={{ ...inputStyle, minHeight: 140 }}
        />

        {error ? <div style={{ color: "#DC2626" }}>{error}</div> : null}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => router.push("/onboarding/welcome")} style={secondaryButton}>
            Inapoi
          </button>
          <button
            onClick={async () => {
              if (!token) {
                router.push("/login");
                return;
              }

              setSaving(true);
              setError("");

              try {
                await upsertIdentityProfile(
                  {
                    ...form,
                    displayName:
                      form.displayName ||
                      [form.firstName, form.lastName].filter(Boolean).join(" ") ||
                      user?.displayName ||
                      "OpenStaff User",
                  },
                  token,
                );

                await updateOnboardingStep(
                  {
                    currentStep: "company",
                    completedStep: "identity",
                  },
                  token,
                );

                setPartial({
                  firstName: form.firstName,
                  lastName: form.lastName,
                  displayName: form.displayName,
                  phone: form.phone,
                  bio: form.bio,
                  languageCode: form.language,
                  timezone: form.timezone,
                  countryCode: form.country,
                  website: form.website,
                  linkedinUrl: form.linkedinUrl,
                  githubUrl: form.githubUrl,
                  portfolioUrl: form.portfolioUrl,
                  currentStep: "company",
                });
                router.push("/onboarding/company");
              } catch (saveError) {
                setError(
                  saveError instanceof Error
                    ? saveError.message
                    : "Nu am putut salva identity profile.",
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
