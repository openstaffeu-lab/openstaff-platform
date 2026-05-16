import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "Logistics Services",
  description: "Logistics and operational coordination capabilities for workforce delivery programs.",
};

export default function LogisticsPage() {
  return (
    <StaticInfoPage
      eyebrow="Logistics"
      title="Operational logistics designed around real workforce execution."
      description="OpenStaff supports programs that need staffing visibility, project coordination, compliance readiness, and structured communication across delivery teams."
      primaryCta={{ href: "/projects", label: "Explore Active Projects" }}
      secondaryCta={{ href: "/workforce", label: "Workforce Area" }}
      highlights={[
        {
          title: "Project coordination",
          description:
            "Keep roles, conversations, assignments, and project delivery states connected inside one production workflow.",
        },
        {
          title: "Cross-border readiness",
          description:
            "Use verification, onboarding, and compliance signals to reduce friction before operational mobilization starts.",
        },
        {
          title: "Execution visibility",
          description:
            "Workforce status, attendance, timesheets, and payroll can remain traceable from one platform baseline.",
        },
      ]}
    />
  );
}
