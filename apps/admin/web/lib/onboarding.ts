"use client";

import { useEffect, useMemo, useState } from "react";

export const ONBOARDING_STORAGE_KEY = "openstaff-onboarding-state";

export type OnboardingState = {
  actorType: "INDIVIDUAL" | "COMPANY" | "PUBLIC_INSTITUTION";
  displayName: string;
  email: string;
  phone: string;
  regionCode: string;
  countryCode: string;
  languageCode: string;
  vatNumber: string;
  naceCode: string;
  naceDescription: string;
  escoOccupations: string[];
  bio: string;
  experienceYears: string;
  companyName: string;
  companyLegalType: "PF" | "PFA" | "II" | "IF" | "SRL" | "SA";
  companyCui: string;
  companyAdministrator: string;
  ciFileUrl: string;
  cazierUrl: string;
};

export const defaultOnboardingState: OnboardingState = {
  actorType: "INDIVIDUAL",
  displayName: "",
  email: "",
  phone: "",
  regionCode: "",
  countryCode: "RO",
  languageCode: "ro",
  vatNumber: "",
  naceCode: "",
  naceDescription: "",
  escoOccupations: [],
  bio: "",
  experienceYears: "",
  companyName: "",
  companyLegalType: "SRL",
  companyCui: "",
  companyAdministrator: "",
  ciFileUrl: "",
  cazierUrl: "",
};

export const ONBOARDING_STEPS = [
  { path: "/onboarding/step-1-type", label: "Tip cont" },
  { path: "/onboarding/step-2-location", label: "Locație" },
  { path: "/onboarding/step-3-classification", label: "Clasificare" },
  { path: "/onboarding/step-4-profile", label: "Profil" },
  { path: "/onboarding/step-5-confirm", label: "Confirmare" },
];

function readState() {
  if (typeof window === "undefined") {
    return defaultOnboardingState;
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return defaultOnboardingState;
    }

    return { ...defaultOnboardingState, ...(JSON.parse(raw) as Partial<OnboardingState>) };
  } catch {
    return defaultOnboardingState;
  }
}

export function useOnboardingState() {
  const [state, setState] = useState<OnboardingState>(defaultOnboardingState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readState());
    setReady(true);
  }, []);

  const api = useMemo(
    () => ({
      ready,
      state,
      setPartial(next: Partial<OnboardingState>) {
        setState((current) => {
          const merged = { ...current, ...next };
          window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      },
      reset() {
        window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        setState(defaultOnboardingState);
      },
    }),
    [ready, state],
  );

  return api;
}
