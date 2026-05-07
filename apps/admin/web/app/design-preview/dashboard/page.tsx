import Link from "next/link";

const navItems = [
  "Dashboard",
  "Projects",
  "Contracts",
  "Professionals",
  "Financial",
  "AI Control",
  "Posts",
  "Media",
  "Private Messages",
  "Admin Users",
  "Admin Roles",
  "Status",
];

const kpis = [
  ["Active projects", "74"],
  ["Pending contracts", "31"],
  ["Professionals to review", "58"],
  ["Moderation incidents", "9"],
  ["Relu queue", "23"],
  ["Gemini actions today", "146"],
];

export default function DesignPreviewDashboardPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 10% 10%, rgba(91, 231, 255, 0.08), transparent 18%), radial-gradient(circle at 88% 10%, rgba(0, 232, 122, 0.08), transparent 18%), linear-gradient(180deg, #060b1a 0%, #091126 100%)",
        color: "#EDF3FF",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "292px 1fr", minHeight: "100vh" }}>
        <aside
          style={{
            padding: "26px 22px",
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            background: "rgba(11, 18, 38, 0.9)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div style={{ color: "rgba(216, 226, 255, 0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Operations shell
          </div>
          <h2 style={{ marginTop: 10, fontSize: 28, color: "#5BE7FF" }}>OpenStaff</h2>
          <p style={{ marginTop: 8, color: "rgba(216, 226, 255, 0.64)" }}>Super Admin Control Center</p>

          <nav style={{ display: "grid", gap: 8, marginTop: 28 }}>
            {navItems.map((item, index) => (
              <div
                key={item}
                style={{
                  borderRadius: 16,
                  padding: "12px 14px",
                  color: index === 0 ? "#5BE7FF" : "rgba(233, 240, 255, 0.86)",
                  background: index === 0 ? "rgba(91, 231, 255, 0.12)" : "transparent",
                }}
              >
                {item}
              </div>
            ))}
          </nav>

          <div
            style={{
              marginTop: 28,
              borderRadius: 22,
              padding: 18,
              background: "linear-gradient(180deg, rgba(91, 231, 255, 0.08), rgba(0, 232, 122, 0.08))",
              border: "1px solid rgba(91, 231, 255, 0.12)",
            }}
          >
            <div style={{ color: "rgba(216, 226, 255, 0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              System status
            </div>
            <h3 style={{ marginTop: 10, fontSize: 24 }}>Operational with blockers</h3>
            <p style={{ marginTop: 10, lineHeight: 1.6, color: "rgba(216, 226, 255, 0.74)" }}>
              Contracts, moderation shell, and KPI surfaces are active. AI Control and Posts require
              API/CORS alignment. SUPERADMIN routing depends on Firebase claims.
            </p>
          </div>
        </aside>

        <main style={{ padding: "26px 28px 34px" }}>
          <header style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "rgba(216, 226, 255, 0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                European workforce platform
              </div>
              <h1 style={{ marginTop: 8, fontSize: 40, fontWeight: 800 }}>OpenStaff Control Center</h1>
              <p style={{ marginTop: 10, maxWidth: 760, color: "rgba(216, 226, 255, 0.74)", lineHeight: 1.6 }}>
                Operational cockpit for staffing velocity, moderation quality, AI queues, legal
                readiness, and public experience governance.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", borderRadius: 16, padding: "14px 20px", fontSize: 14, fontWeight: 700, background: "#00E87A", color: "#07101F" }}>
                  Review pending contracts
                </span>
                <span style={{ display: "inline-flex", borderRadius: 16, padding: "14px 20px", fontSize: 14, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "#EDF3FF", border: "1px solid rgba(255,255,255,0.12)" }}>
                  Open CMS quick edit
                </span>
              </div>
            </div>
            <div style={{ borderRadius: 999, padding: "12px 16px", background: "#5BE7FF", color: "#07101F", fontWeight: 800 }}>
              Super Admin
            </div>
          </header>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
            {kpis.map(([label, value]) => (
              <div
                key={label}
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 22,
                  padding: 18,
                  background: "rgba(14, 24, 52, 0.78)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(216, 226, 255, 0.66)" }}>{label}</div>
                <div style={{ marginTop: 12, fontSize: 34, fontWeight: 800, color: "#F4F8FF" }}>{value}</div>
              </div>
            ))}
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1.25fr 0.85fr", gap: 18, marginTop: 18 }}>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 22,
                padding: 22,
                background: "rgba(14, 24, 52, 0.78)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ color: "rgba(216, 226, 255, 0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Operations board
              </div>
              <h2 style={{ marginTop: 8, fontSize: 28 }}>Contract and moderation queue</h2>

              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 18, color: "#EDF3FF" }}>
                <thead>
                  <tr>
                    {["Queue item", "Owner", "Status", "ETA"].map((head) => (
                      <th
                        key={head}
                        style={{
                          padding: "14px 10px",
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          textAlign: "left",
                          fontSize: 14,
                          color: "rgba(216, 226, 255, 0.62)",
                          fontWeight: 600,
                        }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Contract package - NL data center", "Legal Ops", "Pending review", "2h"],
                    ["Public post flagged for compliance", "Moderation", "Needs action", "45m"],
                    ["Professional identity mismatch", "Verification", "Waiting docs", "6h"],
                    ["Client onboarding handoff", "Platform Success", "On track", "Today"],
                  ].map((row, index) => (
                    <tr key={row[0]}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${row[0]}-${cellIndex}`}
                          style={{
                            padding: "14px 10px",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            textAlign: "left",
                            fontSize: 14,
                            color:
                              cellIndex === 2 && index === 0
                                ? "#F6AD55"
                                : cellIndex === 2 && index === 1
                                  ? "#FF7D7D"
                                  : cellIndex === 2 && index === 3
                                    ? "#00E87A"
                                    : "#EDF3FF",
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 22,
                padding: 22,
                background: "rgba(14, 24, 52, 0.78)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ color: "rgba(216, 226, 255, 0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                AI governance
              </div>
              <h2 style={{ marginTop: 8, fontSize: 28 }}>Gemini + Relu health</h2>
              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {[
                  ["Gemini moderation agent", "Used for content review and structured scoring", "Degraded", "#F6AD55"],
                  ["Relu queue processor", "Document summaries and role matching pipeline", "Running", "#00E87A"],
                  ["Backoffice AI Control page", "Current production blocker seen in audit", "API/CORS", "#FF7D7D"],
                ].map(([title, body, state, color]) => (
                  <div
                    key={title}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div>
                      <strong>{title}</strong>
                      <div style={{ marginTop: 6, color: "rgba(216, 226, 255, 0.64)" }}>{body}</div>
                    </div>
                    <div style={{ color }}>{state}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1.25fr 0.85fr", gap: 18, marginTop: 18 }}>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 22,
                padding: 22,
                background: "rgba(14, 24, 52, 0.78)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ color: "rgba(216, 226, 255, 0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                CMS quick edit
              </div>
              <h2 style={{ marginTop: 8, fontSize: 28 }}>Dynamic site governance</h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 18 }}>
                {[
                  ["Logo module", "Primary logo, inverse logo, favicon, footer mark"],
                  ["Hero banner", "Headline, subtitle, CTAs, trust metrics, media"],
                  ["Footer links", "Policies, legal, contact, investor, support groups"],
                  ["Alert strips", "Regional notices, high-priority banners, CTA modules"],
                ].map(([title, body]) => (
                  <div
                    key={title}
                    style={{
                      borderRadius: 18,
                      padding: 16,
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <strong>{title}</strong>
                    <p style={{ marginTop: 8, color: "rgba(216, 226, 255, 0.64)", lineHeight: 1.6 }}>{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 22,
                padding: 22,
                background: "rgba(14, 24, 52, 0.78)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ color: "rgba(216, 226, 255, 0.62)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Approval note
              </div>
              <h2 style={{ marginTop: 8, fontSize: 28 }}>Pre-implementation gate</h2>

              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {[
                  ["Home Page", "Approve visual hierarchy, sectors, trust layout", "Ready", "#00E87A"],
                  ["Dashboard", "Approve KPI density and operations composition", "Ready", "#00E87A"],
                  ["Implementation", "Should begin only after local review and approval", "Blocked until approval", "#F6AD55"],
                ].map(([title, body, state, color]) => (
                  <div
                    key={title}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div>
                      <strong>{title}</strong>
                      <div style={{ marginTop: 6, color: "rgba(216, 226, 255, 0.64)" }}>{body}</div>
                    </div>
                    <div style={{ color }}>{state}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div style={{ marginTop: 32 }}>
            <Link href="/design-preview" style={{ display: "inline-flex", borderRadius: 14, padding: "12px 14px", background: "rgba(255,255,255,0.08)", fontWeight: 700, color: "#EDF3FF" }}>
              Back to preview index
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
