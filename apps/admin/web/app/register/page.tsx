"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { getRegistrationDefaults, trackRolloutFunnelEvent } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useOnboardingState } from "@/lib/onboarding";

const COUNTRY_OPTIONS = [
  { code: "RO", label: "Romania" },
  { code: "IE", label: "Ireland" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italy" },
  { code: "ES", label: "Spain" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "DK", label: "Denmark" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "FI", label: "Finland" },
  { code: "GR", label: "Greece" },
] as const;

const LANGUAGE_OPTIONS = [
  { code: "ro", label: "Română" },
  { code: "en", label: "English" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { setPartial } = useOnboardingState();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("RO");
  const [languageCode, setLanguageCode] = useState("ro");
  const [timezone, setTimezone] = useState("Europe/Bucharest");
  const [defaultsMessage, setDefaultsMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void trackRolloutFunnelEvent({
      eventType: "REGISTER_STARTED",
      surface: "register-page",
      sourceId: "public-register",
      dedupeKey: "register-started",
    });

    void getRegistrationDefaults()
      .then((defaults) => {
        setCountryCode(
          COUNTRY_OPTIONS.some((country) => country.code === defaults.countryCode)
            ? defaults.countryCode
            : "RO",
        );
        setLanguageCode(defaults.language === "en" ? "en" : "ro");
        setTimezone(defaults.timezone);
        setPhone((current) => current.trim() || defaults.phonePrefix);
        setDefaultsMessage(defaults.explanation);
      })
      .catch(() => {
        setDefaultsMessage(
          "OpenStaff porneste cu valori implicite pentru Romania atunci cand browserul nu trimite suficiente semnale de localizare.",
        );
      });
  }, []);

  async function handleRegister() {
    setLoading(true);
    setError(null);

    try {
      await register({
        email,
        password,
        countryCode,
        languageCode,
        timezone,
        phone: phone.trim() || undefined,
      });

      setPartial({
        email,
        phone,
        countryCode,
        languageCode,
        timezone,
        currentStep: "identity-type",
      });
      router.push("/onboarding/identity-type");
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "Nu am putut crea contul.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="openstaff-surface rounded-[2.2rem] p-8 md:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">
            OpenStaff
          </div>
          <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">
            Creeaza-ti contul
          </h1>
          <p className="mt-4 text-slate-600">
            Creezi doar contul de autentificare acum. Alegi identitatea profesionala,
            compania sau ambele in pasul urmator.
          </p>
          <div className="mt-8 rounded-[1.7rem] border border-amber-100 bg-amber-50 p-5 text-sm leading-7 text-slate-700">
            Vizibilitatea publica ramane moderata. Inregistrarea nu creeaza automat
            un profil public si nu publica date fara aprobare.
          </div>
          <div className="mt-8 text-sm text-slate-500">
            Ai deja cont?{" "}
            <Link href="/login" className="font-semibold text-brand-navy">
              Intra aici
            </Link>
          </div>
        </section>

        <section className="openstaff-card rounded-[2.2rem] p-8 md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <ProgressPill active={step === 1} index={1} label="Securitate" />
            <ProgressPill active={step === 2} index={2} label="Preferinte" />
          </div>

          {step === 1 ? (
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                  placeholder="team@company.eu"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <PasswordField
                label="Password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!email.trim() || password.length < 8}
                className="w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Country</span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Language</span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                    value={languageCode}
                    onChange={(event) => setLanguageCode(event.target.value)}
                  >
                    {LANGUAGE_OPTIONS.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Timezone</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-600">
                    Phone
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                    placeholder="Optional acum, il poti modifica mai tarziu"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 md:col-span-2">
                  Professional, company, and both identity paths are selected after account creation.
                  Company name, VAT, taxonomy, profile data, and public visibility stay out of the account registration step.
                </div>
              </div>

              {defaultsMessage ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {defaultsMessage}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700"
                >
                  Inapoi
                </button>
                <button
                  type="button"
                  onClick={() => void handleRegister()}
                  disabled={loading}
                  className="w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Se creeaza contul..." : "Creeaza contul"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProgressPill({
  active,
  index,
  label,
}: {
  active: boolean;
  index: number;
  label: string;
}) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        active ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {index}. {label}
    </div>
  );
}
