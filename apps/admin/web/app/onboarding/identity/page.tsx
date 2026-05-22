"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EscoMultiSelect from "@/components/EscoMultiSelect";
import NaceSearchInput from "@/components/NaceSearchInput";
import UniclassMultiSelect from "@/components/UniclassMultiSelect";
import { useAuth } from "@/context/AuthContext";
import {
  classifyProfileWithRelu,
  enrichProfileWithRelu,
  getOnboardingMe,
  getRegistrationDefaults,
  getReluProfileResults,
  updateOnboardingStep,
  upsertIdentityProfile,
  type RegistrationDefaults,
  type ReluProfileResults,
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
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  expertiseText: string;
};

type UrlWarningMap = Partial<Record<keyof Pick<
  IdentityFormState,
  | "website"
  | "linkedinUrl"
  | "githubUrl"
  | "portfolioUrl"
  | "facebookUrl"
  | "instagramUrl"
  | "youtubeUrl"
  | "tiktokUrl"
  | "twitterUrl"
>, string>>;

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
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  expertiseText: "",
};

const requiredLabel = "Obligatoriu";
const optionalLabel = "Optional";

export default function OnboardingIdentityPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { ready, state, setPartial } = useOnboardingState();
  const [form, setForm] = useState<IdentityFormState>(defaultForm);
  const [defaults, setDefaults] = useState<RegistrationDefaults | null>(null);
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getOnboardingMe>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzingRelu, setAnalyzingRelu] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [reluResults, setReluResults] = useState<ReluProfileResults | null>(null);
  const [showAdditionalSocials, setShowAdditionalSocials] = useState(false);
  const [previewAssetLabel, setPreviewAssetLabel] = useState("Logo / imagine de profil");
  const [previewAssetName, setPreviewAssetName] = useState("");
  const [previewAssetUrl, setPreviewAssetUrl] = useState("");
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);

  const isCompany = state.actorType !== "INDIVIDUAL" || user?.actorType === "COMPANY";

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
      facebookUrl: state.facebookUrl || "",
      instagramUrl: state.instagramUrl || "",
      youtubeUrl: state.youtubeUrl || "",
      tiktokUrl: state.tiktokUrl || "",
      twitterUrl: state.twitterUrl || "",
      expertiseText: (state.expertiseTags || []).join(", "),
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
        // Advisory only.
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
        const nextSnapshot = await getOnboardingMe(token);
        if (cancelled) {
          return;
        }

        setSnapshot(nextSnapshot);

        if (user?.email) {
          setPartial({ email: user.email });
        }

        if (dirtyRef.current) {
          return;
        }

        setForm((current) => ({
          ...current,
          firstName: nextSnapshot.identityProfile.firstName ?? current.firstName ?? "",
          lastName: nextSnapshot.identityProfile.lastName ?? current.lastName ?? "",
          displayName: nextSnapshot.identityProfile.displayName ?? current.displayName ?? "",
          phone: nextSnapshot.identityProfile.phone ?? current.phone ?? defaults?.phonePrefix ?? "",
          bio: nextSnapshot.identityProfile.bio ?? current.bio ?? "",
          language: nextSnapshot.identityProfile.language ?? current.language ?? defaults?.language ?? "ro",
          timezone:
            nextSnapshot.identityProfile.timezone ??
            current.timezone ??
            defaults?.timezone ??
            "Europe/Bucharest",
          country:
            nextSnapshot.identityProfile.country ??
            current.country ??
            normalizeCountryLabel(defaults?.countryCode || defaults?.country) ??
            "Romania",
          city: nextSnapshot.identityProfile.city ?? current.city ?? defaults?.city ?? "",
          website: nextSnapshot.identityProfile.website ?? current.website ?? "",
          linkedinUrl: nextSnapshot.identityProfile.linkedinUrl ?? current.linkedinUrl ?? "",
          githubUrl: nextSnapshot.identityProfile.githubUrl ?? current.githubUrl ?? "",
          portfolioUrl: nextSnapshot.identityProfile.portfolioUrl ?? current.portfolioUrl ?? "",
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

  useEffect(() => {
    return () => {
      if (previewAssetUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewAssetUrl);
      }
    };
  }, [previewAssetUrl]);

  const requiredReady =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.displayName.trim().length > 0;

  const expertiseTags = useMemo(
    () =>
      form.expertiseText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [form.expertiseText],
  );

  const inferredDefaultsMessage = useMemo(() => {
    if (!defaults) {
      return "Am precompletat limba, tara si fusul orar ca sugestii. Poti schimba orice camp.";
    }

    const inferredFrom = defaults.inferredFrom.length
      ? defaults.inferredFrom.join(", ")
      : "setarile browserului";

    return `Am sugerat limba, tara, orasul si fusul orar pe baza ${inferredFrom}. Valorile sunt doar sugestii si raman complet editabile.`;
  }, [defaults]);

  const urlWarnings = useMemo<UrlWarningMap>(() => {
    const warnings: UrlWarningMap = {};
    const entries: Array<keyof UrlWarningMap> = [
      "website",
      "linkedinUrl",
      "githubUrl",
      "portfolioUrl",
      "facebookUrl",
      "instagramUrl",
      "youtubeUrl",
      "tiktokUrl",
      "twitterUrl",
    ];

    for (const key of entries) {
      const value = form[key];
      if (!value.trim()) {
        continue;
      }

      if (!isValidHttpUrl(value)) {
        warnings[key] = buildOptionalUrlGuidance(key);
      }
    }

    return warnings;
  }, [form]);

  const reluClassification = reluResults?.classifications?.[0] ?? null;
  const reluOutput = reluClassification?.outputData ?? {};
  const reluSummary =
    reluClassification?.explanation ||
    (Array.isArray(reluOutput.extractedRequirements) && reluOutput.extractedRequirements.length
      ? `RELU vede deja cateva directii utile: ${reluOutput.extractedRequirements.join(", ")}.`
      : "");

  const focusTitle = isCompany ? "Prezinta compania intr-un mod clar" : "Prezinta-ti experienta pe scurt";
  const focusText = isCompany
    ? "Concentreaza-te pe incredere, servicii, zone de lucru si cum arata colaborarea cu firma ta."
    : "Concentreaza-te pe expertiza, tipul de proiecte potrivite si ce poate verifica rapid un client.";

  function updateField<Key extends keyof IdentityFormState>(key: Key, value: IdentityFormState[Key]) {
    dirtyRef.current = true;
    setSaveMessage("");
    setAssistantMessage("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function mergeLocalOnboardingState(nextCurrentStep: string) {
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
      facebookUrl: form.facebookUrl,
      instagramUrl: form.instagramUrl,
      youtubeUrl: form.youtubeUrl,
      tiktokUrl: form.tiktokUrl,
      twitterUrl: form.twitterUrl,
      expertiseTags,
      naceCode: state.naceCode,
      naceDescription: state.naceDescription,
      escoOccupations: state.escoOccupations,
      uniclassSelections: state.uniclassSelections,
      currentStep: nextCurrentStep,
    });
  }

  function buildIdentityPayload() {
    const warnings: string[] = [];

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      displayName:
        form.displayName.trim() ||
        [form.firstName, form.lastName].map((item) => item.trim()).filter(Boolean).join(" "),
      phone: normalizeEmpty(form.phone),
      bio: normalizeEmpty(form.bio),
      language: normalizeEmpty(form.language),
      timezone: normalizeEmpty(form.timezone),
      country: normalizeEmpty(form.country),
      city: normalizeEmpty(form.city),
      website: sanitizePersistedUrl(form.website, "Website", warnings),
      linkedinUrl: sanitizePersistedUrl(form.linkedinUrl, "LinkedIn", warnings),
      githubUrl: sanitizePersistedUrl(form.githubUrl, "GitHub", warnings),
      portfolioUrl: sanitizePersistedUrl(form.portfolioUrl, "Portofoliu", warnings),
    };

    return { payload, warnings };
  }

  async function saveDraftForRelu() {
    if (!token) {
      router.push("/login");
      return null;
    }

    if (!requiredReady) {
      setError("Completeaza prenumele, numele si numele public inainte sa ceri asistenta RELU AI.");
      return null;
    }

    const { payload, warnings } = buildIdentityPayload();
    if (warnings.length > 0) {
      setAssistantMessage(warnings.join(" "));
    }

    const response = await upsertIdentityProfile(payload, token);
    setSnapshot(response);
    mergeLocalOnboardingState("identity");
    dirtyRef.current = false;
    return response;
  }

  async function runReluAssistant() {
    if (!token) {
      router.push("/login");
      return;
    }

    setAnalyzingRelu(true);
    setError("");
    setAssistantMessage("");

    try {
      const response = await saveDraftForRelu();
      if (!response?.legacyProfile?.id) {
        setAssistantMessage("Profilul draft a fost salvat, dar RELU AI nu are inca un profil analizabil.");
        return;
      }

      await enrichProfileWithRelu(response.legacyProfile.id, token);
      await classifyProfileWithRelu(response.legacyProfile.id, token);
      const nextResults = await getReluProfileResults(response.legacyProfile.id, token);
      setReluResults(nextResults);
      setAssistantMessage("RELU AI a pregatit sugestii pentru descriere, expertiza si clasificare.");
    } catch (assistantError) {
      setError(
        assistantError instanceof Error
          ? assistantError.message
          : "RELU AI nu a putut analiza profilul chiar acum.",
      );
    } finally {
      setAnalyzingRelu(false);
    }
  }

  function applyReluSuggestions() {
    if (!reluClassification) {
      return;
    }

    const esco =
      Array.isArray(reluOutput.escoCandidates)
        ? reluOutput.escoCandidates.map((item) => `${item.code} - ${item.label}`)
        : [];
    const uniclass =
      Array.isArray(reluOutput.uniclassCandidates)
        ? reluOutput.uniclassCandidates.map((item) => `${item.code} - ${item.label}`)
        : [];
    const nace = Array.isArray(reluOutput.naceCandidates) ? reluOutput.naceCandidates[0] : null;
    const extracted =
      Array.isArray(reluOutput.extractedRequirements)
        ? reluOutput.extractedRequirements.filter((item): item is string => typeof item === "string")
        : [];

    setForm((current) => ({
      ...current,
      bio: current.bio.trim() || reluSummary || current.bio,
      expertiseText:
        current.expertiseText.trim() || extracted.length === 0
          ? current.expertiseText
          : extracted.join(", "),
    }));

    setPartial({
      escoOccupations: esco.length > 0 ? esco : state.escoOccupations,
      uniclassSelections: uniclass.length > 0 ? uniclass : state.uniclassSelections,
      naceCode: nace?.code || state.naceCode,
      naceDescription: nace?.label || state.naceDescription,
      expertiseTags: extracted.length > 0 ? extracted : expertiseTags,
    });
    setAssistantMessage("Sugestiile RELU AI au fost copiate in draft. Le poti edita inainte de salvare.");
  }

  async function handleContinue() {
    if (!token) {
      router.push("/login");
      return;
    }

    if (!requiredReady) {
      setError("Completeaza prenumele, numele si numele public inainte sa continui.");
      return;
    }

    setSaving(true);
    setError("");
    setSaveMessage("");

    const { payload, warnings } = buildIdentityPayload();

    try {
      const response = await upsertIdentityProfile(payload, token);
      await updateOnboardingStep(
        {
          currentStep: "company",
          completedStep: "identity",
        },
        token,
      );

      setSnapshot(response);
      mergeLocalOnboardingState("company");
      dirtyRef.current = false;
      setSaveMessage(
        warnings.length > 0
          ? `Profilul a fost salvat. Unele linkuri optionale au fost ignorate pana cand introduci URL-uri complete: ${warnings.join(" ")}`
          : "Profilul a fost salvat. Poti continua catre pasul urmator.",
      );
      router.push("/onboarding/company");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Nu am putut salva profilul de identitate.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return null;
  }

  return (
    <section style={pageShell}>
      <div style={pageMain}>
        <div style={headerStack}>
          <div style={eyebrow}>Onboarding ghidat</div>
          <h1 style={titleStyle}>Construieste un profil credibil, nu doar un formular completat</h1>
          <p style={introStyle}>
            Iti cerem doar informatiile de care ai nevoie ca sa poti continua. Datele publice
            raman editabile, emailul de autentificare ramane privat, iar RELU AI iti propune
            completari fara sa iti suprascrie vreodata deciziile.
          </p>
        </div>

        <div style={trustStrip}>
          <TrustPill title="Ce devine public" text="Numele public, orasul, bio-ul si linkurile pe care alegi sa le afisezi." />
          <TrustPill title="Ce ramane privat" text="Emailul de login, tokenurile si orice camp pe care nu il publici explicit." />
          <TrustPill title="Cum te ajuta RELU" text="Sugereaza sumar, expertiza si taxonomii. Tu decizi ce pastrezi." />
        </div>

        <div style={defaultsCard}>
          <strong style={{ color: "#1B2A6B" }}>Sugestii precompletate</strong>
          <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>{inferredDefaultsMessage}</p>
        </div>

        <div style={contentGrid}>
          <div style={formColumn}>
            <SectionCard
              title="A. Identitate de baza"
              description="Campurile obligatorii pentru un profil credibil si usor de inteles."
            >
              <FieldGrid>
                <Field label="Prenume" required helper="Numele persoanei de contact sau al profesionistului.">
                  <input
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(event) => updateField("firstName", event.target.value)}
                    placeholder="Ex: Andrei"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Nume" required helper="Poate fi numele complet sau numele profesional preferat.">
                  <input
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(event) => updateField("lastName", event.target.value)}
                    placeholder="Ex: Popescu"
                    style={inputStyle}
                  />
                </Field>
                <Field
                  label={isCompany ? "Nume public al companiei" : "Nume public / profesional"}
                  required
                  helper="Asa vei aparea in profilul public si in revizuirile de moderare."
                >
                  <input
                    autoComplete="nickname"
                    value={form.displayName}
                    onChange={(event) => updateField("displayName", event.target.value)}
                    placeholder={isCompany ? "Ex: BuildNorth Romania" : "Ex: Andrei Popescu"}
                    style={inputStyle}
                  />
                </Field>
              </FieldGrid>
            </SectionCard>

            <SectionCard
              title="B. Contact si localizare"
              description="Sugestii usor de ajustat, utile pentru potrivirea cu proiecte si clienti."
            >
              <FieldGrid>
                <Field label="Telefon" helper="Numar de contact pentru colaborari si follow-up.">
                  <input
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder="+40 7xx xxx xxx"
                    inputMode="tel"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Tara" helper="Folosita pentru filtrare si pentru setari regionale.">
                  <input
                    autoComplete="country-name"
                    value={form.country}
                    onChange={(event) => updateField("country", event.target.value)}
                    placeholder="Romania"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Oras" helper="Ajuta profilul sa para complet si usor de localizat.">
                  <input
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    placeholder="Ex: Bucuresti"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Limba" helper="Ex: ro, en sau ro-RO.">
                  <input
                    autoComplete="language"
                    value={form.language}
                    onChange={(event) => updateField("language", event.target.value)}
                    placeholder="ro"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Fus orar" helper="Util cand programul si raspunsurile difera pe regiuni.">
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
              title="C. Prezenta profesionala"
              description={
                isCompany
                  ? "Pune accent pe site, pe pagina de companie si pe orice indicator public de incredere."
                  : "Pune accent pe portofoliu, LinkedIn si orice link care te ajuta sa pari verificabil."
              }
            >
              <FieldGrid>
                <Field
                  label="Website"
                  helper="Optional. Daca il adaugi, foloseste un URL complet, de exemplu https://exemplu.ro."
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      autoComplete="url"
                      value={form.website}
                      onChange={(event) => updateField("website", event.target.value)}
                      placeholder="https://exemplu.ro"
                      style={inputStyle}
                    />
                    <InlineWarning message={urlWarnings.website} />
                  </div>
                </Field>
                <Field
                  label="LinkedIn"
                  helper="Optional. Bun pentru incredere si context profesional, dar nu blocheaza onboarding-ul."
                >
                  <div style={{ display: "grid", gap: 8 }}>
                    <input
                      autoComplete="url"
                      value={form.linkedinUrl}
                      onChange={(event) => updateField("linkedinUrl", event.target.value)}
                      placeholder="https://www.linkedin.com/in/..."
                      style={inputStyle}
                    />
                    <InlineWarning message={urlWarnings.linkedinUrl} />
                  </div>
                </Field>
                {!isCompany ? (
                  <Field
                    label="Portofoliu"
                    helper="Optional. Ideal pentru exemple de lucrari, proiecte sau prezentari comerciale."
                  >
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        autoComplete="url"
                        value={form.portfolioUrl}
                        onChange={(event) => updateField("portfolioUrl", event.target.value)}
                        placeholder="https://portofoliu.ro"
                        style={inputStyle}
                      />
                      <InlineWarning message={urlWarnings.portfolioUrl} />
                    </div>
                  </Field>
                ) : null}
                {!isCompany ? (
                  <Field
                    label="GitHub"
                    helper="Optional. Daca nu folosesti GitHub, lasa campul gol. Nu blocheaza continuarea."
                  >
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        autoComplete="url"
                        value={form.githubUrl}
                        onChange={(event) => updateField("githubUrl", event.target.value)}
                        placeholder="https://github.com/..."
                        style={inputStyle}
                      />
                      <InlineWarning message={urlWarnings.githubUrl} />
                    </div>
                  </Field>
                ) : null}
              </FieldGrid>

              <button
                type="button"
                onClick={() => setShowAdditionalSocials((current) => !current)}
                style={linkToggleButton}
              >
                {showAdditionalSocials ? "Ascunde linkurile sociale optionale" : "Adauga si alte linkuri sociale optionale"}
              </button>

              {showAdditionalSocials ? (
                <FieldGrid>
                  <Field label="Facebook" helper="Optional. Nu blocheaza continuarea si ramane editabil ulterior.">
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        value={form.facebookUrl}
                        onChange={(event) => updateField("facebookUrl", event.target.value)}
                        placeholder="https://facebook.com/..."
                        style={inputStyle}
                      />
                      <InlineWarning message={urlWarnings.facebookUrl} />
                    </div>
                  </Field>
                  <Field label="Instagram" helper="Optional. Folosit doar daca ajuta increderea in brand sau portofoliu.">
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        value={form.instagramUrl}
                        onChange={(event) => updateField("instagramUrl", event.target.value)}
                        placeholder="https://instagram.com/..."
                        style={inputStyle}
                      />
                      <InlineWarning message={urlWarnings.instagramUrl} />
                    </div>
                  </Field>
                  <Field label="YouTube" helper="Optional. Util pentru clipuri de prezentare sau proiecte.">
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        value={form.youtubeUrl}
                        onChange={(event) => updateField("youtubeUrl", event.target.value)}
                        placeholder="https://youtube.com/..."
                        style={inputStyle}
                      />
                      <InlineWarning message={urlWarnings.youtubeUrl} />
                    </div>
                  </Field>
                  <Field label="TikTok" helper="Optional. Nu este necesar pentru a continua onboarding-ul.">
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        value={form.tiktokUrl}
                        onChange={(event) => updateField("tiktokUrl", event.target.value)}
                        placeholder="https://tiktok.com/@..."
                        style={inputStyle}
                      />
                      <InlineWarning message={urlWarnings.tiktokUrl} />
                    </div>
                  </Field>
                  <Field label="X / Twitter" helper="Optional. Adauga-l doar daca te reprezinta public.">
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        value={form.twitterUrl}
                        onChange={(event) => updateField("twitterUrl", event.target.value)}
                        placeholder="https://x.com/..."
                        style={inputStyle}
                      />
                      <InlineWarning message={urlWarnings.twitterUrl} />
                    </div>
                  </Field>
                </FieldGrid>
              ) : null}

              <div style={supportNote}>
                Linkurile sociale suplimentare sunt optionale si nu blocheaza continuarea. In acest pas
                sunt folosite doar pentru context de onboarding si preview; profilul public activ
                ramane bazat pe datele confirmate si pe linkurile persistate oficial.
              </div>
            </SectionCard>

            <SectionCard
              title="D. Despre tine"
              description={focusText}
            >
              <div style={focusCard}>
                <strong style={{ color: "#1B2A6B" }}>{focusTitle}</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  {isCompany
                    ? "Poti descrie serviciile principale, tipul de proiecte, zona de lucru si ce te face usor de verificat."
                    : "Poti descrie experienta, tipul de roluri cautate, certificari relevante si stilul de lucru."}
                </p>
              </div>

              <Field
                label="Descriere publica"
                helper={`Textul de baza pentru profilul public. Ideal: 300-700 caractere. (${form.bio.length}/2000)`}
              >
                <textarea
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  placeholder={
                    isCompany
                      ? "Ex: Firma noastra livreaza echipe pentru proiecte industriale, logistica si mentenanta in toata Romania..."
                      : "Ex: Coordonez lucrari electrice si tehnice, cu experienta in santiere comerciale si echipe mobile..."
                  }
                  rows={7}
                  style={{ ...inputStyle, minHeight: 180, resize: "vertical" }}
                />
              </Field>

              <Field
                label={isCompany ? "Expertiza / servicii" : "Expertiza / competente"}
                helper="Optional. Separati elementele cu virgula. Exemplu: montaj, cablare, coordonare echipa."
              >
                <input
                  value={form.expertiseText}
                  onChange={(event) => updateField("expertiseText", event.target.value)}
                  placeholder={isCompany ? "Ex: montaj, logistica, interventii rapide" : "Ex: cablare, mentenanta, HSE"}
                  style={inputStyle}
                />
              </Field>

              {expertiseTags.length > 0 ? (
                <TagList title="Etichete extrase din expertiza" items={expertiseTags} />
              ) : null}

              <Field label="Categorie / NACE" helper="Optional. Te ajuta sa fii mai usor de inteles de clienti si operatori.">
                <div style={{ display: "grid", gap: 8 }}>
                  <NaceSearchInput
                    value={
                      state.naceCode && state.naceDescription
                        ? `${state.naceCode} - ${state.naceDescription}`
                        : state.naceCode
                    }
                    onChange={(code, description) => setPartial({ naceCode: code, naceDescription: description })}
                  />
                  <span style={fieldMetaText}>
                    Nu blocheaza continuarea. Este o sugestie utila pentru clasificare si cautare.
                  </span>
                </div>
              </Field>

              <Field label="ESCO" helper="Optional. Alege ocupatiile sau competentele care te reprezinta cel mai bine.">
                <EscoMultiSelect
                  value={state.escoOccupations}
                  onChange={(escoOccupations) => setPartial({ escoOccupations })}
                />
              </Field>

              <Field label="Uniclass" helper="Optional. Util mai ales pentru proiecte tehnice sau industriale.">
                <UniclassMultiSelect
                  value={state.uniclassSelections}
                  onChange={(uniclassSelections) => setPartial({ uniclassSelections })}
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="E. RELU AI Assistant"
              description="Vizibil, explicabil si mereu sub controlul tau."
            >
              <div style={assistantCard}>
                <div style={{ display: "grid", gap: 8 }}>
                  <strong style={{ color: "#1B2A6B" }}>RELU AI iti poate sugera:</strong>
                  <ul style={assistantList}>
                    <li>un sumar public mai clar</li>
                    <li>directii de expertiza sau servicii</li>
                    <li>categorii NACE</li>
                    <li>sugestii ESCO si Uniclass</li>
                    <li>informatii lipsa care ar creste increderea in profil</li>
                  </ul>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => void runReluAssistant()}
                    disabled={analyzingRelu}
                    style={primaryButton}
                  >
                    {analyzingRelu ? "RELU analizeaza profilul..." : "Genereaza sugestii cu RELU AI"}
                  </button>
                  {reluClassification ? (
                    <button type="button" onClick={applyReluSuggestions} style={secondaryButton}>
                      Copiaza sugestiile in draft
                    </button>
                  ) : null}
                </div>
                <div style={supportNote}>
                  RELU AI este doar un asistent. Nu publica, nu aproba si nu modifica nimic fara confirmarea ta.
                </div>
              </div>

              {assistantMessage ? <div style={infoBanner}>{assistantMessage}</div> : null}

              {reluClassification ? (
                <div style={reluPanel}>
                  <div style={reluPanelHeader}>RELU AI a analizat draftul curent</div>
                  <p style={{ margin: 0, color: "#334155", lineHeight: 1.7 }}>
                    {reluSummary || "RELU AI a rulat, dar nu a generat inca un sumar mai bogat."}
                  </p>
                  <SuggestionRow
                    label="ESCO sugerat"
                    items={
                      Array.isArray(reluOutput.escoCandidates)
                        ? reluOutput.escoCandidates.map((item) => `${item.code} ${item.label}`)
                        : []
                    }
                  />
                  <SuggestionRow
                    label="NACE sugerat"
                    items={
                      Array.isArray(reluOutput.naceCandidates)
                        ? reluOutput.naceCandidates.map((item) => `${item.code} ${item.label}`)
                        : []
                    }
                  />
                  <SuggestionRow
                    label="Uniclass sugerat"
                    items={
                      Array.isArray(reluOutput.uniclassCandidates)
                        ? reluOutput.uniclassCandidates.map((item) => `${item.code} ${item.label}`)
                        : []
                    }
                  />
                  <SuggestionRow
                    label="Date pe care RELU le considera utile"
                    items={
                      Array.isArray(reluOutput.missingInformation)
                        ? reluOutput.missingInformation
                        : []
                    }
                  />
                </div>
              ) : null}
            </SectionCard>

            {error ? <div style={errorBanner}>{error}</div> : null}
            {saveMessage ? <div style={successBanner}>{saveMessage}</div> : null}

            <div style={actionBar}>
              <button type="button" onClick={() => router.push("/onboarding/welcome")} style={secondaryButton}>
                Inapoi
              </button>
              <div style={actionMeta}>
                <div style={{ display: "grid", gap: 4, justifyItems: "end" }}>
                  <span style={{ color: "#64748B", fontSize: 14 }}>
                    Campurile marcate cu <strong>{requiredLabel}</strong> trebuie completate pentru a continua.
                  </span>
                  <span style={{ color: "#94A3B8", fontSize: 13 }}>
                    Linkurile optionale ofera context si incredere, dar nu blocheaza onboarding-ul.
                  </span>
                  {loading ? (
                    <span style={{ color: "#94A3B8", fontSize: 13 }}>
                      Verificam daca exista date salvate anterior. Poti continua sa completezi formularul.
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void handleContinue()}
                  disabled={saving}
                  style={{
                    ...primaryButton,
                    opacity: saving ? 0.72 : 1,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Se salveaza..." : "Salveaza si continua"}
                </button>
              </div>
            </div>
          </div>

          <aside style={sideColumn}>
            <SectionCard
              title="Preview public"
              description="Asa poate arata profilul tau dupa aprobare si publicare."
            >
              <div style={previewCard}>
                {previewAssetUrl ? (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 6",
                      borderRadius: 16,
                      overflow: "hidden",
                      background: "#E2E8F0",
                    }}
                  >
                    <img
                      src={previewAssetUrl}
                      alt="Preview identitate"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                ) : (
                  <div style={previewPlaceholder}>
                    Adauga o imagine de preview daca vrei sa iti imaginezi profilul public.
                  </div>
                )}
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ color: "#0F766E", fontSize: 12, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>
                    {isCompany ? "Profil companie" : "Profil profesional"}
                  </div>
                  <div style={{ color: "#0F172A", fontSize: 28, fontWeight: 900 }}>
                    {form.displayName.trim() || "Numele tau public"}
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.7 }}>
                    {form.bio.trim() || "Descrierea publica va aparea aici dupa ce completezi cateva detalii esentiale."}
                  </div>
                  {expertiseTags.length > 0 ? <TagList title="Expertiza vizibila" items={expertiseTags} compact /> : null}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {form.website.trim() ? <PreviewPill label="Website" /> : null}
                    {form.linkedinUrl.trim() ? <PreviewPill label="LinkedIn" /> : null}
                    {form.portfolioUrl.trim() ? <PreviewPill label="Portofoliu" /> : null}
                    {form.githubUrl.trim() ? <PreviewPill label="GitHub" /> : null}
                  </div>
                  <div style={previewNote}>
                    Dupa aprobare, doar informatiile confirmate si destinate publicarii devin vizibile.
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Preview imagine"
              description="Optional. In acest pas vezi doar un preview local. Uploadurile persistente raman in workspace-ul de profil."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ color: "#0F172A", fontWeight: 700 }}>Tip preview</span>
                  <select
                    value={previewAssetLabel}
                    onChange={(event) => setPreviewAssetLabel(event.target.value)}
                    style={inputStyle}
                  >
                    <option>Logo / imagine de profil</option>
                    <option>Cover / banner</option>
                    <option>Imagine galerie</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={{ color: "#0F172A", fontWeight: 700 }}>{previewAssetLabel}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={inputStyle}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      if (previewAssetUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(previewAssetUrl);
                      }
                      setPreviewAssetName(file.name);
                      setPreviewAssetUrl(URL.createObjectURL(file));
                    }}
                  />
                </label>
                <span style={fieldMetaText}>
                  {previewAssetName
                    ? `Preview local incarcat: ${previewAssetName}`
                    : "Poti testa aspectul vizual fara sa publici nimic automat."}
                </span>
              </div>
            </SectionCard>

            <SectionCard
              title="Claritate si incredere"
              description="Explicatii scurte pentru utilizatorii care vor sa stie ce urmeaza."
            >
              <div style={checkList}>
                <ChecklistItem text="Poti edita totul si mai tarziu din profilul tau." />
                <ChecklistItem text="Moderarea ramane separata de completarea onboarding-ului." />
                <ChecklistItem text="RELU AI te ajuta cu sugestii, nu cu decizii ascunse." />
                <ChecklistItem text="Company onboarding, CUI si provider-ele externe raman in pasii urmatori." />
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </section>
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
      <div style={fieldHeader}>
        <span style={{ color: "#0F172A", fontWeight: 700 }}>{props.label}</span>
        <span style={{ color: props.required ? "#1B2A6B" : "#64748B", fontSize: 12, fontWeight: 700 }}>
          {props.required ? requiredLabel : optionalLabel}
        </span>
      </div>
      {props.children}
      <span style={fieldMetaText}>{props.helper}</span>
    </label>
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

function SuggestionRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ color: "#0F172A", fontWeight: 700 }}>{label}</div>
      {items.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {items.map((item) => (
            <span key={item} style={suggestionPill}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div style={{ color: "#64748B", fontSize: 14 }}>Inca nu exista o sugestie clara pentru acest camp.</div>
      )}
    </div>
  );
}

function TagList({
  title,
  items,
  compact,
}: {
  title: string;
  items: string[];
  compact?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ color: "#0F172A", fontSize: compact ? 13 : 14, fontWeight: 700 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => (
          <span key={item} style={compact ? compactTagPill : tagPill}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrustPill({ title, text }: { title: string; text: string }) {
  return (
    <div style={trustPill}>
      <div style={{ color: "#1B2A6B", fontWeight: 800 }}>{title}</div>
      <div style={{ color: "#475569", lineHeight: 1.6, fontSize: 14 }}>{text}</div>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={checkDot}>+</span>
      <span style={{ color: "#334155", lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

function PreviewPill({ label }: { label: string }) {
  return <span style={previewPill}>{label}</span>;
}

function InlineWarning({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <span style={warningText}>{message}</span>;
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

function normalizeEmpty(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizePersistedUrl(value: string, label: string, warnings: string[]) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  if (!isValidHttpUrl(normalized)) {
    warnings.push(`${label}: adauga un URL complet daca vrei sa il salvezi.`);
    return undefined;
  }

  return normalized;
}

function buildOptionalUrlGuidance(key: keyof UrlWarningMap) {
  const labels: Record<keyof UrlWarningMap, string> = {
    website: "Website-ul este optional. Daca il adaugi, foloseste un URL complet.",
    linkedinUrl: "LinkedIn este optional. Daca il adaugi, foloseste un URL complet.",
    githubUrl: "GitHub este optional. Daca il adaugi, foloseste un URL complet.",
    portfolioUrl: "Portofoliul este optional. Daca il adaugi, foloseste un URL complet.",
    facebookUrl: "Facebook este optional. Daca il adaugi, foloseste un URL complet.",
    instagramUrl: "Instagram este optional. Daca il adaugi, foloseste un URL complet.",
    youtubeUrl: "YouTube este optional. Daca il adaugi, foloseste un URL complet.",
    tiktokUrl: "TikTok este optional. Daca il adaugi, foloseste un URL complet.",
    twitterUrl: "X / Twitter este optional. Daca il adaugi, foloseste un URL complet.",
  };

  return labels[key];
}

const pageShell: CSSProperties = {
  width: "100%",
};

const pageMain: CSSProperties = {
  maxWidth: 1320,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const contentGrid: CSSProperties = {
  display: "grid",
  gap: 20,
  gridTemplateColumns: "minmax(0, 1.6fr) minmax(300px, 0.9fr)",
  alignItems: "start",
};

const formColumn: CSSProperties = {
  display: "grid",
  gap: 18,
};

const sideColumn: CSSProperties = {
  display: "grid",
  gap: 18,
  alignContent: "start",
};

const sectionCard: CSSProperties = {
  display: "grid",
  gap: 18,
  borderRadius: 24,
  border: "1px solid #E8EBF5",
  background: "#FFFFFF",
  padding: "clamp(18px, 3vw, 28px)",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.05)",
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
  fontSize: "clamp(30px, 4vw, 44px)",
  lineHeight: 1.08,
  fontWeight: 900,
  margin: 0,
  maxWidth: 940,
};

const introStyle: CSSProperties = {
  color: "#334155",
  margin: 0,
  lineHeight: 1.75,
  fontSize: 16,
  maxWidth: 820,
};

const trustStrip: CSSProperties = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const trustPill: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 16,
  borderRadius: 18,
  border: "1px solid #DCE6F7",
  background: "linear-gradient(135deg, #F8FAFC 0%, #F6FBFF 100%)",
};

const defaultsCard: CSSProperties = {
  display: "grid",
  gap: 8,
  borderRadius: 18,
  padding: 18,
  background: "linear-gradient(135deg, #F8FAFC 0%, #F3F7FF 100%)",
  border: "1px solid #DCE6F7",
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

const fieldHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "baseline",
  flexWrap: "wrap",
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
  boxSizing: "border-box",
};

const fieldMetaText: CSSProperties = {
  color: "#64748B",
  fontSize: 13,
  lineHeight: 1.55,
};

const warningText: CSSProperties = {
  color: "#B45309",
  fontSize: 13,
  lineHeight: 1.55,
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

const infoBanner: CSSProperties = {
  borderRadius: 16,
  padding: 14,
  background: "#EFF6FF",
  color: "#1D4ED8",
  border: "1px solid #BFDBFE",
};

const supportNote: CSSProperties = {
  borderRadius: 16,
  padding: 14,
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  color: "#475569",
  lineHeight: 1.6,
  fontSize: 14,
};

const focusCard: CSSProperties = {
  display: "grid",
  gap: 8,
  borderRadius: 18,
  padding: 16,
  background: "#FFF7ED",
  border: "1px solid #FED7AA",
};

const assistantCard: CSSProperties = {
  display: "grid",
  gap: 14,
  borderRadius: 18,
  padding: 18,
  background: "linear-gradient(135deg, #F1F5F9 0%, #EEF2FF 100%)",
  border: "1px solid #D8E0FF",
};

const assistantList: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "#334155",
  lineHeight: 1.7,
};

const reluPanel: CSSProperties = {
  display: "grid",
  gap: 12,
  borderRadius: 18,
  border: "1px solid #E8EBF5",
  background: "#FFFFFF",
  padding: 16,
};

const reluPanelHeader: CSSProperties = {
  color: "#1B2A6B",
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

const tagPill: CSSProperties = {
  borderRadius: 999,
  padding: "7px 12px",
  background: "#F1F5F9",
  color: "#0F172A",
  fontSize: 13,
  fontWeight: 700,
};

const compactTagPill: CSSProperties = {
  ...tagPill,
  fontSize: 12,
  padding: "6px 10px",
};

const suggestionPill: CSSProperties = {
  borderRadius: 999,
  padding: "7px 12px",
  background: "#EEF2FF",
  color: "#3730A3",
  fontSize: 13,
  fontWeight: 700,
};

const linkToggleButton: CSSProperties = {
  border: "1px dashed #94A3B8",
  background: "#FFFFFF",
  color: "#1B2A6B",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 700,
  justifySelf: "start",
};

const previewCard: CSSProperties = {
  display: "grid",
  gap: 16,
};

const previewPlaceholder: CSSProperties = {
  width: "100%",
  aspectRatio: "16 / 6",
  borderRadius: 16,
  border: "1px dashed #CBD5E1",
  display: "grid",
  placeItems: "center",
  color: "#64748B",
  background: "#F8FAFC",
  textAlign: "center",
  padding: 20,
};

const previewNote: CSSProperties = {
  borderRadius: 14,
  padding: 12,
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.6,
};

const previewPill: CSSProperties = {
  borderRadius: 999,
  padding: "7px 11px",
  background: "#ECFDF5",
  color: "#166534",
  fontSize: 12,
  fontWeight: 800,
};

const checkList: CSSProperties = {
  display: "grid",
  gap: 12,
};

const checkDot: CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  width: 22,
  height: 22,
  borderRadius: 999,
  background: "#DCFCE7",
  color: "#166534",
  fontWeight: 900,
  flexShrink: 0,
};

const actionBar: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "center",
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
