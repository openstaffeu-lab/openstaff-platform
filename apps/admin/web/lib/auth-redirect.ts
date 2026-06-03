import type { AuthUser } from "./api";

const REDIRECT_KEY = "openstaff_web_auth_redirect";

function isSafeLocalPath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login") && !value.startsWith("/two-factor"));
}

export function rememberAuthRedirect(path: string | null | undefined) {
  if (typeof window === "undefined" || !isSafeLocalPath(path)) {
    return;
  }

  window.sessionStorage.setItem(REDIRECT_KEY, path as string);
}

export function loginPathForCurrentLocation() {
  if (typeof window === "undefined") {
    return "/login";
  }

  const next = `${window.location.pathname}${window.location.search}`;
  rememberAuthRedirect(next);
  return `/login?next=${encodeURIComponent(next)}`;
}

export function consumeAuthRedirect(fallback?: string | null) {
  if (typeof window === "undefined") {
    return isSafeLocalPath(fallback) ? (fallback as string) : null;
  }

  const stored = window.sessionStorage.getItem(REDIRECT_KEY);
  window.sessionStorage.removeItem(REDIRECT_KEY);

  if (isSafeLocalPath(stored)) {
    return stored;
  }

  return isSafeLocalPath(fallback) ? (fallback as string) : null;
}

export function defaultAuthenticatedRoute(user: AuthUser) {
  if (user.accountStatus !== "LIVE") {
    return "/security";
  }

  const identity = user.identityState;
  if (!identity?.selectedIdentityType) {
    return "/onboarding/identity-type";
  }

  if (identity.selectedIdentityType === "COMPANY" && !identity.hasCompanyIdentity) {
    return "/onboarding/company";
  }

  if (
    (identity.selectedIdentityType === "PROFESSIONAL" || identity.selectedIdentityType === "BOTH") &&
    !identity.hasProfessionalIdentity
  ) {
    return "/onboarding/identity";
  }

  if (identity.selectedIdentityType === "BOTH" && !identity.hasCompanyIdentity) {
    return "/onboarding/company";
  }

  if (!user.onboardingDone) {
    return user.onboardingCurrentStep === "company" ? "/onboarding/company" : "/onboarding/welcome";
  }

  return "/dashboard";
}

export function resolveAuthenticatedRoute(user: AuthUser, fallback?: string | null) {
  return consumeAuthRedirect(fallback) ?? defaultAuthenticatedRoute(user);
}
