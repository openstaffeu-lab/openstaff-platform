import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "Relu AI",
  description: "Structured AI assistance for project intake, matching, and operational follow-up.",
};

export default function AiPage() {
  return (
    <StaticInfoPage
      eyebrow="Relu AI"
      title="AI-assisted project interpretation without losing operational control."
      description="Relu AI helps teams classify public opportunities, prepare matching recommendations, and route follow-up work into the right operational workflow."
      primaryCta={{ href: "/publish", label: "Publish an Opportunity" }}
      secondaryCta={{ href: "/jobs", label: "Browse Live Work" }}
      highlights={[
        {
          title: "Structured interpretation",
          description:
            "Transform open text into clearer project signals, categories, and execution requirements for review-ready operations.",
        },
        {
          title: "Human-in-the-loop",
          description:
            "Moderation, approvals, and workforce actions remain auditable and reviewable through the admin control plane.",
        },
        {
          title: "Live production routing",
          description:
            "Published opportunities can move from discovery to messaging, verification, workforce execution, and payroll with one shared data layer.",
        },
      ]}
    />
  );
}
