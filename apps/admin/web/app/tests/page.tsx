import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "Specialized Tests",
  description: "Specialized test and assessment workflows connected to workforce and project readiness.",
};

export default function TestsPage() {
  return (
    <StaticInfoPage
      eyebrow="Specialized Tests"
      title="Assessment workflows that can feed directly into readiness decisions."
      description="OpenStaff can support evidence-based evaluation flows by keeping profile signals, verification artifacts, and downstream workforce actions connected in one environment."
      primaryCta={{ href: "/professionals", label: "See Candidate Profiles" }}
      secondaryCta={{ href: "/compliance", label: "Compliance Overview" }}
      highlights={[
        {
          title: "Document-aware review",
          description:
            "Assessment and evidence trails can stay close to the profiles and cases that teams already review.",
        },
        {
          title: "Operational follow-through",
          description:
            "Validated outcomes can feed directly into hiring, workforce activation, and execution planning.",
        },
        {
          title: "Audit-friendly structure",
          description:
            "Production workflows benefit when assessment-related actions remain traceable inside the same operational system.",
        },
      ]}
    />
  );
}
