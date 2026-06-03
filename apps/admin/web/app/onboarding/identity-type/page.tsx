"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateOnboardingStep } from "@/lib/api";
import { useOnboardingState } from "@/lib/onboarding";

type IdentityType = "PROFESSIONAL" | "COMPANY" | "BOTH";

const IDENTITY_OPTIONS: Array<{
  value: IdentityType;
  title: string;
  description: string;
  next: string;
  actorType: "INDIVIDUAL" | "COMPANY";
}> = [
  {
    value: "PROFESSIONAL",
    title: "Professional Identity",
    description:
      "Create a draft professional identity for your experience, skills, taxonomy, profile, and future verification.",
    next: "/onboarding/identity",
    actorType: "INDIVIDUAL",
  },
  {
    value: "COMPANY",
    title: "Company Identity",
    description:
      "Create a draft company identity for VAT/CUI, registered details, operating address, and company verification.",
    next: "/onboarding/company",
    actorType: "COMPANY",
  },
  {
    value: "BOTH",
    title: "Both",
    description:
      "Start with a professional representative identity, then add a company identity under the same account.",
    next: "/onboarding/identity",
    actorType: "COMPANY",
  },
];

export default function IdentityTypePage() {
  const router = useRouter();
  const { token } = useAuth();
  const { setPartial } = useOnboardingState();
  const [selected, setSelected] = useState<IdentityType>("PROFESSIONAL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function continueToIdentity() {
    if (!token) {
      router.push("/login");
      return;
    }

    const option =
      IDENTITY_OPTIONS.find((candidate) => candidate.value === selected) ??
      IDENTITY_OPTIONS[0];

    setSaving(true);
    setError("");

    try {
      await updateOnboardingStep(
        {
          currentStep: selected === "COMPANY" ? "company" : "identity",
          completedStep: "identity-type",
          completedSteps: [`identity-type:${selected.toLowerCase()}`],
        },
        token,
      );

      setPartial({
        identityType: selected,
        actorType: option.actorType,
        currentStep: selected === "COMPANY" ? "company" : "identity",
      });

      router.push(option.next);
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : "Could not save identity selection.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto grid max-w-5xl gap-8">
        <section className="openstaff-surface rounded-[2.2rem] p-8 md:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">
            Identity onboarding
          </div>
          <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">
            Choose how you operate on OpenStaff
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            Your account is only the sign-in layer. Choose the operational identity
            you want to draft next. Public visibility and verification remain
            approval-gated.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {IDENTITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              className={`rounded-[1.5rem] border bg-white p-6 text-left transition ${
                selected === option.value
                  ? "border-brand-mint shadow-lg shadow-emerald-100"
                  : "border-slate-200"
              }`}
            >
              <div className="text-lg font-bold text-brand-charcoal">
                {option.title}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {option.description}
              </p>
            </button>
          ))}
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => void continueToIdentity()}
            disabled={saving}
            className="rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
