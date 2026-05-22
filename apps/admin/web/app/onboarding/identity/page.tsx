"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getOnboardingMe,
  getRegistrationDefaults,
  upsertIdentityProfile,
  updateOnboardingStep,
  type RegistrationDefaults,
} from "@/lib/api";
import { useOnboardingState } from "@/lib/onboarding";

type IdentityFormState = {
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
  bio: string;
  language: string;
  timezone: string;
  country: string;
  city: string;
  website: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
};

const defaultForm: IdentityFormState = {
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
};

const optionalLabel = "Opțional";
const requiredLabel = "Obligatoriu";

export default function OnboardingIdentityPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { ready, state, setPartial } = useOnboardingState();
  const [form, setForm] = useState<IdentityFormState>(defaultForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [defaults, setDefaults] = useState<RegistrationDefaults | null>(null);
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);

  const inferredDefaultsMessage = useMemo(() => {
    if (!defaults) {
      return "Am precompletat limba, țara și fusul orar cu valori potrivite pentru a porni mai repede. Le poți schimba oricând.";
    }

    const inferredFrom = defaults.inferredFrom.length
      ? defaults.inferredFrom.join(", ")
      : "setările browserului";

    return `Am sugerat limba, țara, orașul și fusul orar pe baza ${inferredFrom}. Poți modifica orice câmp înainte să continui.`;
  }, [defaults]);

  useEffect(() => {
    if (!ready || hydratedRef.current) {
      return;
    }

    setForm({
      firstName: state.firstName || "",
      lastName: state.lastName || "",
      displayName: state.displayName || "",
      phone: state.phone || "",
      bio: state.bio || "",
      language: state.languageCode || "ro",
      timezone: state.timezone || "Europe/Bucharest",
      country: normalizeCountryLabel(state.countryCode),
      city: "",
      website: state.website || "",
      linkedinUrl: state.linkedinUrl || "",
      githubUrl: state.githubUrl || "",
      portfolioUrl: state.portfolioUrl || "",
    });
    hydratedRef.current = true;
  }, [ready, state]);

  useEffect(() => {
    let cancelled = false;

    async function loadDefaults() {
      try {
        const resolvedDefaults = await getRegistrationDefaults();
        if (cancelled) {
          return;
        }
        setDefaults(resolvedDefaults);

        if (dirtyRef.current) {
          return;
        }

        setForm((current) => ({
          ...current,
          language: current.language || resolvedDefaults.language || "ro",
          timezone: current.timezone || resolvedDefaults.timezone || "Europe/Bucharest",
          country:
            current.country ||
            normalizeCountryLabel(resolvedDefaults.countryCode || resolvedDefaults.country),
          city: current.city || resolvedDefaults.city || "",
          phone: current.phone || resolvedDefaults.phonePrefix || "",
        }));
      } catch {
        // Defaults are only advisory and must stay non-blocking.
      }
    }

    void loadDefaults();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    let cancelled = false;

    async function loadSnapshot() {
      setLoading(true);
      try {
        const snapshot = await getOnboardingMe(token);
        if (cancelled) {
          return;
        }

        if (user?.email) {
          setPartial({
            email: user.email,
          });
        }

        if (dirtyRef.current) {
          return;
        }

        setForm((current) => ({
          firstName: snapshot.identityProfile.firstName ?? current.firstName ?? "",
          lastName: snapshot.identityProfile.lastName ?? current.lastName ?? "",
          displayName: snapshot.identityProfile.displayName ?? current.displayName ?? "",
          phone: snapshot.identityProfile.phone ?? current.phone ?? defaults?.phonePrefix ?? "",
          bio: snapshot.identityProfile.bio ?? current.bio ?? "",
          language: snapshot.identityProfile.language ?? current.language ?? defaults?.language ?? "ro",
          timezone:
            snapshot.identityProfile.timezone ??
            current.timezone ??
            defaults?.timezone ??
            "Europe/Bucharest",
          country:
            snapshot.identityProfile.country ??
            current.country ??
            normalizeCountryLabel(defaults?.countryCode || defaults?.country) ??
            "Romania",
          city: snapshot.identityProfile.city ?? current.city ?? defaults?.city ?? "",
          website: snapshot.identityProfile.website ?? current.website ?? "",
          linkedinUrl: snapshot.identityProfile.linkedinUrl ?? current.linkedinUrl ?? "",
          githubUrl: snapshot.identityProfile.githubUrl ?? current.githubUrl ?? "",
          portfolioUrl: snapshot.identityProfile.portfolioUrl ?? current.portfolioUrl ?? "",
        }));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [defaults, ready, token, user?.email]);

  function updateField<Key extends keyof IdentityFormState>(key: Key, value: IdentityFormState[Key]) {
    dirtyRef.current = true;
    setSaveMessage("");
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  if (!ready) {
    return null;
  }

  const canContinue = Boolean(form.firstName.trim() && form.lastName.trim() && form.displayName.trim());

  return (
    <section style={pageCard}>
      <div style={headerStack}>
        <div style={eyebrow}>Profil public</div>
        <h1 style={titleStyle}>Completează datele de identitate</h1>
        <p style={introStyle}>
          Datele de mai jos sunt folosite pentru profilul tău public și pentru etapele următoare din onboarding.
          Emailul de autentificare rămâne privat.
        </p>
      </div>

      <div style={defaultsCard}>
        <strong style={{ color: "#1B2A6B" }}>Sugestii precompletate</strong>
        <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>{inferredDefaultsMessage}</p>
      </div>

      <div style={formStack}>
        <SectionCard
          title="1. Identitate de bază"
          description="Aceste câmpuri apar în profil și ajută vizitatorii să înțeleagă rapid cine ești."
        >
          <FieldGrid>
            <Field
              label="Prenume"
              required
              helper="Numele tău real sau numele persoanei de contact."
            >
              <input
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                placeholder="Ex: Andrei"
                style={inputStyle}
              />
            </Field>
            <Field
              label="Nume"
              required
              helper="Poți folosi numele complet sau numele profesional preferat."
            >
              <input
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                placeholder="Ex: Popescu"
                style={inputStyle}
              />
            </Field>
            <Field
              label="Nume public"
              required
              helper="Acesta este numele pe care îl vor vedea clienții și colaboratorii."
            >
              <input
                autoComplete="nickname"
                value={form.displayName}
                onChange={(event) => updateField("displayName", event.target.value)}
                placeholder="Ex: Andrei Popescu"
                style={inputStyle}
              />
            </Field>
          </FieldGrid>
        </SectionCard>

        <SectionCard
          title="2. Contact și localizare"
          description="Aceste informații te ajută să pornești mai repede, dar rămân ușor de modificat."
        >
          <FieldGrid>
            <Field
              label="Telefon"
              helper="Folosește un număr la care poți fi contactat pentru colaborări."
            >
              <input
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+40 7xx xxx xxx"
                inputMode="tel"
                style={inputStyle}
              />
            </Field>
            <Field label="Țară" helper="Poți păstra sugestia sau o poți schimba.">
              <input
                autoComplete="country-name"
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
                placeholder="România"
                style={inputStyle}
              />
            </Field>
            <Field label="Oraș" helper="Ajută la localizarea profilului în marketplace.">
              <input
                autoComplete="address-level2"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="Ex: București"
                style={inputStyle}
              />
            </Field>
            <Field label="Limbă" helper="Ex: ro, en sau ro-RO.">
              <input
                autoComplete="language"
                value={form.language}
                onChange={(event) => updateField("language", event.target.value)}
                placeholder="ro"
                style={inputStyle}
              />
            </Field>
            <Field label="Fus orar" helper="Ex: Europe/Bucharest.">
              <input
                value={form.timezone}
                onChange={(event) => updateField("timezone", event.target.value)}
                placeholder="Europe/Bucharest"
                style={inputStyle}
              />
            </Field>
          </FieldGrid>
        </SectionCard>

        <SectionCard
          title="3. Linkuri publice"
          description="Adaugă doar linkuri pe care vrei să le vadă publicul în profil."
        >
          <FieldGrid>
            <Field label="Website" helper="Site-ul tău principal sau al afacerii.">
              <input
                autoComplete="url"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://exemplu.ro"
                style={inputStyle}
              />
            </Field>
            <Field label="LinkedIn" helper="Profilul public LinkedIn.">
              <input
                autoComplete="url"
                value={form.linkedinUrl}
                onChange={(event) => updateField("linkedinUrl", event.target.value)}
                placeholder="https://www.linkedin.com/in/..."
                style={inputStyle}
              />
            </Field>
            <Field label="Portofoliu" helper="Proiecte sau prezentare profesională.">
              <input
                autoComplete="url"
                value={form.portfolioUrl}
                onChange={(event) => updateField("portfolioUrl", event.target.value)}
                placeholder="https://portofoliu.ro"
                style={inputStyle}
              />
            </Field>
            <Field label="GitHub" helper="Opțional pentru roluri tehnice sau portofolii publice.">
              <input
                autoComplete="url"
                value={form.githubUrl}
                onChange={(event) => updateField("githubUrl", event.target.value)}
                placeholder="https://github.com/..."
                style={inputStyle}
              />
            </Field>
          </FieldGrid>
        </SectionCard>

        <SectionCard
          title="4. Descriere publică"
          description="Scrie câteva rânduri clare despre experiență, servicii sau tipul de proiecte pe care le cauți."
        >
          <Field
            label="Descriere"
            helper={`Ideal: 300-700 caractere. Acest text apare în profilul public. (${form.bio.length}/2000)`}
          >
            <textarea
              value={form.bio}
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Ex: Lucrez în construcții și coordonez echipe pentru proiecte comerciale și rezidențiale..."
              rows={7}
              style={{ ...inputStyle, minHeight: 180, resize: "vertical" }}
            />
          </Field>
        </SectionCard>

        {error ? <div style={errorBanner}>{error}</div> : null}
        {saveMessage ? <div style={successBanner}>{saveMessage}</div> : null}

        <div style={actionBar}>
          <button onClick={() => router.push("/onboarding/welcome")} style={secondaryButton}>
            Înapoi
          </button>
          <div style={actionMeta}>
            <div style={{ display: "grid", gap: 4, justifyItems: "end" }}>
              <span style={{ color: "#64748B", fontSize: 14 }}>
                Câmpurile marcate cu <strong>{requiredLabel}</strong> trebuie completate înainte să continui.
              </span>
              {loading ? (
                <span style={{ color: "#94A3B8", fontSize: 13 }}>
                  Verificăm dacă există date salvate anterior, dar poți completa formularul fără să aștepți.
                </span>
              ) : null}
            </div>
            <button
              onClick={async () => {
                if (!token) {
                  router.push("/login");
                  return;
                }

                if (!canContinue) {
                  setError("Completează prenumele, numele și numele public înainte să continui.");
                  return;
                }

                setSaving(true);
                setError("");
                setSaveMessage("");

                const resolvedDisplayName =
                  form.displayName.trim() ||
                  [form.firstName, form.lastName].filter(Boolean).join(" ").trim() ||
                  user?.displayName ||
                  "OpenStaff User";

                try {
                  const response = await upsertIdentityProfile(
                    {
                      ...form,
                      displayName: resolvedDisplayName,
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
                    firstName: response.identityProfile.firstName ?? form.firstName,
                    lastName: response.identityProfile.lastName ?? form.lastName,
                    displayName: response.identityProfile.displayName,
                    phone: response.identityProfile.phone ?? form.phone,
                    bio: response.identityProfile.bio ?? form.bio,
                    languageCode: response.identityProfile.language ?? form.language,
                    timezone: response.identityProfile.timezone ?? form.timezone,
                    countryCode: response.identityProfile.country ?? form.country,
                    website: response.identityProfile.website ?? form.website,
                    linkedinUrl: response.identityProfile.linkedinUrl ?? form.linkedinUrl,
                    githubUrl: response.identityProfile.githubUrl ?? form.githubUrl,
                    portfolioUrl: response.identityProfile.portfolioUrl ?? form.portfolioUrl,
                    currentStep: "company",
                  });

                  setSaveMessage("Datele au fost salvate. Treci la pasul următor.");
                  dirtyRef.current = false;
                  router.push("/onboarding/company");
                } catch (saveError) {
                  setError(
                    saveError instanceof Error
                      ? saveError.message
                      : "Nu am putut salva profilul de identitate.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              style={{
                ...primaryButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Se salvează..." : "Salvează și continuă"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionCard(props: { title: string; description: string; children: ReactNode }) {
  return (
    <section style={sectionCard}>
      <div style={{ display: "grid", gap: 6 }}>
        <h2 style={sectionTitle}>{props.title}</h2>
        <p style={sectionDescription}>{props.description}</p>
      </div>
      {props.children}
    </section>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 18,
      }}
    >
      {children}
    </div>
  );
}

function Field(props: {
  label: string;
  helper: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <span style={{ color: "#0F172A", fontWeight: 700 }}>{props.label}</span>
        <span style={{ color: props.required ? "#1B2A6B" : "#64748B", fontSize: 12, fontWeight: 700 }}>
          {props.required ? requiredLabel : optionalLabel}
        </span>
      </div>
      {props.children}
      <span style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>{props.helper}</span>
    </label>
  );
}

function normalizeCountryLabel(country: string | null | undefined) {
  if (!country) {
    return "Romania";
  }

  const normalized = country.trim().toUpperCase();
  if (normalized === "RO") {
    return "Romania";
  }

  return country;
}

const pageCard: CSSProperties = {
  background: "white",
  borderRadius: 24,
  padding: "clamp(20px, 4vw, 36px)",
  border: "1px solid #E8EBF5",
  width: "100%",
  maxWidth: 980,
  margin: "0 auto",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.06)",
};

const headerStack: CSSProperties = {
  display: "grid",
  gap: 10,
};

const eyebrow: CSSProperties = {
  color: "#0F766E",
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

const titleStyle: CSSProperties = {
  color: "#1B2A6B",
  fontSize: "clamp(30px, 4vw, 40px)",
  lineHeight: 1.1,
  fontWeight: 900,
  margin: 0,
};

const introStyle: CSSProperties = {
  color: "#334155",
  margin: 0,
  lineHeight: 1.7,
  fontSize: 16,
  maxWidth: 760,
};

const defaultsCard: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 8,
  borderRadius: 18,
  padding: 18,
  background: "linear-gradient(135deg, #F8FAFC 0%, #F3F7FF 100%)",
  border: "1px solid #DCE6F7",
};

const formStack: CSSProperties = {
  display: "grid",
  gap: 18,
  marginTop: 22,
};

const sectionCard: CSSProperties = {
  display: "grid",
  gap: 18,
  borderRadius: 22,
  border: "1px solid #E8EBF5",
  background: "#FFFFFF",
  padding: "clamp(18px, 3vw, 28px)",
};

const sectionTitle: CSSProperties = {
  margin: 0,
  color: "#1E293B",
  fontSize: 22,
  fontWeight: 800,
};

const sectionDescription: CSSProperties = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "15px 16px",
  borderRadius: 14,
  border: "1px solid #CBD5E1",
  fontSize: 16,
  lineHeight: 1.4,
  color: "#0F172A",
  background: "#FFFFFF",
};

const errorBanner: CSSProperties = {
  borderRadius: 16,
  padding: 14,
  background: "#FEF2F2",
  color: "#B91C1C",
  border: "1px solid #FECACA",
};

const successBanner: CSSProperties = {
  borderRadius: 16,
  padding: 14,
  background: "#ECFDF5",
  color: "#166534",
  border: "1px solid #A7F3D0",
};

const actionBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "center",
  marginTop: 6,
};

const actionMeta: CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "end",
};

const primaryButton: CSSProperties = {
  padding: "14px 20px",
  borderRadius: 14,
  border: "none",
  background: "#1B2A6B",
  color: "white",
  fontSize: 15,
  fontWeight: 800,
  minWidth: 220,
};

const secondaryButton: CSSProperties = {
  padding: "14px 18px",
  borderRadius: 14,
  border: "1px solid #CBD5E1",
  background: "white",
  color: "#0F172A",
  fontWeight: 700,
};
