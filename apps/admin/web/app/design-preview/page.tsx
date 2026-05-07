import Link from "next/link";
import type { CSSProperties } from "react";

const cardStyle: CSSProperties = {
  border: "1px solid rgba(27, 42, 107, 0.08)",
  borderRadius: 28,
  background: "rgba(255,255,255,0.94)",
  boxShadow: "0 24px 60px rgba(27, 42, 107, 0.12)",
  padding: 28,
};

export default function DesignPreviewIndexPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(42, 63, 159, 0.16), transparent 28%), radial-gradient(circle at 88% 10%, rgba(0, 232, 122, 0.2), transparent 24%), linear-gradient(180deg, #ffffff 0%, #f0f2f8 38%, #e7ebf4 100%)",
      }}
    >
      <div style={{ width: "min(1240px, calc(100% - 48px))", margin: "0 auto", padding: "56px 0 72px" }}>
        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            padding: "8px 12px",
            background: "rgba(27, 42, 107, 0.05)",
            color: "#2A3F9F",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Approval package
        </div>

        <h1
          style={{
            marginTop: 18,
            fontSize: 58,
            lineHeight: 1,
            color: "#1B2A6B",
            fontWeight: 800,
          }}
        >
          OpenStaff design system <span style={{ color: "#00E87A" }}>mockups</span>
        </h1>

        <p
          style={{
            marginTop: 18,
            maxWidth: 760,
            color: "#5A678F",
            fontSize: 19,
            lineHeight: 1.6,
          }}
        >
          These local preview routes are for visual approval before implementation, commit, or deploy.
          Review both surfaces first, then we iterate on hierarchy and modules if needed.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
            marginTop: 28,
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                color: "#2A3F9F",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Public product
            </div>
            <h2 style={{ marginTop: 10, fontSize: 28, color: "#1B2A6B" }}>Home Page mockup</h2>
            <p style={{ marginTop: 12, color: "#5A678F", lineHeight: 1.7 }}>
              Marketplace-oriented landing page with trust metrics, sector routing, active projects,
              verified professionals, and CMS-ready content blocks.
            </p>
            <Link
              href="/design-preview/home"
              style={{
                display: "inline-flex",
                marginTop: 24,
                borderRadius: 14,
                padding: "12px 14px",
                background: "rgba(27, 42, 107, 0.08)",
                color: "#1B2A6B",
                fontWeight: 700,
              }}
            >
              Open Home Page preview
            </Link>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                color: "#2A3F9F",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Backoffice
            </div>
            <h2 style={{ marginTop: 10, fontSize: 28, color: "#1B2A6B" }}>Dashboard mockup</h2>
            <p style={{ marginTop: 12, color: "#5A678F", lineHeight: 1.7 }}>
              Operations cockpit with KPI density, moderation queues, AI governance, and CMS quick
              edit surfaces.
            </p>
            <Link
              href="/design-preview/dashboard"
              style={{
                display: "inline-flex",
                marginTop: 24,
                borderRadius: 14,
                padding: "12px 14px",
                background: "rgba(27, 42, 107, 0.08)",
                color: "#1B2A6B",
                fontWeight: 700,
              }}
            >
              Open Dashboard preview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
