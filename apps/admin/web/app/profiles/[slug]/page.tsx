import type { ReactNode } from "react";
import { getPublicIdentityProfile } from "@/lib/api";

type PageProps = {
  params: {
    slug: string;
  };
};

export default async function PublicIdentityProfilePage({ params }: PageProps) {
  const { slug } = params;
  const profile = await getPublicIdentityProfile(slug);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 72px" }}>
      <section
        style={{
          borderRadius: 28,
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 65%, #0F766E 100%)",
          color: "white",
          padding: 32,
        }}
      >
        <div style={{ color: "#67E8F9", fontSize: 12, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase" }}>
          OpenStaff Public Identity
        </div>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "14px 0 10px" }}>
          {profile.displayName}
        </h1>
        <p style={{ maxWidth: 720, color: "#E2E8F0", lineHeight: 1.8 }}>
          {profile.bio || "Acest profil public este in curs de completare. Informatiile afisate aici reflecta doar datele aprobate pentru vizibilitate publica."}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          {profile.links.website ? <Pill label={`Website: ${profile.links.website}`} /> : null}
          {profile.links.linkedinUrl ? <Pill label="LinkedIn" /> : null}
          {profile.links.githubUrl ? <Pill label="GitHub" /> : null}
          {profile.links.portfolioUrl ? <Pill label="Portfolio" /> : null}
          <Pill label={`Completion ${profile.publicIndicators.profileCompletionPercent}%`} />
          <Pill label={`Verification ${profile.publicIndicators.verificationStatus}`} />
          {profile.publicIndicators.verificationCaseStatus ? (
            <Pill label={`Case ${profile.publicIndicators.verificationCaseStatus}`} />
          ) : null}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        <Card title="Identity">
          <div>Slug: /profiles/{profile.slug}</div>
          <div>Verification: {profile.publicIndicators.verificationStatus}</div>
          <div>Verification case: {profile.publicIndicators.verificationCaseStatus || "-"}</div>
          <div>Country: {profile.country || "-"}</div>
          <div>City: {profile.city || "-"}</div>
          <div>Language: {profile.language || "-"}</div>
          <div>Timezone: {profile.timezone || "-"}</div>
        </Card>

        <Card title="Company summary">
          <div>Company: {profile.companySummary?.companyName || "-"}</div>
          <div>Legal name: {profile.companySummary?.legalName || "-"}</div>
          <div>Country: {profile.companySummary?.country || "-"}</div>
          <div>City: {profile.companySummary?.city || "-"}</div>
          <div>Verification: {profile.companySummary?.verificationStatus || "-"}</div>
        </Card>
      </section>
    </main>
  );
}

function Card({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #E2E8F0",
        borderRadius: 22,
        padding: 20,
        background: "white",
        color: "#1E293B",
        lineHeight: 1.8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0F766E", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <div
      style={{
        borderRadius: 999,
        padding: "8px 12px",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.2)",
        fontSize: 13,
      }}
    >
      {label}
    </div>
  );
}
