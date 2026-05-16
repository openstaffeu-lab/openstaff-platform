import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and conditions overview for OpenStaff platform access and usage.",
};

export default function TermsPage() {
  return (
    <StaticInfoPage
      eyebrow="Terms"
      title="Platform terms should support transparent, operational use."
      description="OpenStaff combines public discovery, messaging, verification, workforce operations, and payroll-adjacent workflows. Terms should remain aligned with the production deployment, billing policy, and access control model."
      primaryCta={{ href: "/privacy", label: "Read Privacy Policy" }}
      secondaryCta={{ href: "/pricing", label: "Pricing" }}
      highlights={[
        {
          title: "Account responsibilities",
          description:
            "Users are expected to provide accurate onboarding, profile, and operational information when required by the workflow.",
        },
        {
          title: "Operational boundaries",
          description:
            "Access to admin and internal capabilities remains subject to role-based permissions and organizational policy.",
        },
        {
          title: "Commercial scope",
          description:
            "Subscription, billing, and workforce-related actions should follow the commercial and compliance rules configured in production.",
        },
      ]}
    />
  );
}
