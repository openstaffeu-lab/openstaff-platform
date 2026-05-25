import type { AdminAuthUser } from "./api";

const REDIRECT_KEY = "openstaff_admin_auth_redirect";

function isSafeLocalPath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login") && !value.startsWith("/two-factor"));
}

export function rememberAdminAuthRedirect(path: string | null | undefined) {
  if (typeof window === "undefined" || !isSafeLocalPath(path)) {
    return;
  }

  window.sessionStorage.setItem(REDIRECT_KEY, path as string);
}

export function resolveAdminAuthenticatedRoute(_user: AdminAuthUser, fallback?: string | null): string {
  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem(REDIRECT_KEY);
    window.sessionStorage.removeItem(REDIRECT_KEY);
    if (isSafeLocalPath(stored)) {
      return stored;
    }
  }

  return isSafeLocalPath(fallback) ? (fallback as string) : "/dashboard";
}
