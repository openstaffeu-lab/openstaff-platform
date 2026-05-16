import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "Compliance",
  description: "OpenStaff compliance workflows for verification, documents, and workforce readiness.",
};

export default function CompliancePage() {
  return (
    <StaticInfoPage
      eyebrow="Compliance"
      title="Compliance signals that stay connected to hiring and execution."
      description="Verification status, documents, onboarding progress, and workforce controls are designed to support real delivery, not just static profile badges."
      primaryCta={{ href: "/onboarding", label: "Start Onboarding" }}
      secondaryCta={{ href: "/professionals", label: "View Professionals" }}
      highlights={[
        {
          title: "Verification-aware profiles",
          description:
            "Public and internal visibility can reflect identity and company verification states without leaking sensitive data.",
        },
        {
          title: "Operational guard rails",
          description:
            "Assignment activation, timesheets, and downstream workflows can reuse the same readiness signals to reduce manual checks.",
        },
        {
          title: "Admin oversight",
          description:
            "Backoffice teams can review evidence, progress, and exceptions inside a shared monitoring surface.",
        },
      ]}
    />
  );
}
