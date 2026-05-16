import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "ANPC Information",
  description: "Consumer and legal reference information related to OpenStaff platform operations.",
};

export default function AnpcPage() {
  return (
    <StaticInfoPage
      eyebrow="ANPC"
      title="Consumer-facing legal references should remain easy to find."
      description="This page provides a stable public route for Romanian legal and consumer-reference disclosures associated with the OpenStaff platform."
      primaryCta={{ href: "/terms", label: "Terms and Conditions" }}
      secondaryCta={{ href: "/privacy", label: "Privacy Policy" }}
      highlights={[
        {
          title: "Public route stability",
          description:
            "Visible footer links should resolve cleanly in production and avoid dead-end legal navigation.",
        },
        {
          title: "Deployment consistency",
          description:
            "Legal reference routes should remain available after future releases and canonical domain updates.",
        },
        {
          title: "Auditability",
          description:
            "Public-facing compliance surfaces are easier to verify when they exist as first-class routes in the repo.",
        },
      ]}
    />
  );
}
