export const layoutRenderingChecks = [
  "Header renders OpenStaff logo and primary navigation.",
  "Footer renders company legal notice and GDRP contacts.",
  "Mobile navigation stays visible on authenticated small-screen layouts.",
] as const;

export const roleVisibilityChecks = [
  "Project posting CTA is visible to authenticated contractor-side roles.",
  "Messages entry remains accessible from header, mobile nav, and profile.",
  "Role switcher renders all public OpenStaff audience options.",
] as const;

export const complianceUiSafetyChecks = [
  "Eligibility badges remain readable on light cards.",
  "Compliance and notification warnings remain visually distinct from informational status.",
  "Messaging surfaces do not hide dispute, contract, or system-message context.",
] as const;
