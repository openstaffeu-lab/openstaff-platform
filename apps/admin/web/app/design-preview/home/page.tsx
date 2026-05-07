import Link from "next/link";

const sectors = [
  { code: "DC", title: "Data Center", body: "Commissioning, electrical, fit-out, supervision." },
  { code: "PV", title: "Photovoltaic", body: "Utility scale mobilization, site crews, QA workflows." },
  { code: "HR", title: "HoReCa", body: "Operational staffing, verified hospitality talent pools." },
  { code: "LG", title: "Logistics", body: "Critical secondary route that should exist in the final public product." },
];

const jobs = [
  {
    title: "Data Center Commissioning Team",
    meta: ["LIVE", "Netherlands", "Electrical"],
    body: "Need 14 verified specialists for phased mobilization in 10 days.",
    tags: ["72 EUR/h", "Night shift readiness"],
  },
  {
    title: "Site Supervisor - Utility Scale PV",
    meta: ["PENDING REVIEW", "Romania", "Photovoltaic"],
    body: "Cross-border team leadership with compliance package required.",
    tags: ["Long-term", "Accommodation support"],
  },
  {
    title: "Warehouse Operations Crew",
    meta: ["VERIFIED CLIENT", "Germany", "Logistics"],
    body: "High-volume intake with bilingual coordination and rapid onboarding.",
    tags: ["3 shifts", "Transport included"],
  },
];

