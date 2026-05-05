export const OPENSTAFF_ROLE_SWITCHER_OPTIONS = [
  "GENERAL_CONTRACTOR",
  "CONTRACTOR",
  "SUBCONTRACTOR",
  "SUPPLIER",
  "PROFESSIONAL",
  "B2B",
  "B2C",
] as const;

export type OpenStaffRoleSwitcherOption =
  (typeof OPENSTAFF_ROLE_SWITCHER_OPTIONS)[number];

export const OPENSTAFF_NAV_ITEMS = [
  { label: "Discover", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Profile", href: "/profile" },
  { label: "Messages", href: "/profile#messages" },
] as const;

export const OPENSTAFF_MOBILE_NAV_ITEMS = [
  { label: "Discover", href: "/" },
  { label: "My Projects", href: "/projects" },
  { label: "Messages", href: "/profile#messages" },
  { label: "Profile", href: "/profile" },
] as const;
