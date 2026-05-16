import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy information for OpenStaff public, operational, and admin experiences.",
};

export default function PrivacyPage() {
  return (
    <StaticInfoPage
      eyebrow="Privacy"
      title="Privacy expectations for a workforce and operations platform."
      description="OpenStaff processes account, onboarding, verification, messaging, and operational data to support delivery workflows. Production policy should continue to align with legal review and live infrastructure safeguards."
      primaryCta={{ href: "/cookies", label: "Cookie Policy" }}
      secondaryCta={{ href: "/terms", label: "Terms and Conditions" }}
      highlights={[
        {
          title: "Purpose limitation",
          description:
            "Data should be used to support identity, matching, collaboration, billing, workforce execution, and platform security obligations.",
        },
        {
          title: "Role-based access",
          description:
            "Admin and operational access is expected to remain protected through JWT, permissions, and audit-aware controls.",
        },
        {
          title: "Compliance requests",
          description:
            "The production platform already includes export and delete request foundations that should remain visible to authorized reviewers.",
        },
      ]}
    />
  );
}
