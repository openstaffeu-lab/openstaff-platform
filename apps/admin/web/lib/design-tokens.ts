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
    softNavy: "#EEF2FF",
    softMint: "#ECFDF5",
  },

  typography: {
    heading: "Montserrat, Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },

  footer: {
    emails: {
      general: "info@openstaff.eu",
      gdpr: "gdpr@openstaff.eu",
      legal: "contact@openstaff.eu",
      office: "office@openstaff.eu",
    },
  },
} as const;

export type OpenStaffDesignTokens = typeof openStaffDesignTokens;