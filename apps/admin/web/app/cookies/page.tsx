import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie usage information for the OpenStaff public platform and backoffice surfaces.",
};

export default function CookiesPage() {
  return (
    <StaticInfoPage
      eyebrow="Cookie Policy"
      title="Cookie and browser storage usage on OpenStaff."
      description="OpenStaff uses essential browser storage for authentication continuity, product state, and security-oriented platform behavior. Additional analytics or marketing cookies should only be enabled under explicit production policy."
      primaryCta={{ href: "/privacy", label: "Privacy Policy" }}
      secondaryCta={{ href: "/terms", label: "Terms and Conditions" }}
      highlights={[
        {
          title: "Essential platform behavior",
          description:
            "Authentication, session continuity, and user preferences may rely on browser-side storage to keep the product functional.",
        },
        {
          title: "Security-sensitive defaults",
          description:
            "Operational and admin surfaces should prioritize secure, minimal, and auditable client-side persistence.",
        },
        {
          title: "Policy evolution",
          description:
            "This page should stay aligned with the live deployment contract and any future analytics or consent tooling.",
        },
      ]}
    />
  );
}
