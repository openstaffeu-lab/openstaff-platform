import type { AuthenticatedDestination } from "../../lib/authenticated-navigation";

export type ShellIconName =
  | AuthenticatedDestination["icon"]
  | "chevron"
  | "logout"
  | "menu"
  | "profile"
  | "security";

export function ShellIcon({
  name,
  className = "h-5 w-5",
}: {
  name: ShellIconName;
  className?: string;
}) {
  const common = {
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "opportunities":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
          <path d="M11 8v6M8 11h6" />
        </svg>
      );
    case "companies":
      return (
        <svg {...common}>
          <path d="M4 21V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15" />
          <path d="M16 10h2a2 2 0 0 1 2 2v9M8 8h4M8 12h4M8 16h4M3 21h18" />
        </svg>
      );
    case "professionals":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      );
    case "projects":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M8 6V4h8v2M3 11h18M10 11v2h4v-2" />
        </svg>
      );
    case "messages":
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "security":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
  }
}
