export const openStaffDesignTokens = {
  brand: {
    name: "OpenStaff",
    slogan: "The Structure for Global Work.",
    legalEntity: "ACA STRATEGIC SOLUTIONS S.R.L.",
    cui: "52313191",
    registry: "J2025060195004",
  },

  colors: {
    primaryNavy: "#1A237E",
    accentMint: "#00E676",
    neutralSlate: "#F5F7FA",
    textCharcoal: "#263238",
    white: "#FFFFFF",
    border: "#E2E8F0",
    danger: "#DC2626",
    warning: "#D97706",
    success: "#059669",
  },

  typography: {
    heading: "Montserrat, Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },

  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    full: "9999px",
  },

  shadow: {
    card: "0 16px 40px rgba(15, 23, 42, 0.08)",
    elevated: "0 24px 60px rgba(15, 23, 42, 0.14)",
  },

  spacing: {
    pageX: "2rem",
    pageY: "2rem",
    sectionGap: "2rem",
    cardPadding: "1.25rem",
  },
} as const;

export type OpenStaffDesignTokens = typeof openStaffDesignTokens;