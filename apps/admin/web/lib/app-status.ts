export type StatusLevel = "implemented" | "in_progress" | "error";

export type RouteStatusItem = {
  label: string;
  path: string;
  status: StatusLevel;
  note: string;
};

export const publicRouteStatuses: RouteStatusItem[] = [
  {
    label: "Home",
    path: "/",
    status: "implemented",
    note: "Marketplace home renders and falls back to demo feed when the API is unavailable.",
  },
  {
    label: "Login",
    path: "/login",
    status: "implemented",
    note: "Login route now signs users in through Firebase Auth.",
  },
  {
    label: "Register",
    path: "/register",
    status: "implemented",
    note: "Registration route exists in the active public app.",
  },
  {
    label: "Profile",
    path: "/profile",
    status: "in_progress",
    note: "Profile route exists; complete auth and persistence validation is still pending.",
  },
  {
    label: "Projects list",
    path: "/projects",
    status: "implemented",
    note: "Public projects list route exists and is connected to the active API client.",
  },
  {
    label: "Project details",
    path: "/projects/[id]",
    status: "implemented",
    note: "Dynamic route exists and includes API-backed workflow screens.",
  },
  {
    label: "Project create",
    path: "/projects/new",
    status: "in_progress",
    note: "Route exists; full production workflow validation remains pending.",
  },
  {
    label: "Internal status board",
    path: "/status",
    status: "implemented",
    note: "Internal route added for implementation tracking and environment visibility.",
  },
];

export const publicEnvironmentStatus = {
  localApiUrl: "http://localhost:8080",
  productionApiUrl: "https://api.openstaff.eu",
  authMode: "Firebase Auth client session; API bearer validation still needs backend alignment",
};