const professionals = [
  {
    title: "Senior Site Electrician",
    meta: ["Verified", "Romanian / English"],
    body: "Data center and industrial fit-out, mobile in EU, ready in 7 days.",
  },
  {
    title: "PV Project Coordinator",
    meta: ["Documents checked", "German / English"],
    body: "Utility-scale deployment, QA handover, subcontractor coordination.",
  },
  {
    title: "Warehouse Team Lead",
    meta: ["Available now", "Logistics"],
    body: "Shift planning, KPI reporting, multilingual floor coordination.",
  },
];

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "warn" }) {
  const background =
    tone === "success"
      ? "rgba(0, 232, 122, 0.14)"
      : tone === "warn"
        ? "rgba(246, 173, 85, 0.18)"
        : "rgba(27, 42, 107, 0.06)";

  return (
    <span
      style={{
        borderRadius: 999,
        padding: "8px 12px",
        background,
        color: "#1B2A6B",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

export default function DesignPreviewHomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(42, 63, 159, 0.16), transparent 28%), radial-gradient(circle at 88% 10%, rgba(0, 232, 122, 0.2), transparent 24%), linear-gradient(180deg, #ffffff 0%, #f0f2f8 38%, #e7ebf4 100%)",
      }}
    >
      <div style={{ borderBottom: "1px solid rgba(27, 42, 107, 0.08)", background: "rgba(255,255,255,0.82)", backdropFilter: "blur(18px)" }}>
        <div
          style={{
            width: "min(1240px, calc(100% - 48px))",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            padding: "18px 0",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: "linear-gradient(135deg, #00E87A, #A6FFD4)", boxShadow: "0 0 0 8px rgba(0, 232, 122, 0.12)" }} />
            <span>OpenStaff</span>
          </div>

          <div style={{ display: "flex", gap: 22, color: "#5A678F", fontSize: 14, fontWeight: 600, flexWrap: "wrap" }}>
            <span>Sectors</span>
            <span>Professionals</span>
            <span>Projects</span>
            <span>Compliance</span>
            <span>Relu AI</span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ border: "1px solid rgba(27, 42, 107, 0.16)", borderRadius: 16, padding: "14px 20px", fontSize: 14, fontWeight: 700 }}>Login</span>
            <span style={{ borderRadius: 16, padding: "14px 20px", fontSize: 14, fontWeight: 700, background: "#00E87A", color: "#1B2A6B", boxShadow: "0 14px 30px rgba(0, 232, 122, 0.25)" }}>Register</span>
          </div>
        </div>
      </div>

      <div style={{ width: "min(1240px, calc(100% - 48px))", margin: "0 auto", padding: "46px 0 70px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(280px, 0.8fr)", gap: 28 }}>
          <section
            style={{
              border: "1px solid rgba(27, 42, 107, 0.08)",
              borderRadius: 30,
              padding: 40,
              background:
                "radial-gradient(circle at 12% 14%, rgba(0, 232, 122, 0.14), transparent 18%), linear-gradient(135deg, #0e1840 0%, #1b2a6b 48%, #2a3f9f 100%)",
              color: "white",
              boxShadow: "0 24px 60px rgba(27, 42, 107, 0.12)",
            }}
          >
            <div style={{ display: "inline-flex", borderRadius: 999, padding: "8px 12px", background: "rgba(255,255,255,0.08)", color: "#CDE6FF", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              European workforce platform
            </div>
            <h1 style={{ marginTop: 18, fontSize: 58, lineHeight: 1, fontWeight: 800 }}>
              The structure for <span style={{ color: "#00E87A" }}>global work.</span>
            </h1>
            <p style={{ marginTop: 18, maxWidth: 640, color: "rgba(255,255,255,0.82)", fontSize: 19, lineHeight: 1.6 }}>
              OpenStaff connects verified professionals, contractors, and operational teams with
              real projects across Europe in data center, photovoltaic, HoReCa, logistics,
              construction, and industrial delivery.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28 }}>
              <span style={{ borderRadius: 16, padding: "14px 20px", fontSize: 14, fontWeight: 700, background: "#00E87A", color: "#1B2A6B" }}>
                Explore live projects
              </span>
              <span style={{ borderRadius: 16, padding: "14px 20px", fontSize: 14, fontWeight: 700, border: "1px solid rgba(255,255,255,0.24)", background: "rgba(255,255,255,0.08)" }}>
                View verified professionals
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 30 }}>
              {[
                ["1,280+", "Verified professionals in reviewable sectors"],
                ["74", "Active cross-border staffing opportunities"],
                ["16", "Countries covered through compliance-ready flows"],
              ].map(([value, label]) => (
                <div key={label} style={{ borderRadius: 22, padding: 18, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
                  <div style={{ marginTop: 8, color: "rgba(255,255,255,0.72)", fontSize: 13 }}>{label}</div>
                </div>
              ))}
            </div>
          </section>

          <aside
            style={{
              border: "1px solid rgba(27, 42, 107, 0.08)",
              borderRadius: 22,
              padding: 28,
              background: "rgba(255,255,255,0.94)",
              boxShadow: "0 24px 60px rgba(27, 42, 107, 0.12)",
            }}
          >
            <div style={{ color: "#2A3F9F", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Market pulse
            </div>
            <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
              {[
                ["23", "Projects needing fast mobilization"],
                ["146", "Roles matched by Relu AI today"],
                ["31", "Contract packages under review"],
              ].map(([value, label]) => (
                <div key={label} style={{ borderRadius: 18, padding: 18, background: "linear-gradient(180deg, rgba(27, 42, 107, 0.04), rgba(27, 42, 107, 0.02))" }}>
                  <div style={{ color: "#5A678F", fontSize: 13 }}>{label}</div>
                  <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ border: "1px solid rgba(27, 42, 107, 0.08)", borderRadius: 22, padding: 18, marginTop: 18, background: "rgba(255,255,255,0.96)" }}>
              <div style={{ color: "#2A3F9F", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                CMS-managed hero block
              </div>
              <p style={{ marginTop: 10, color: "#5A678F", lineHeight: 1.6 }}>
                Hero title, support banner, CTA labels, and trust metrics are all defined as dynamic
                content modules.
              </p>
            </div>
          </aside>
        </div>

        <section style={{ paddingTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#2A3F9F", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Sectors
              </div>
              <h2 style={{ marginTop: 8, fontSize: 34, color: "#1B2A6B" }}>High-trust activity domains</h2>
            </div>
            <p style={{ maxWidth: 760, color: "#5A678F", lineHeight: 1.6 }}>
              The public front-end should route users by operational vertical, not by generic job
              board taxonomy.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            {sectors.map((sector) => (
              <div
                key={sector.title}
                style={{
                  padding: 22,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.96)",
                  border: "1px solid rgba(27, 42, 107, 0.08)",
                  boxShadow: "0 24px 60px rgba(27, 42, 107, 0.12)",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 18,
                    background: "rgba(27, 42, 107, 0.08)",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  {sector.code}
                </div>
                <h3 style={{ marginTop: 16, fontSize: 20 }}>{sector.title}</h3>
                <p style={{ marginTop: 10, color: "#5A678F", lineHeight: 1.6 }}>{sector.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ paddingTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#2A3F9F", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Featured opportunities
              </div>
              <h2 style={{ marginTop: 8, fontSize: 34, color: "#1B2A6B" }}>Projects designed for fast placement</h2>
            </div>
            <p style={{ maxWidth: 760, color: "#5A678F", lineHeight: 1.6 }}>
              Job cards should make urgency, location, and staffing signal obvious within 5 seconds.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
            {jobs.map((job, index) => (
              <div
                key={job.title}
                style={{
                  padding: 22,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.96)",
                  border: "1px solid rgba(27, 42, 107, 0.08)",
                  boxShadow: "0 24px 60px rgba(27, 42, 107, 0.12)",
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone={index === 0 ? "success" : index === 1 ? "warn" : "success"}>{job.meta[0]}</Pill>
                  <Pill>{job.meta[1]}</Pill>
                  <Pill>{job.meta[2]}</Pill>
                </div>
                <h3 style={{ marginTop: 16, fontSize: 20 }}>{job.title}</h3>
                <p style={{ marginTop: 10, color: "#5A678F", lineHeight: 1.6 }}>{job.body}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  {job.tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ paddingTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#2A3F9F", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Verified workforce
              </div>
              <h2 style={{ marginTop: 8, fontSize: 34, color: "#1B2A6B" }}>Professionals with clear proof signals</h2>
            </div>
            <p style={{ maxWidth: 760, color: "#5A678F", lineHeight: 1.6 }}>
              Profiles should foreground verification, skills, mobility, and compliance readiness.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
            {professionals.map((item) => (
              <div
                key={item.title}
                style={{
                  padding: 22,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.96)",
                  border: "1px solid rgba(27, 42, 107, 0.08)",
                  boxShadow: "0 24px 60px rgba(27, 42, 107, 0.12)",
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone="success">{item.meta[0]}</Pill>
                  <Pill>{item.meta[1]}</Pill>
                </div>
                <h3 style={{ marginTop: 16, fontSize: 20 }}>{item.title}</h3>
                <p style={{ marginTop: 10, color: "#5A678F", lineHeight: 1.6 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 32 }}>
          <Link href="/design-preview" style={{ display: "inline-flex", borderRadius: 14, padding: "12px 14px", background: "rgba(27, 42, 107, 0.08)", fontWeight: 700, color: "#1B2A6B" }}>
            Back to preview index
          </Link>
        </div>
      </div>
    </div>
  );
}
