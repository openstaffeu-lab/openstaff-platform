import type { Metadata } from "next";
import { StaticInfoPage } from "@/components/marketing/StaticInfoPage";

export const metadata: Metadata = {
  title: "Subcontracting Pools",
  description: "Discover structured subcontracting pools and professional availability signals on OpenStaff.",
};

export default function PoolsPage() {
  return (
    <StaticInfoPage
      eyebrow="Talent Pools"
      title="Subcontracting pools built for repeatable delivery, not one-off searching."
      description="Use OpenStaff to discover professionals, structured capability signals, and readiness indicators that help teams assemble reliable subcontracting capacity."
      primaryCta={{ href: "/professionals", label: "Browse Professionals" }}
      secondaryCta={{ href: "/pricing", label: "See Plans" }}
      highlights={[
        {
          title: "Capability visibility",
          description:
            "Profiles can surface sector fit, taxonomy alignment, and verification-aware signals for faster screening.",
        },
        {
          title: "Follow-up workflows",
          description:
            "When a match makes sense, teams can move into messaging, hiring, workforce activation, and payroll without switching systems.",
        },
        {
          title: "Production-safe gating",
          description:
            "Access to private contact actions can remain governed by subscriptions and operational policy.",
        },
      ]}
    />
  );
}
