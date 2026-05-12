export type StatusLevel = "implemented" | "in_progress" | "error";

export type RouteStatusItem = {
  label: string;
  path: string;
  status: StatusLevel;
  note: string;
};

export const adminRouteStatuses: RouteStatusItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    status: "implemented",
    note: "Entry dashboard exists and is navigable in the active admin app.",
  },
  {
    label: "Projects",
    path: "/projects",
    status: "implemented",
    note: "Connected to the API and surfaces loading, auth, and error states.",
  },
  {
    label: "Contracts",
    path: "/contracts",
    status: "in_progress",
    note: "UI route exists; deeper workflow verification is still needed.",
  },
  {
    label: "Financial",
    path: "/financial",
    status: "in_progress",
    note: "UI route exists; live data validation remains pending.",
  },
  {
    label: "Professionals",
    path: "/professionals",
    status: "in_progress",
    note: "UI route exists; CRUD verification remains pending.",
  },
  {
    label: "Supervisors",
    path: "/supervisors",
    status: "in_progress",
    note: "UI route exists; CRUD verification remains pending.",
  },
  {
    label: "Services",
    path: "/services",
    status: "in_progress",
    note: "UI route exists; backend integration needs validation.",
  },
  {
    label: "Countries & VAT",
    path: "/countries-vat",
    status: "implemented",
    note: "Dedicated route exists in the active admin application.",
  },
  {
    label: "AI Control",
    path: "/ai-control",
    status: "in_progress",
    note: "Interface exists; end-to-end AI governance flow is not fully verified.",
  },
  {
    label: "Admin Users",
    path: "/admin/users",
    status: "implemented",
    note: "Admin section route exists and maps to access-control backend endpoints.",
  },
  {
    label: "Admin Roles",
    path: "/admin/roles",
    status: "implemented",
    note: "Admin roles UI exists and is wired to the active admin area.",
  },
  {
    label: "Comments & Reviews",
    path: "/admin/comments-reviews",
    status: "implemented",
    note: "Moderation screen exists and talks to dedicated API endpoints.",
  },
  {
    label: "Private Messages",
    path: "/admin/private-messages",
    status: "implemented",
    note: "Moderation screen exists and maps to private messaging endpoints.",
  },
  {
    label: "UI Config",
    path: "/admin/ui-config",
    status: "implemented",
    note: "Config route exists and is dedicated to admin theming assets.",
  },
];

export const adminEnvironmentStatus = {
  localApiUrl: "http://localhost:8080",
  productionApiUrl: "https://api.openstaff.eu",
  authMode: "OpenStaff JWT auth via /auth/login and /auth/me with admin role verification in the backoffice client",
};
