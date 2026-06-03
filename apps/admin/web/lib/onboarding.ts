"use client";

import { useEffect, useMemo, useState } from "react";

export const ONBOARDING_STORAGE_KEY = "openstaff-onboarding-state";

export type OnboardingState = {
  actorType: "INDIVIDUAL" | "COMPANY" | "PUBLIC_INSTITUTION";
  identityType: "PROFESSIONAL" | "COMPANY" | "BOTH" | "";
  firstName: string;
  lastName: string;
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
  website: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  expertiseTags: string[];
  uniclassSelections: string[];
  timezone: string;
  currentStep: string;
};

export const defaultOnboardingState: OnboardingState = {
  actorType: "INDIVIDUAL",
  identityType: "",
  firstName: "",
  lastName: "",
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
  website: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  expertiseTags: [],
  uniclassSelections: [],
  timezone: "Europe/Bucharest",
  currentStep: "welcome",
};

export const ONBOARDING_STEPS = [
  { path: "/onboarding/identity-type", label: "Identity type" },
  { path: "/onboarding/welcome", label: "Welcome" },
  { path: "/onboarding/identity", label: "Identity" },
  { path: "/onboarding/company", label: "Company" },
  { path: "/onboarding/completion", label: "Completion" },
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

    return {
      ...defaultOnboardingState,
      ...(JSON.parse(raw) as Partial<OnboardingState>),
    };
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
