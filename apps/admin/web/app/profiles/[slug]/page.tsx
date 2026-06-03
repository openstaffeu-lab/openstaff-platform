/* eslint-disable @next/next/no-img-element */
import { ApiError, getPublicProfile, resolveAssetUrl, type PublicProfile } from "@/lib/api";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type PublicProfilePageState =
  | { kind: "available"; profile: PublicProfile }
  | { kind: "unavailable"; reason: string };

async function loadPublicProfileState(slug: string): Promise<PublicProfilePageState> {
  try {
    const profile = await getPublicProfile(slug);
    return { kind: "available", profile };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return {
        kind: "unavailable",
        reason:
          error.status === 404
            ? "The profile link does not match an active OpenStaff public profile."
            : error.message,
      };
    }

    throw error;
  }
}

export default async function PublicIdentityProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const state = await loadPublicProfileState(slug);

  if (state.kind === "unavailable") {
    return (
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 96px" }}>
        <section
          style={{
            borderRadius: 28,
            border: "1px solid #D7E0F4",
            background: "white",
            padding: 32,
            color: "#0F172A",
          }}
        >
          <div
            style={{
              color: "#0F766E",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            OpenStaff Public Identity
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "14px 0 12px" }}>
            This profile is not publicly available yet.
          </h1>
          <p style={{ maxWidth: 640, color: "#475569", lineHeight: 1.8 }}>
            {state.reason}
          </p>
          <p style={{ maxWidth: 640, color: "#64748B", lineHeight: 1.8, marginTop: 14 }}>
            Public visibility requires account approval, approved profile moderation, PUBLIC
            visibility, and LIVE profile status.
          </p>
        </section>
      </main>
    );
  }

  const { profile } = state;
  const heroImage = resolveAssetUrl(
    profile.assets.bannerUrl || profile.assets.photoUrl || profile.assets.logoUrl,
  );
  const logoUrl = resolveAssetUrl(profile.assets.logoUrl);
  const photoUrl = resolveAssetUrl(profile.assets.photoUrl);

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 72px" }}>
      <section
        style={{
          borderRadius: 28,
          overflow: "hidden",
          border: "1px solid #D7E0F4",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #0F766E 100%)",
          color: "white",
        }}
      >
        {heroImage ? (
          <div
            style={{ height: 220, background: `center / cover no-repeat url("${heroImage}")` }}
          />
        ) : (
          <div
            style={{
              height: 220,
              background:
                "radial-gradient(circle at top left, rgba(103,232,249,0.28), transparent 38%), linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #0F766E 100%)",
            }}
          />
        )}

        <div style={{ padding: 32 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              alignItems: "center",
            }}
          >
            {photoUrl || logoUrl ? (
              <img
                src={photoUrl || logoUrl || ""}
                alt={profile.displayName}
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 24,
                  objectFit: "cover",
                  border: "3px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.12)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 24,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 34,
                  fontWeight: 800,
                  border: "3px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                {profile.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div style={{ flex: "1 1 420px" }}>
              <div
                style={{
                  color: "#67E8F9",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                }}
              >
                OpenStaff Public Identity
              </div>
              <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "14px 0 10px" }}>
                {profile.displayName}
              </h1>
              {profile.publicHeadline ? (
                <div style={{ fontSize: 18, fontWeight: 600, color: "#E2E8F0" }}>
                  {profile.publicHeadline}
                </div>
              ) : null}
              <p style={{ maxWidth: 760, marginTop: 14, color: "#E2E8F0", lineHeight: 1.8 }}>
                {profile.summary ||
                  profile.description ||
                  "Acest profil public este in curs de completare. Informatiile afisate aici reflecta doar datele aprobate pentru vizibilitate publica."}
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                <Pill label={profile.profileType.replaceAll("_", " ")} />
                <Pill label={`Visibility ${profile.visibility}`} />
                <Pill label={`Status ${profile.status}`} />
                <Pill label={`Moderation ${profile.moderationStatus}`} />
                {profile.trust ? <Pill label={`Trust ${profile.trust.status}`} /> : null}
                {profile.websiteUrl ? <Pill label={profile.websiteUrl} /> : null}
                {profile.languages[0] ? (
                  <Pill
                    label={profile.languages.map((item) => item.code.toUpperCase()).join(", ")}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        <Card title="Identity">
          <div>Slug: /profiles/{profile.slug}</div>
          <div>Country: {profile.geography.country?.name || "-"}</div>
          <div>Region: {profile.geography.region?.name || "-"}</div>
          <div>City: {profile.geography.city?.name || "-"}</div>
          <div>Public email: {profile.publicEmail || "-"}</div>
          <div>Public phone: {profile.publicPhone || "-"}</div>
          <div>Availability: {profile.availabilityStatus}</div>
        </Card>

        <Card title="Company summary">
          <div>Company: {profile.companyName || "-"}</div>
          <div>Website: {profile.websiteUrl || "-"}</div>
          <div>Trade focus: {profile.contractorProfile?.tradeFocus || "-"}</div>
          <div>Service area: {profile.contractorProfile?.serviceArea || "-"}</div>
          <div>Experience: {profile.professionalProfile?.yearsExperience ?? "-"}</div>
        </Card>

        <Card title="Taxonomy">
          <div>
            ESCO:{" "}
            {profile.escoSkills.length
              ? profile.escoSkills.map((item) => `${item.code} ${item.title}`).join(", ")
              : "-"}
          </div>
          <div>
            NACE:{" "}
            {profile.naceCodes.length
              ? profile.naceCodes.map((item) => `${item.code} ${item.title}`).join(", ")
              : "-"}
          </div>
          <div>
            Uniclass:{" "}
            {profile.uniclassCodes.length
              ? profile.uniclassCodes.map((item) => `${item.code} ${item.title}`).join(", ")
              : "-"}
          </div>
          <div>
            Languages:{" "}
            {profile.languages.length
              ? profile.languages.map((item) => item.name).join(", ")
              : "-"}
          </div>
        </Card>
      </section>

      {profile.assets.portfolioUrls.length ? (
        <section style={{ marginTop: 20 }}>
          <Card title="Portfolio media">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {profile.assets.portfolioUrls.map((assetUrl) => {
                const resolvedUrl = resolveAssetUrl(assetUrl);
                return resolvedUrl ? (
                  <a
                    key={assetUrl}
                    href={resolvedUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      minHeight: 180,
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                    }}
                  >
                    <img
                      src={resolvedUrl}
                      alt={`${profile.displayName} portfolio`}
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </a>
                ) : null;
              })}
            </div>
          </Card>
        </section>
      ) : null}
    </main>
  );
}

function Card({
  children,
  title,
}: {
  children: React.ReactNode;
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
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#0F766E",
          marginBottom: 10,
        }}
      >
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
