export type AuthenticatedDestination = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon:
    | "dashboard"
    | "opportunities"
    | "companies"
    | "professionals"
    | "projects"
    | "messages"
    | "notifications";
};

export type ShellMode = "PUBLIC" | "ONBOARDING" | "AUTHENTICATED" | "LOADING";

export const AUTHENTICATED_DESTINATIONS: readonly AuthenticatedDestination[] = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: "dashboard" },
  { href: "/jobs", label: "Opportunities", mobileLabel: "Explore", icon: "opportunities" },
  { href: "/companies", label: "Companies", icon: "companies" },
  { href: "/professionals", label: "Professionals", icon: "professionals" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/messages", label: "Messages", icon: "messages" },
  { href: "/notifications", label: "Notifications", icon: "notifications" },
] as const;

export const DESKTOP_COMPACT_DESTINATIONS = AUTHENTICATED_DESTINATIONS.filter(
  ({ href }) => href !== "/companies" && href !== "/professionals",
);

export const DESKTOP_OVERFLOW_DESTINATIONS = AUTHENTICATED_DESTINATIONS.filter(
  ({ href }) => href === "/companies" || href === "/professionals",
);

export const MOBILE_PRIMARY_DESTINATIONS = AUTHENTICATED_DESTINATIONS.filter(
  ({ href }) =>
    href === "/dashboard" ||
    href === "/jobs" ||
    href === "/projects" ||
    href === "/messages",
);

export const MOBILE_OVERFLOW_DESTINATIONS = DESKTOP_OVERFLOW_DESTINATIONS;

const ONBOARDING_PREFIXES = ["/onboarding"];
const AUTHENTICATED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/publish",
  "/projects",
  "/messages",
  "/notifications",
  "/security",
  "/payroll",
  "/workforce",
  "/relu-builder",
];
const DUAL_MODE_DISCOVERY_PREFIXES = [
  "/jobs",
  "/companies",
  "/professionals",
  "/profiles",
];

function matchesPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAuthenticatedDestinationActive(pathname: string, href: string) {
  if (href === "/professionals") {
    return (
      matchesPathPrefix(pathname, "/professionals") ||
      matchesPathPrefix(pathname, "/profiles")
    );
  }

  return matchesPathPrefix(pathname, href);
}

export function isAuthenticatedPresentationPath(pathname: string) {
  return [...AUTHENTICATED_PREFIXES, ...DUAL_MODE_DISCOVERY_PREFIXES].some((prefix) =>
    matchesPathPrefix(pathname, prefix),
  );
}

export function resolveShellMode({
  pathname,
  isReady,
  isAuthenticated,
}: {
  pathname: string;
  isReady: boolean;
  isAuthenticated: boolean;
}): ShellMode {
  if (ONBOARDING_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix))) {
    return "ONBOARDING";
  }

  if (!isReady && isAuthenticatedPresentationPath(pathname)) {
    return "LOADING";
  }

  if (isReady && isAuthenticated && isAuthenticatedPresentationPath(pathname)) {
    return "AUTHENTICATED";
  }

  return "PUBLIC";
}
